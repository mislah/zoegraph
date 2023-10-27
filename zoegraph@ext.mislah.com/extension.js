const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const { Gio, GObject, St } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

/*
* No second e'er returns once it hath fled
* None a timepiece reveals the same hour once sped 
*/

let Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        static menuItems = [
            {
                label: _('Clock'),
                action: "clock"
            },
            {
                label: _('Zoegraph'),
                action: "zoegraph"
            },
            {
                label: _('Zoegraph Countdown'),
                action: "zoegraph countdown"
            }
        ];

        _init() {
            super._init(0.0, `${Me.metadata.name} Indicator`, false);

            let icon = new St.Icon({
                icon_name: 'clock-symbolic',
                style_class: 'system-status-icon'
            });
            this.actor.add_child(icon);

            Indicator.menuItems.forEach(item => {
                const menuItem = new PopupMenu.PopupMenuItem(item.label);
                menuItem.connect('activate', () => {
                    this.extension.set(item.action)
                });
                this.menu.addMenuItem(menuItem);
            });
        }
    }
);

class Extension {
    #indicator;
    #disp;
    #timeout;
    #offset;

    enable() {
        this.#indicator = new Indicator();
        this.#indicator.extension = this;
        this.settings = ExtensionUtils.getSettings();

        Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, this.#indicator);

        this._connect_set();

        this.set(this.settings.get_string("mode"));
    }
    
    _connect_set(){
        this.settings.connect(
            'changed::mode',
            () => {
                this._handle_change();
            }
        )
        this.settings.connect(
            'changed::offset-clock-x',
            () => {
                this._handle_change();
            }
        )
        this.settings.connect(
            'changed::offset-clock-y',
            () => {
                this._handle_change();
            }
        )
        this.settings.connect(
            'changed::offset-zoegraph-x',
            () => {
                this._handle_change();
            }
        )
        this.settings.connect(
            'changed::offset-zoegraph-y',
            () => {
                this._handle_change();
            }
        )
    }

    _handle_change(){
        this.set(this.settings.get_string("mode"));
    }

    set(opt) {
        if (this.#timeout) {
            Mainloop.source_remove(this.#timeout);
        }
        if (this.#disp) {
            Main.uiGroup.remove_actor(this.#disp);
        }
        this.#disp = new St.Label({ style_class: 'main', text: "00:00:00" });
        if(opt === "clock") {
            this.#clock();
            this.#offset = {
                x: this.settings.get_int("offset-clock-x"),
                y: this.settings.get_int("offset-clock-y")
            };
        }
        else if(opt === "zoegraph") {
            this.#zoegraph({
                anchorDate: this.settings.get_string("zoegraph-anchor-date")
            });
            this.#offset = {
                x: this.settings.get_int("offset-zoegraph-x"),
                y: this.settings.get_int("offset-zoegraph-y")
            };
        }
        else if(opt === "zoegraph countdown") {
            this.#zoegraph({
                anchorDate: this.settings.get_string("zoegraph-anchor-date"),
                precision: this.settings.get_int("zoegraph-precision"),
                refreshInterval: this.settings.get_int("zoegraph-refresh-interval"),
                expectedSpan: this.settings.get_double("zoegraph-anchor-span")
             });
            this.#offset = {
                x: this.settings.get_int("offset-zoegraph-x"),
                y: this.settings.get_int("offset-zoegraph-y")
            };
        }
        else {
            return;
        }
        this.#disp.set_position(
            Main.layoutManager.primaryMonitor.width - this.#disp.width + this.#offset.x,
            Main.layoutManager.primaryMonitor.height - this.#disp.height + this.#offset.y,
        );
        Main.uiGroup.add_actor(this.#disp);
    }

    #clock() {
        let update = () => {
            let date = new Date();
            this.#disp.text = date.toLocaleFormat("%I:%M:%S");
        };
        update();
        this.#timeout = Mainloop.timeout_add_seconds(1, () => {
            update();
            return true;
        });
    }
    
    #zoegraph({anchorDate, precision = 0, refreshInterval = 1, expectedSpan = 0}) {
        const milliSecondsInAYear = 365.25 * 24 * 60 * 60 * 1000;
        let anchorTime = new Date(anchorDate).getTime();
        let offset = new Date().getTimezoneOffset() * 60 * 1000;
        anchorTime += expectedSpan * milliSecondsInAYear;
        this.#timeout = Mainloop.timeout_add(refreshInterval, () => {
            let timeDelta = Math.abs(new Date().getTime() - anchorTime) - offset;
            let timeInYears = timeDelta / milliSecondsInAYear;
            timeInYears = timeInYears.toString().split('.');
            if (precision) {
                timeInYears[1] = timeInYears[1].slice(0, -precision)
            }
            this.#disp.text = timeInYears.join('.');
            return true;
        });
    }

    disable() {
        Main.uiGroup.remove_actor(this.#disp);
        Mainloop.source_remove(this.#timeout);
        this.#indicator.destroy();
    }
}

function init() {
    return new Extension();
}
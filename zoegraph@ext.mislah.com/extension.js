const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const { GObject, St } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const offset = { 
    clock: { x: -50, y: -33},
    zoegraph: { x: -200, y: -33}, 
}

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

        Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, this.#indicator);

        this.set("clock");
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
            this.#offset = offset.clock;
        }
        else if(opt === "zoegraph") {
            this.#zoegraph("2000-01-01");
            this.#offset = offset.zoegraph;
        }
        else if(opt === "zoegraph countdown") {
            this.#zoegraph("2000-01-01", 0, 1, 72.3);
            this.#offset = offset.zoegraph;
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

    /*
    * No second e'er returns once it hath fled
    * None a timepiece reveals the same hour once sped 
    */
    #zoegraph(startDateWithTime, precision = 0, refreshInt = 1, expectedYears = 0) {
        const milliSecondsInAYear = 365.25 * 24 * 60 * 60 * 1000;
        let startTime = new Date(startDateWithTime).getTime();
        startTime += expectedYears * milliSecondsInAYear;
        this.#timeout = Mainloop.timeout_add(refreshInt, () => {
            let timeDelta = Math.abs(new Date().getTime() - startTime);
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
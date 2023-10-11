const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const { GObject, St } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const offset = { x: -50, y: -33 }
// const offset = { x: -200, y: -33 }

let Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, `${Me.metadata.name} Indicator`, false);

            let icon = new St.Icon({
                icon_name: 'clock-symbolic',
                style_class: 'system-status-icon'
            });
            this.actor.add_child(icon);

            let item1 = new PopupMenu.PopupMenuItem(_('Clock'));
            let item2 = new PopupMenu.PopupMenuItem(_('Zoegraph'));
            let item3 = new PopupMenu.PopupMenuItem(_('Zoegraph Countdown'));
            
            item1.connect('activate', () => {
                this.extension.set("clock");
            });
            item2.connect('activate', () => {
                this.extension.set("zoegraph");
            });
            item3.connect('activate', () => {
                this.extension.set("zoegraph countdown");
            });

            this.menu.addMenuItem(item1);
            this.menu.addMenuItem(item2);
            this.menu.addMenuItem(item3);
        }
    }
);

class Extension {
    #indicator;
    #disp;
    #timeout;

    enable() {
        this.#indicator = new Indicator();
        this.#indicator.extension = this;

        Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, this.#indicator);

        this.#disp = new St.Label({ style_class: 'main', text: "00:00:00" });
        this.#disp.set_position(
            Main.layoutManager.primaryMonitor.width - this.#disp.width + offset.x,
            Main.layoutManager.primaryMonitor.height - this.#disp.height + offset.y,
        );
        Main.uiGroup.add_actor(this.#disp);

        this.set("clock");
    }

    set(opt) {
        if (this.#timeout) {
            Mainloop.source_remove(this.#timeout);
        }
        if(opt === "clock") {
            this.#clock();
        }
        else if(opt === "zoegraph") {
            this.#zoegraph("2000-01-01");
        }
        else if(opt === "zoegraph countdown") {
            this.#zoegraph("2000-01-01", 0, 1, 72.3);
        }
    }

    #clock() {
        this.#timeout = Mainloop.timeout_add_seconds(1, () => {
            let date = new Date();
            this.#disp.text = date.toLocaleFormat("%I:%M:%S");
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
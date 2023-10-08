const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const offset = { x: -25, y: -25 }

class Extension {
    #disp;
    #timeout;

    enable() {
        this.#disp = new St.Label({ text: "00:00:00" });
        this.#disp.set_position(
            Main.layoutManager.primaryMonitor.width - this.#disp.width + offset.x,
            Main.layoutManager.primaryMonitor.height - this.#disp.height + offset.y,
        );
        Main.uiGroup.add_actor(this.#disp);
        this.#timeout = Mainloop.timeout_add_seconds(1, () => {
            let date = new Date();
            this.#disp.text = date.toLocaleFormat("%H:%M:%S");
            return true;
        });
    }

    disable() {
        Main.uiGroup.remove_actor(this.#disp);
        Mainloop.source_remove(this.#timeout);
    }
}

function init() {
    return new Extension();
}
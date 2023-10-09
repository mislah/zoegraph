const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

// const offset = { x: -50, y: -33 }
const offset = { x: -200, y: -33 }

class Extension {
    #disp;
    #timeout;

    enable() {
        this.#disp = new St.Label({ style_class: 'main', text: "00:00:00" });
        this.#disp.set_position(
            Main.layoutManager.primaryMonitor.width - this.#disp.width + offset.x,
            Main.layoutManager.primaryMonitor.height - this.#disp.height + offset.y,
        );
        Main.uiGroup.add_actor(this.#disp);

        // this.#clock();
        this.#zoegraph("2000-01-01");
    }

    #clock() {
        this.#timeout = Mainloop.timeout_add_seconds(1, () => {
            let date = new Date();
            this.#disp.text = date.toLocaleFormat("%I:%M:%S");
            return true;
        });
    }

    #zoegraph(startDateWithTime) {
        const startTime = new Date(startDateWithTime).getTime();
        this.#timeout = Mainloop.timeout_add(1, () => {
            let currentTime = new Date().getTime();
            let elapsedTime = ((currentTime - startTime) / 1000) / (365.25 * 24 * 60 * 60);
            this.#disp.text = elapsedTime.toString();
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
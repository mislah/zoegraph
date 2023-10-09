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
        this.#zoegraph("2000-01-01", 0, 1, 72.3);
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
    }
}

function init() {
    return new Extension();
}
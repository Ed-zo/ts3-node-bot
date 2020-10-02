const moment = require("moment");

const DEBUG_MODE = false;

module.exports = class Console {
    static log(text) {
        this.out(text, "Info");
    }

    static warning(text) {
        this.out(text, "Warning");
    }

    static error(text) {
        console.error(`[${moment().format("D.M.Y H:mm:ss")}]: [ERROR]`, text);
    }

    static debug(text) {
        if (DEBUG_MODE) this.out(text, "Debug");
    }

    static out(text, type) {
        console.log(`[${moment().format("D.M.Y H:mm:ss")}]: [${type}]`, text);
    }
};
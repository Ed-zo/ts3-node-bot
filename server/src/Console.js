const moment = require('moment');

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
        this.out(text, "Debug");
    }

    static out(text, type) {
        console.log(`[${moment().format("D.M.Y H:mm:ss")}]: [${type}]`, text);
    }
}
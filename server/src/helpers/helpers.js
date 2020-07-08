const { TeamSpeak, TextMessageTargetMode } = require("ts3-nodejs-library");

/**
 * Deferred Promise
 *
 * @class Deferred
 */
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.state = 0;
            this.reject = (data) => { reject(data); this.state = 2; }
            this.resolve = (data) => { resolve(data); this.state = 1; }
        })
    }
}

/** 
 * @param {TeamSpeak} teamspeak
 * @param {number|string} fromID
 * @returns {(msg: string)=>void} data
 */
var sendMessages = (teamspeak, fromID) => (msg) => teamspeak.sendTextMessage(fromID, TextMessageTargetMode.CLIENT, msg);

/**
 * Calculate number of seconds from points
 *
 * @param {Number} points
 * @returns
 */
function calculateTime(points) {
    return (points * 10 * 60);
}

/**
 * Format seconds to hours, minutes and seconds
 *
 * @param {Number} secs
 * @returns
 */
function secondsToTime(secs) {
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}



module.exports = {
    sendMessages,
    calculateTime,
    secondsToTime,
    Deferred
};
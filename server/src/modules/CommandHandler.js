const SocialBot = require("../SocialBot");
const { TextMessageTargetMode } = require("ts3-nodejs-library");
const EventEmitter = require('events');
const Console = require("../Console");


/**
 * @typedef {Object} Data
 *
 * @property {string} fromID
 * @property {string} fromName
 * @property {string} fromUniqueIdentifier
 * @property {string} message
 * 
 */

class CommandHandler {

    /**
     * Creates an instance of CommandHandler.
     * @param {SocialBot} bot
     * @param {EventEmitter} onMessage
     * @memberof CommandHandler
     */
    constructor(bot, onMessage) {

        /**
         * @type {Object.<string, Command>}
         */
        this.commands = {}
        this.bot = bot;

        onMessage.on("onTextMessage", (data) => {
            data.fromID = data.fromID.toString();
            this.handleClientMessage(data);
        });
    }

    /**
     *
     *
     * @param {Data} data
     * @memberof CommandHandler
     */
    handleClientMessage(data) {
        Console.log(`${data.fromName}: ${data.message}`);
        var seperatedMsg = data.message.match(/'[^']*'|"[^"]*"|\S+/g) || [];

        for (var i in seperatedMsg) {
            if (/\s/.test(seperatedMsg[i]) && typeof seperatedMsg[i] == "string") {
                seperatedMsg[i] = seperatedMsg[i].replace(/'|"/g, "");
            }
        }

        var permission = this.bot.getPermission(data.fromUniqueIdentifier);
        this.handleCommand(seperatedMsg, data, permission);
    }

    async handleCommand(parameters, data, permission) {
        if (parameters.length <= 0)
            return false;

        var command = this.commands[parameters[0]];

        if (command) {
            if (command.permission > permission) {
                this.bot.teamspeak.sendTextMessage(data.fromID, TextMessageTargetMode.CLIENT, "Nemate dostatocne prava!");
                return false;
            }

            try {
                await command.callback(parameters, data, (msg) => {
                    this.bot.teamspeak.sendTextMessage(data.fromID, TextMessageTargetMode.CLIENT, msg);
                })
            } catch (err) {
                Console.error(err);
                Console.error(data);
                this.bot.teamspeak.sendTextMessage(data.fromID, TextMessageTargetMode.CLIENT, "Pocas vykonavania [b]doslo ku chybe[/b]! Nahlaste tento incident adminom.");
            }
        } else {
            this.bot.teamspeak.sendTextMessage(data.fromID, TextMessageTargetMode.CLIENT, "Neznamy prikaz! Skuste pouzit prikaz [b]!help[/b]");
        }
    }

    /**
     * Register a new command
     *
     * @param {string | string[]} command
     * @param {string} name
     * @param {string} description
     * @param {number} permission
     * @param {(parameters: string[], data: Data, response: (msg: string)) => void} callback
     * @memberof CommandHandler
     */
    addCommand(command, name, description, permission, callback) {

        if (Array.isArray(command)) {
            for (var cmd of command) {
                this.addCommand(cmd, name, description, permission, callback);
            }
            return;
        }

        var newCommand = new Command(command, name, description, permission, callback);
        if (newCommand && !(command in this.commands)) {
            this.commands[command] = newCommand;
        }
    }
}

class Command {
    constructor(command, name, description, permission, callback) {
        if (typeof command != "string" ||
            typeof name != "string" ||
            typeof description != "string" ||
            typeof callback != "function" ||
            typeof permission != "number")
            return false;

        this.command = command;
        this.name = name;
        this.description = description;
        this.callback = callback;
        this.permission = permission;
    }
}

module.exports = {
    CommandHandler: CommandHandler,
    Command: Command
}
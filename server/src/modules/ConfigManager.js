const CONFIG = require("../config");
const SocialBot = require("../SocialBot");

class ConfigManager {

    /**
     * Creates an instance of ConfigManager.
     * @param {SocialBot} bot
     * @memberof ConfigManager
     */
    constructor(bot) {
        this.config = CONFIG.config;

        this.bot = bot;

        this.initialize();
    }

    initialize() {

        this.bot.commandHandler.addCommand(["!getconfig", "!config"], "test command", "test command", 10, (parameters, data, response) => {
            for (var key in this.config) {
                response("Value of [b]" + key + "[/b] is equal to [b]" + this.config[key] + "[/b].");
            }
        })

        this.bot.commandHandler.addCommand("!setconfig", "test command", "test command", 10, (parameters, data, response) => {
            if (typeof parameters[1] != "undefined" && typeof parameters[2] != "undefined") {
                if (typeof this.config[parameters[1]] != "undefined") {

                    if (parameters[2] == "true")
                        parameters[2] = true;
                    else if (parameters[2] == "false")
                        parameters[2] = false;

                    this.config[parameters[1]] = parameters[2];

                    response("Value of [b]" + parameters[1] + "[/b] is equal to [b]" + this.config[parameters[1]] + "[/b].");
                }
            } else {
                response("Argument 1 or argument 2 is missing.");
            }
        })
    }

}
module.exports = ConfigManager;
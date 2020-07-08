
const CONFIG = require('./src/config');
const { messageBus } = require("./src/express")
const SocialBot = require("./src/SocialBot")

var bot = new SocialBot(messageBus);

bot.initialize();

var handleStop = async () => {
    await bot.quit()
    process.exit(0);
}

process.on('beforeExit', handleStop);
process.on('SIGINT', handleStop);
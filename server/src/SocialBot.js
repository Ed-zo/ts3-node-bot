const ConfigManager = require('./modules/ConfigManager')
const { CommandHandler } = require('./modules/CommandHandler');
const { TeamSpeak } = require('ts3-nodejs-library');
const CONFIG = require("./config")
const EventEmmiter = require("events");
const mysql = require("promise-mysql");
const Console = require('./Console');
const RankSystem = require('./modules/RankSystem');
const RoomManager = require('./modules/RoomManager');
const moment = require("moment");
const AutoMover = require('./modules/AutoMover');


class SocialBot {

    /**
     * Creates an instance of SocialBot.
     * @param {EventEmmiter} messageBus
     * @memberof SocialBot
     */
    constructor(messageBus) {

        this.commandHandler = new CommandHandler(this, messageBus);
        this.teamspeak = null;
        this.configManager = new ConfigManager(this);
        this.messageBus = messageBus;

        this.commandHandler.addCommand("!help", "test command", "test command", -1, (parameters, data, response) => {

            // response("[b]Aktualne sa vyvija nova verzia Bota, ktora bude fungovat na novej verzii servera (stary bot uz nefungoval)[/b]")

            response("[COLOR=BLUE][b]Nový BOT[/b] - Môže ešte obsahovať chyby[/COLOR]")
            response("[COLOR=BLUE]Pribudol nový príkaz - [b]!automove[/b][/COLOR]")
            response("[COLOR=BLUE]Týmto príkazom si môžete zapnút automatické presúvanie. Pre viac info [b]!automove info[/b][/COLOR]")
            response(" ");
            response("Na vytvorenie roomky použite príkaz : [b]!create <názov roomky> [heslo][/b], napr !create \"moja roomka\" heslo456");
            response("Na vytvorenie subchannelu použite príkaz : [b]!subchannel <nazov>[/b]");
            response(" ");
            response("Roomka ma nastavenú expiráciu po [b]" + Math.floor(moment.duration(this.configManager.config['roomLifespan'], 'second').asHours()) + " hodinách neaktivity[/b]!");
            response("Roomka sa automaticky zmaže po expirácií.");
            response("Stratili ste práva v roomke? [b]!admin[/b]");
            response("Chcete sa presunúť do svojej miestnosti? [b]!move[/b]");
            response("Zabudli ste heslo do svojej roomky? Môžete použite [b]!move[/b] a zmeniť heslo priamo z miestnosti.");
            response("Informacie o rank systeme? [b]!ranks[/b]");
            response("Anti poke? Anti message? [b]!antipoke !antimsg[/b] (RANK 3 +)");

        })

        this.commandHandler.addCommand(["!credits", "!credit"], "Bot credits", "Get bot's credits", -1, (parameters, data, response) => {

            response("This Bot is running on NodeJS " + process.version)
            response("Reworked by Ec_")
            response("Original bot made by Escape with embeding NodeJS into a C++ plugin")

        })

        this.commandHandler.addCommand("!channelid", "test", "test", 10, async (parameters, data, response) => {
            response("Channel_id= " + (await this.teamspeak.getClientById(data.fromID)).cid);
        });

        this.commandHandler.addCommand("!send", "test command", "test command", 10, (parameters, data, response) => {
            response(parameters[1] || "");
        })

        this.commandHandler.addCommand("!test", "test", "test", 10, async (parameters, data, response) => {
            let groups = await this.teamspeak.channelGroupList({type: 1});
            let client = await this.teamspeak.getClientById(data.fromID);
            let channel = await this.teamspeak.getChannelById(client.cid);

            for(let group of groups) {
                try {
                    console.log(await this.teamspeak.channelGroupClientList(group, channel, client.databaseId))
                } catch(e) {}
            }
        });


        //simple helpers for basic message, channel, client operations
        // this.simpleChannel = new simpleChannel(this);
        // this.simpleClient = new simpleClient(this);
        // this.simpleMessage = new simpleMessage(this);

        //commandhandler


        //smart handler for something, because teamspeak is stupid, outdated as fuck
        // this.connectionInfoHandler = new globalConnectionInfoCallbackHandler(this);
        // this.channelCreatedHandler = new globalChannelCreatedCallbackHandler(this);

        //config manager (WIP)

        //room manager
        // this.roomManager = new roomManager(this);
        // this.roomManager.setChannelGroup(5);
        // this.roomManager.setParentChannel(43546);
        // this.roomManager.setMaxChannels(100);

        //simple ranks
        // this.rankManager = new rankManager(this);

        // try {
        //     //nameManager
        //     this.nameManager = new nameManager(this);

        // } catch (err) {
        //     console.log(err, "KEK")
        // }

    }

    getPermission(uid) {
        return (CONFIG.admins.indexOf(uid) != -1) ? 10 : 0;
    }

    async initialize() {
        Console.log(`Connecting to databse...`)
        this.db = await mysql.createPool(CONFIG.db);

        try {
            await this.db.getConnection();
            Console.log(`Connection established`);
        } catch (err) {
            Console.error(err);
            // process.exit(1);
        }

        Console.log(`Connecting to TeamSpeak 3 server on: ${CONFIG.serverQuery.host}`);

        this.teamspeak = await TeamSpeak.connect(CONFIG.serverQuery);

        Console.log("Connected to TS3!");

        this.me = await this.teamspeak.whoami();
        this.teamspeak.on("textmessage", (event) => {
            if (this.me.clientId != event.invoker.clid) {
                this.messageBus.emit("onTextMessage", {
                    fromID: event.invoker.clid,
                    fromName: event.invoker.nickname,
                    fromUniqueIdentifier: event.invoker.uniqueIdentifier,
                    message: event.msg
                })
            }
        })

        this.teamspeak.on("close", async () => {
            Console.log("Disconnected from server, trying to reconnect...")
            await this.teamspeak.reconnect(-1, 5000)
            Console.log("Reconnected!")
        })

        this.rankSystem = new RankSystem(this);
        this.roomManager = new RoomManager(this);
        this.autoMover = new AutoMover(this);
    }

    async quit() {
        Console.log("Turning of the bot...")
        let exec = []
        if(this.teamspeak) {
            Console.log("Disconnecting from TeamSpeak 3 server...");
            exec.push(this.teamspeak.quit())
        }

        if(this.db) {
            Console.log("Disconnecting from the database...")
            exec.push(this.db.end())
        }

        await Promise.all(exec);
    }
}

module.exports = SocialBot;
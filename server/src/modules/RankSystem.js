const SocialBot = require("../SocialBot");
const { secondsToTime, calculateTime } = require('../helpers/helpers');
const CONFIG = require("../config");
const { TextMessageTargetMode, TeamSpeakClient } = require("ts3-nodejs-library");
const Console = require("../Console");

class RankSystem {

    /**
     * Creates an instance of RankSystem.
     * @param {SocialBot} bot
     * @memberof RankSystem
     */
    constructor(bot) {
        this.bot = bot;

        this.pointInterval = false;

        this.anti_msg = CONFIG.groups.anti_msg;
        this.anti_poke = CONFIG.groups.anti_poke;
        this.ranks = CONFIG.groups.ranks;

        this.bot.teamspeak.on("clientconnect", this.onClientConnect.bind(this));

        this.initialize()
    }

    initialize() {

        this.pointInterval = setInterval(this.addPoints.bind(this), 10 * 60 * 1000);

        this.bot.commandHandler.addCommand("!points", "Points", "Get points", -1, async (parameters, data, response) => {
            if (parameters.length == 1) {
                var result = await this.bot.db.query("select * from `ts_users` where uniqueid = ?", [data.fromUniqueIdentifier]);

                if (result.length == 1) {
                    var timeObject = secondsToTime(calculateTime(result[0].points));
                    response("Momentálne máte " + result[0].points + " bodov");
                    response("Stravili ste tu " + timeObject.h + " hodín " + timeObject.m + " minút ");

                } else {
                    response("Momentálne máte 0 bodov");
                }

            } else if (parameters.length == 2 && this.bot.getPermission(data.fromUniqueIdentifier) >= 10) {
                parameters[1] = "%" + parameters[1] + "%"

                var result = await this.bot.db.query("select * from `ts_users` where nick like ? LIMIT 5", [parameters[1]]);

                if (result.length > 0) {
                    for (var i in result) {
                        response(result[i].nick + " - " + result[i].points + " points");
                    }
                } else {
                    response("Užívatel nenajdený.");
                }
            }
        })

        this.bot.commandHandler.addCommand("!antimsg", "test command", "test command", -1, async (parameters, data) => {
            //2 = rank 3
            await this.toggleGroup(data.fromID, data.fromUniqueIdentifier, this.anti_msg, 2);
        })

        this.bot.commandHandler.addCommand("!antipoke", "test command", "test command", -1, async (parameters, data) => {
            //2 = rank 3
            await this.toggleGroup(data.fromID, data.fromUniqueIdentifier, this.anti_poke, 2);
        })

        this.bot.commandHandler.addCommand("!ranks", "test command", "test command", -1, (parameters, data, response) => {

            response("Ranky sú pridelované podla času stráveného na serveri: ");

            var timeObject = {};
            var messageHolder = "";
            var indexer = 0;
            for (var i in this.ranks) {
                if (indexer == 0)
                    messageHolder += "\n";

                timeObject = secondsToTime(calculateTime(this.ranks[i].points));
                messageHolder += "[b]" + this.ranks[i].name + "[/b] " + this.ranks[i].points + " points = " + timeObject.h + "hod + " + this.ranks[i].maxSubChannels + "x subchannel \n";
                indexer++;
                if (indexer >= 10) {
                    indexer = 0;
                    response(messageHolder);
                    messageHolder = "";
                }
            }
            /*this.that.simpleMessage.sendPrivateMessage("RANK 1 - 6 bodov, RANK 2 - 60 bodov, RANK 3 - 144 bodov, RANK 4 - 432 bodov, RANK 5 - 720 bodov", data.fromID);
            this.that.simpleMessage.sendPrivateMessage("RANK 6 - 1008 bodov, RANK 7 - 1440 bodov, RANK 8 - 2016 bodov, RANK 9 - 3024 bodov, RANK 10 - 4032 bodov", data.fromID);
            this.that.simpleMessage.sendPrivateMessage("RANK 11 - 5040 bodov, RANK 12 - 6048 bodov, RANK 13 - 7056 bodov, RANK 14 - 8064 bodov, RANK 15 - 9072 bodov", data.fromID);
            this.that.simpleMessage.sendPrivateMessage("RANK 16 - 11088 bodov, RANK 17 - 13104 bodov, RANK 18 - 15120 bodov, RANK 19 - 17136 bodov, RANK 20 - 28800 bodov", data.fromID);*/
            response("1 bod získate za 10m strávených na serveri.");
            response("Svoje body zistíte príkazom [b]!points[/b].");
            response("Ku dosiahnutým rankom dostanete aj možnosť blokovania správ či pokeov (!antipoke, !antimsg), alebo možnosť vytvoriť subchannel.");
        })
    }

    /**
     * Give ranks based on user points
     * @param {{client: TeamSpeakClient}} client
     * @memberof RankSystem
     */
    async onClientConnect({ client }) {
        if(client.isQuery()) {
            Console.log(`Query ${client.nickname} connected from ${client.connectionClientIp}`)
            return false;
        }

        Console.log(`User ${client.nickname} connected from ${client.connectionClientIp}`);
        let result = await this.bot.db.query("select * from `ts_users` where uniqueid = ?", [client.uniqueIdentifier]);
        if (result.length == 1) {

            this.bot.db.query("UPDATE `ts_users` set user_ip = ? where uniqueid = ?", [client.connectionClientIp || "0.0.0.0", client.uniqueIdentifier])

            var userPoints = result[0].points;
            var userGroups = client.servergroups;

            for (var i = 0; i < this.ranks.length; i++) {

                //Check if user is between group points or above max rank points
                if (userPoints >= this.ranks[i].points &&
                    ((i + 1) >= this.ranks.length || userPoints < this.ranks[i + 1].points)) {
                    if (userGroups.indexOf(this.ranks[i].id.toString()) == -1) {
                        Console.log(`Giving ${this.ranks[i].name} to ${client.nickname}`);
                        client.addGroups(this.ranks[i].id);
                        client.message("Zdravím, práve si získal rank [b]" + this.ranks[i].name + "[/b]. ");
                    }
                } else {
                    if (userGroups.indexOf(this.ranks[i].id.toString()) >= 0) {
                        client.delGroups(this.ranks[i].id);
                        Console.log(`Removing ${this.ranks[i].name} from ${client.nickname}`);
                    }
                }
            }
        }
    }

    /**
     * Toggle a group
     *
     * @param {number} userID
     * @param {string} uniqueID
     * @param {{name: string, id: number}} group
     * @param {number} requiredRank
     * @memberof RankSystem
     */
    async toggleGroup(userID, uniqueID, group, requiredRank) {

        var result = await this.bot.db.query("select * from `ts_users` where uniqueid = ?", [uniqueID]);

        if (result.length == 1 && result[0].points >= this.ranks[requiredRank].points) {

            var client = await this.bot.teamspeak.getClientById(userID);

            if (client.servergroups.indexOf(group.id.toString()) != -1) {
                await this.bot.teamspeak.clientDelServerGroup(client.databaseId, group.id);
                this.bot.teamspeak.sendTextMessage(userID, TextMessageTargetMode.CLIENT, group.name + " je vypnutý.");
            } else {
                await this.bot.teamspeak.clientAddServerGroup(client.databaseId, group.id);
                this.bot.teamspeak.sendTextMessage(userID, TextMessageTargetMode.CLIENT, group.name + " je aktivovaný.");
            }

        } else {
            this.bot.teamspeak.sendTextMessage(userID, TextMessageTargetMode.CLIENT, "Nemáte dostatočne vysoký rank. Je potrebný " + this.ranks[requiredRank].name);
        }

    }

    /**
     * Give a point to every connected user
     *
     * @param {number} [points=1]
     * @memberof RankSystem
     */
    async addPoints(points = 1) {//points wip
        var users = await this.bot.teamspeak.clientList();

        Console.log("Pridavam pointy!");

        var res = [];
        var antidupe = [];

        for (var user of users) {

            var uid = user.uniqueIdentifier;
            var nick = user.nickname;

            var cdate = Math.floor(new Date() / 1000);

            if (antidupe.indexOf(uid) >= 0) {
                //dupe
            } else {
                res.push([nick, 1, uid, cdate]);
            }
            antidupe.push(uid);
        }

        if (users.length <= 0)
            return false;

        this.bot.db.query(`INSERT IGNORE INTO ts_users (nick, points, uniqueid, lastupdate) VALUES ? 
                            ON DUPLICATE KEY UPDATE points = \`points\` + 1, nick = VALUES(nick), lastupdate = VALUES(lastupdate)`, [res])
    }
}

module.exports = RankSystem;
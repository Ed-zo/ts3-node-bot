const SocialBot = require("../SocialBot");
const Console = require("../Console");
const moment = require('moment');
const { getRoomChannelID, getChannelParentTree } = require("../helpers/room_helper");
const CONFIG = require('../config')

class RoomManager {

    /**
     *Creates an instance of RoomManager.
     * @param {SocialBot} bot
     * @memberof RoomManager
     */
    constructor(bot) {
        this.bot = bot;

        this.cleanupInterval = false;

        this.bot.teamspeak.on("clientmoved", this.onClientMoveEvent.bind(this));

        this.initialize();
    }

    initialize() {

        this.cleanupInterval = setInterval(() => {
            if (this.bot.configManager.config['enableCleanup']) {
                this.cleanup(false)
            }
        }, 30 * 60 * 1000);

        this.bot.commandHandler.addCommand("!create", "test command", "test command", -1, this.createChannelRequest.bind(this))
        this.bot.commandHandler.addCommand("!subchannel", "test command", "test command", -1, this.createSubCommandRequest.bind(this))
        this.bot.commandHandler.addCommand("!move", "test command", "test command", -1, this.moveRequest.bind(this))
        this.bot.commandHandler.addCommand("!admin", "test command", "test command", -1, this.getAdminRequest.bind(this))

        this.bot.commandHandler.addCommand("!rooms", "test command", "test command", -1, async (params, data, response) => {
            let rooms = await this.bot.db.query("select * from `ts_rooms` where owner = ?", [data.fromUniqueIdentifier]);
            if (rooms.length > 0) {
                response("Vase miestnosti: ");
                for (let row of rooms) {
                    response("[b]" + row.room_name + "[/b]   ID : " + row.id);
                }
            } else {
                response("[b]Nemáte vytvorenú žiadnu roomku na vaše UNIQUEID.[/b]");
            }
        })

        this.bot.commandHandler.addCommand("!cleanup", "test command", "test command", 10, (parameters, data, response) => {
            this.cleanup(true, (rdata) => {

                response("[b]OKAY ROOMS, EVERYTHING FINE[/b] " + rdata.okayRooms.length + " - " + Math.ceil(rdata.okayRooms.length / 10) + " pages");
                for (var i = 0; i < Math.ceil(rdata.okayRooms.length / 10); i++) {
                    response(JSON.stringify(rdata.okayRooms.slice(i * 10, (i + 1) * 10)));
                }

                response("[b]ROOMS THAT WERE DELETED, BUT ARE IN DB -> DELETE ROOM [/b]" + rdata.deletedRooms.length + " - " + Math.ceil(rdata.deletedRooms.length / 10) + " pages.");
                for (var i = 0; i < Math.ceil(rdata.deletedRooms.length / 10); i++) {
                    response(JSON.stringify(rdata.deletedRooms.slice(i * 10, (i + 1) * 10)));
                }

                response("[b]EXPIRED ROOMS -> DELETE [/b]" + rdata.expiredRooms.length + " - " + Math.ceil(rdata.expiredRooms.length / 10) + " pages.");
                for (var i = 0; i < Math.ceil(rdata.expiredRooms.length / 10); i++) {
                    response(JSON.stringify(rdata.expiredRooms.slice(i * 10, (i + 1) * 10)));
                }

                response("[b]ROOMS THAT WERE DELETED FROM DB BUT STILL EXISTS -> delete [/b]" + rdata.nodbRooms.length + " - " + Math.ceil(rdata.nodbRooms.length / 10) + " pages.");
                for (var i = 0; i < Math.ceil(rdata.nodbRooms.length / 10); i++) {
                    response(JSON.stringify(rdata.nodbRooms.slice(i * 10, (i + 1) * 10)));
                }

            });
        })
    }

    /**
     * @param {import("ts3-nodejs-library/lib/types/Events").ClientMoved} event
     */
    async onClientMoveEvent(event) {
        let channelTree = await getChannelParentTree(this.bot.teamspeak, event.channel.cid);

        //If user moved into a Bot channel
        if (channelTree.indexOf(this.bot.configManager.config['parentRoomChannel'].toString()) != -1) {

            let cdate = Math.floor(moment().add(this.bot.configManager.config['roomLifespan'], 'seconds').valueOf() / 1000);
            let channelID = getRoomChannelID(channelTree, this.bot.configManager.config['parentRoomChannel']);

            await this.bot.db.query('UPDATE `ts_rooms` SET expiration_time = ? where room_id = ?', [cdate, channelID])
            Console.log(`Updating expiration of ${event.channel.name} for ${cdate.toString()}`);
        }
    }


    /**
     * Create a new channel request
     *
     * @param {string[]} params
     * @param {import("./CommandHandler").Data} data
     * @param {(msg: string)=> void} response
     * @returns
     * @memberof RoomManager
     */
    async createChannelRequest(params, data, response) {
        let config = this.bot.configManager.config;

        if (!this.bot.configManager.config["enableRooms"] && !this.bot.getPermission(data.fromUniqueIdentifier) >= 10) {
            response("Lutujeme ale vytvaranie miestnosti je docasne pozastavene.");
            return false;
        }

        if (params.length <= 1) {
            response("Musite vyplnit aspon nazov miestnosti! Format: [b]!create <nazov> [heslo][/b]");
            return false;
        }

        if (params[1].length > 25) {
            response("Nazov miestnosti moze mat maximalne 25 znakov");
            return false;
        }

        if (!this.bot.getPermission(data.fromUniqueIdentifier) >= 10) {
            let botsChannels = await this.bot.teamspeak.channelList({ pid: config['parentRoomChannel'].toString() })

            if (botsChannels.length > config['maxChannels']) {
                response("Vytvorenie roomky zlyhalo, maximálny počet roomiek ( " + config['maxChannels'] + " roomiek) dosiahnutý. ")
                return false;
            }
        }

        let channel = await this.bot.teamspeak.getChannelByName(params[1])

        if (channel) {
            response("Nepodarilo sa vytvoriť roomku, roomka s týmto názvom uź existuje. ");
            return false;
        } else {
            let owner = await this.bot.teamspeak.getClientById(data.fromID);

            var result;
            if (config['oneRoomPerIP']) {
                result = await this.bot.db.query("select * from `ts_rooms` where owner = ? or user_ip = ?", [owner.uniqueIdentifier, owner.connectionClientIp]);
            } else {
                result = await this.bot.db.query("select * from `ts_rooms` where owner = ?", [owner.uniqueIdentifier]);
            }

            if (result.length > 0 && this.bot.getPermission(owner.uniqueIdentifier) < 10) {
                if (config['oneRoomPerIP']) {
                    response("Dosiahli ste maximálny počet roomiek. Ak však naozaj nevlastníte miestnosť, kontaktujte adminov.")
                } else {
                    response("Dosiahli ste maximálny počet roomiek")
                }
                return false;
            }

            let createdChannel = await this.bot.teamspeak.channelCreate(params[1], {
                channelDescription: "Channel created by BOT",
                channelTopic: "Channel created by BOT",
                channelPassword: params[2],
                channelFlagPermanent: true,
                cpid: config['parentRoomChannel']
            })

            var cdate = Math.floor(new Date() / 1000);
            await this.bot.db.query('INSERT INTO `ts_rooms` (`room_name`, `owner`, `creation_date`, `expiration_time`, `room_id`, `user_ip`) VALUES (?, ?, ?, ?, ?, ?)',
                [params[1], owner.uniqueIdentifier, cdate, cdate + config['roomLifespan'], createdChannel.cid, owner.connectionClientIp]
            )

            response("Úspešne som Vám vytvoril roomku, snaď poslúži. Názov roomky [b]" + params[1] + "[/b]" + (params[2] ? (" , heslo [b]" + params[2] + "[/b]") : ""));
            Console.log(`Created a room ${params[1]} for ${owner.nickname}`)

            owner.move(createdChannel);
            this.bot.teamspeak.setClientChannelGroup(CONFIG.groups.channel_admin.id.toString(), createdChannel, owner);

            await this.bot.db.query('INSERT INTO `ts_rooms_backup` (`room_name`, `owner`, `creation_date`, `expiration_time`, `room_id`, `user_ip`) VALUES (?, ?, ?, ?, ?, ?)',
                [params[1], owner.uniqueIdentifier, cdate, cdate + config['roomLifespan'], createdChannel.cid, owner.connectionClientIp]
            )
        }
    }

    /**
    * Create a sub-channel
    *
    * @param {string[]} params
    * @param {import("./CommandHandler").Data} data
    * @param {(msg: string)=> void} response
    * @returns
    * @memberof RoomManager
    */
    async createSubCommandRequest(params, data, response) {

        let result = await this.bot.db.query("select * from `ts_rooms` where owner = ?", [data.fromUniqueIdentifier]);

        let channelName, password;
        var room;
        if (result.length == 0) {
            response("Nemáte vytvorenú žiadnu roomku na vaše UNIQUEID.");
            return false;
        } else if (result.length == 1) {
            room = result[0];
            channelName = params[1];
            password = params[2];
        } else {
            let err = false;
            if (params.length >= 3) {
                let res = await this.bot.db.query("select * from `ts_rooms` where owner = ? and id = ?", [data.fromUniqueIdentifier, params[1]]);
                if (res.length == 0) {
                    err = true;
                } else {
                    room = res[0];
                    channelName = params[2];
                    password = params[3];
                }
            } else {
                err = true;
            }

            if (err) {
                response("V ktorej roomke chcete vytvorit subchannel? Tieto roomky boli zaregistrovane vašim UNIQUEID.");
                response("Vaše miestnosti: ");
                for (let row of result) {
                    response("[b]" + row.room_name + "[/b]   ID : " + row.id);
                }
                response(`[b]!subchannel <id> <názov> [heslo][/b]`);
                response(`Pre vytvorenie subchannelu napr. v roomke ${result[0].id} napíšte príkaz !subchannel ${result[0].id} <názov> [heslo], napr !subchannel ${result[0].id} \"moja roomka\" heslo456`)
                return false;
            }
        }

        if (params.length > 1) {

            let user = await this.bot.teamspeak.getClientById(data.fromID);

            if (!room) {
                response("Nezname channel ID!");
                return false;
            }

            var maxSubChannels = 0;
            for (let rank of CONFIG.groups.ranks) {
                if (user.servergroups.indexOf(rank.id.toString()) != -1) {
                    maxSubChannels = rank.maxSubChannels;
                    break;
                }
            }


            var roomCount = (await this.bot.teamspeak.channelList({ pid: room['room_id'].toString() })).length;

            if (!(this.bot.getPermission(data.fromUniqueIdentifier) >= 10) && roomCount >= maxSubChannels) {
                response("Vytvorenie subchannelu zlyhalo, maximálny počet subchannelov ( " + maxSubChannels + " subchannelov ) dosiahnutý. ");
                return false;
            }

            var channel = await this.bot.teamspeak.channelList({ pid: room['room_id'].toString(), channelName });
            if (channel.length > 0) {
                response("Uz existuje miestnost s takymto nazvom!");
                return false;
            }

            await this.bot.teamspeak.channelCreate(channelName, {
                channelPassword: password,
                channelFlagPermanent: true,
                cpid: room['room_id'].toString()
            })

            response("Úspešne som Vám vytvoril subchannel, snaď poslúži.");
        } else {
            response('Je potrebne vyplnit aspon nazov!')
            response('[b]!subchannel <meno> [heslo][/b]')
        }

    }

    /**
    * Move client to his room
    *
    * @param {string[]} params
    * @param {import("./CommandHandler").Data} data
    * @param {(msg: string)=> void} response
    * @returns
    * @memberof RoomManager
    */
    async moveRequest(params, data, response) {

        let result = await this.bot.db.query("select * from `ts_rooms` where owner = ?", [data.fromUniqueIdentifier]);

        var room;
        if (result.length == 0) {
            response("Nemáte vytvorenú žiadnu roomku na vaše UNIQUEID.");
            return false;
        } else if (result.length == 1) {
            room = result[0];
        } else {
            if (params.length > 1) {
                let res = await this.bot.db.query("select * from `ts_rooms` where owner = ? and id = ?", [data.fromUniqueIdentifier, params[1]]);

                if (res.length == 1) {
                    room = res[0];
                } else {
                    response("Nezname channel ID!");
                    return false;
                }
            } else {
                response("Vlastnite viac miestnosti! Pouzite prikaz [b]!rooms[/b] pre ziskanie ID a pouzite prikaz [b]!move <id>[/b]")
                return false;
            }
        }

        if (room) {
            this.bot.teamspeak.clientMove(data.fromID, room['room_id']);
        }
    }

    /**
    * Get channel admin in own room
    *
    * @param {string[]} params
    * @param {import("./CommandHandler").Data} data
    * @param {(msg: string)=> void} response
    * @returns
    * @memberof RoomManager
    */
    async getAdminRequest(params, data, response) {

        let result = await this.bot.db.query("select * from `ts_rooms` where owner = ?", [data.fromUniqueIdentifier]);

        var room;
        if (result.length == 0) {
            response("Nemáte vytvorenú žiadnu roomku na vaše UNIQUEID.");
            return false;
        } else if (result.length == 1) {
            room = result[0];
        } else {
            if (params.length > 1) {
                let res = await this.bot.db.query("select * from `ts_rooms` where owner = ? and id = ?", [data.fromUniqueIdentifier, params[1]]);

                if (res.length == 1) {
                    room = res[0];
                } else {
                    response("Nezname channel ID!");
                    return false;
                }
            } else {
                response("Vlastnite viac miestnosti! Pouzite prikaz [b]!rooms[/b] pre ziskanie ID a pouzite prikaz [b]!admin <id>[/b]")
                return false;
            }
        }

        if (room) {
            let user = await this.bot.teamspeak.getClientById(data.fromID);
            this.bot.teamspeak.setClientChannelGroup(CONFIG.groups.channel_admin.id.toString(), room['room_id'], user);
            response("V miestnosti vam bol pridany Channel admin");
        }
    }

    /**
     * Clean up all expired rooms
     *
     * @param {boolean} dryRun
     * @param {Function} callback
     * @memberof RoomManager
     */
    async cleanup(dryRun = true, callback = () => { }) {
        var result = await this.bot.db.query("select * from `ts_rooms`");

        var cdate = Math.floor(new Date() / 1000);

        var databazaRoomky = [];
        var okayRooms = [];
        var deletedRooms = [];
        var expiredRooms = [];
        var nodbRooms = [];
        if (result.length > 0) {

            for (let i in result) {

                databazaRoomky.push(result[i].room_id.toString());

                let room = await this.bot.teamspeak.getChannelById(result[i].room_id.toString());
                if (room && result[i].expiration_time * 1 + 43200 > cdate * 1) {

                    //OK Rooms - update only names
                    okayRooms.push({ id: result[i].room_id, name: room.name });
                    try {
                        await this.bot.db.query('UPDATE `ts_rooms` set room_name = ? where room_id = ?', [room.name, result[i].room_id]);
                    } catch (err) {
                        console.error(err)
                        console.log(room.name)
                    }

                } else if (!room) {

                    //ak neexistuje tak zmazat z db
                    deletedRooms.push({ id: result[i].room_id });
                    //console.log("IN DB, DOES NOT EXIST, NOT EXPIRED -> DELETE", result[i].room_id, room.data[0]);
                    if (dryRun === false) {
                        // await this.bot.db.query('DELETE FROM `ts_rooms` where room_id = ?', [result[i].room_id])
                        console.log("Dleteetee");
                    }

                } else if (result[i].expiration_time * 1 < cdate * 1) {
                    //ak expirovala

                    expiredRooms.push({ id: result[i].room_id, name: room.name });

                    if (dryRun === false) {
                        // this.bot.teamspeak.channelDelete(result[i].room_id);
                        console.log("Dleteetee");
                    }

                }
            }
        }

        var allBotChannels = await this.bot.teamspeak.channelList({ pid: this.bot.configManager.config['parentRoomChannel'].toString() });

        for (let channel of allBotChannels) {
            //If channel is not saved in database
            if (databazaRoomky.indexOf(channel.cid) == -1) {
                if (dryRun === false) {
                    // await this.bot.teamspeak.channelDelete(channel);
                    console.log("Dleteetee");
                }

                nodbRooms.push({ id: channel.cid, name: channel.name });
            }
        }

        if (typeof callback == "function") {
            callback({ okayRooms, deletedRooms, expiredRooms, nodbRooms })
        }

    }

}

module.exports = RoomManager;
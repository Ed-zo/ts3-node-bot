const SocialBot = require("../SocialBot");
const { TeamSpeakClient } = require("ts3-nodejs-library");
const { response } = require("express");

class AutoMover {

    /**
     * Creates an instance of AutoMover.
     * @param {SocialBot} bot
     * @memberof AutoMover
     */
    constructor(bot) {
        this.bot = bot;

        (async () => {
            this.availableChannelGroups = await (await this.bot.teamspeak.channelGroupList({ type: 1 })).filter(g => g.name != "Guest");
            this.bot.teamspeak.on("clientconnect", this.onNewConnection.bind(this));
        })()

        this.bot.commandHandler.addCommand("!automove", "", "", -1, async (params, data, response) => {

            if (params.length > 1) {
                if (params[1] == 'off') {
                    await this.bot.db.query("DELETE FROM automove WHERE uniqueid=?", [data.fromUniqueIdentifier]);
                    response("Automove bol vypnutý");
                } else if (params[1] == 'silent') {
                    let res = await this.bot.db.query("SELECT * FROM automove WHERE uniqueid=?", [data.fromUniqueIdentifier]);
                    if(res.length > 0) {
                        if(res[0]['msg'] == 1) {
                            this.bot.db.query("UPDATE automove SET msg = 0 WHERE uniqueid=?", [data.fromUniqueIdentifier]);
                            response("Nabudúce Vás už nebudem otravovať. Správy vypnute.");
                        } else {
                            this.bot.db.query("UPDATE automove SET msg = 1 WHERE uniqueid=?", [data.fromUniqueIdentifier]);
                            response("Automove správy zapnuté.");
                        }
                    } else {
                        response('Pre vypnutie automove správ musíte mať automove najprv zapnutý!')
                    }
                } else {
                    switch (params[1]) {
                        default:
                            response("Nesprávny tvar príkazu [b]!automove[/b]");
                        case 'info':
                            response("Pre zapnutie automatického presúvania (pri vstupe na server) použíte príkaz [b]!automove[/b] v miestnosti, do ktorej chcete byť presúvaný!")
                            response("[b]Automove je možné zapnúť iba v miestnosti, v ktorej máte skupinu![/b] (Channel admin, Operator, Voice)")
                            response("Ak si želáte túto funkciu vypnuť, použite [b]!automove off[/b]");
                    }
                }
            } else {

                let client = await this.bot.teamspeak.getClientById(data.fromID);
                let channel = await this.bot.teamspeak.getChannelById(client.cid);

                if (channel.flagSemiPermanent || channel.flagPermanent) {
                    let hasChannelGroup = await this.hasChannelGroup(client.databaseId, client.cid);

                    if (hasChannelGroup) {
                        await this.bot.db.query("INSERT INTO automove (uniqueid, room_id) VALUES (?,?) ON DUPLICATE KEY UPDATE room_id = ?", [client.uniqueIdentifier, channel.cid, channel.cid]);
                        response(`[b]Automove zapnutý![/b] Pri budúcej návšteve vás presuniem do miestnosti: [b]${channel.name}[/b]`)
                    } else {
                        response("Automove si môžete zapnúť iba do miestnosti v ktorej máte Channel skupinu (Channel admin, Operator, Voice)")
                    }
                } else {
                    response("Ľutujeme, ale [b]!automove[/b] sa nedá aktivovať v dočasnej (TEMP) miestnosti!");
                }

            }

        })
    }

    /**
     * @param {{client: TeamSpeakClient}} event
     */
    async onNewConnection({ client }) {
        if (client.isQuery()) return false;

        let res = await this.bot.db.query("SELECT * FROM automove WHERE uniqueid=?", [client.uniqueIdentifier]);

        if (res.length > 0) {
            let roomID = res[0]['room_id'].toString();
            let channel = await this.bot.teamspeak.getChannelById(roomID);

            if (channel) {

                let hasChannelGroup = await this.hasChannelGroup(client.databaseId, channel.cid);

                if (hasChannelGroup) {
                    if (client.cid == roomID) return;
                    
                    client.move(roomID);
                    if (res[0]['msg'] == 1) {
                        client.message(`Vitajte na serveri! Automaticky som Vás presunul do [b]${channel.name}[/b].`)
                        client.message('V prípade, že už nechcete byť automaticky presúvany, môžete si túto akciu vypnuť príkazom [b]!automove off[/b]')
                        client.message('Ak nechcete aby som Vám vždy písal pri vstupe použite [b]!automove silent[/b]');
                    }
                } else {
                    client.message("V miestnosti do ktorej ste mali zapnutý [b]!automove[/b] už nemáte práva (skupinu). Automove bude vypnutý.");
                    this.bot.db.query("DELETE FROM automove WHERE uniqueid=?", [client.uniqueIdentifier]);
                }

            } else {
                client.message("Vyzerá, že miestnosť do ktorej ste mali zapnutý [b]!automove[/b] už neexistuje. Automove bude vypnutý.");
                this.bot.db.query("DELETE FROM automove WHERE uniqueid=?", [client.uniqueIdentifier]);
            }
        }
    }

    /**
     * Check if user has a channel group
     *
     * @param {number} clientDBID
     * @param {number} channelID
     * @returns {boolean}
     * @memberof AutoMover
     */
    async hasChannelGroup(clientDBID, channelID) {
        let has = false;
        for (let group of this.availableChannelGroups) {
            try {
                let groups = await this.bot.teamspeak.channelGroupClientList(group, channelID, clientDBID);
                if (groups.length > 0) {
                    has = true;
                    break;
                }
            } catch (err) { }
        }
        return has;
    }
}

module.exports = AutoMover;
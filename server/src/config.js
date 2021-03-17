require('dotenv').config();
const moment = require('moment');

module.exports = {

    client: {
        username: "[Room BOT] !help",
        channel: 70975,
        channelPass: ""
    },

    httpPort: 8080,
    serverQuery: {
        host: 'localhost',
        serverport: 9987,
        username: 'ServerBot',
        password: process.env.SERVER_QUERY_PASS,
        nickname: "[Server BOT]"
    },

    db: {
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: "utf8mb4_unicode_ci"
    },

    admins: process.env.ADMINS.split(";"),

    config: {
        enableRooms: true,
        enableCleanup: false,
        maxChannels: 120,
        parentRoomChannel: 43546,
        roomLifespan: moment.duration(14, 'days').asSeconds(),
        oneRoomPerIP: true //should user be able to create channel if somebody on the IP has already one created ?
    },

    groups: {
        channel_admin: {
            id: 5,
            name: "Channel admin"
        }, 

        anti_poke: {
            id: 47,
            name: "ANTI POKE"
        },

        anti_msg: {
            id: 48,
            name: "ANTI MESSAGE"
        },

        ranks: [
            {
                name: "RANK 1",
                id: 37,
                points: 6,
                maxSubChannels: 0
            },
            {
                name: "RANK 2",
                id: 38,
                points: 60,
                maxSubChannels: 0 //10h
            },
            {
                name: "RANK 3",
                id: 39,
                points: 144,
                maxSubChannels: 0 //1d
            },
            {
                name: "RANK 4",
                id: 40,
                points: 288,
                maxSubChannels: 0
            },
            {
                name: "RANK 5",
                id: 41,
                points: 720,
                maxSubChannels: 0
            },
            {
                name: "RANK 6",
                id: 42,
                points: 1008,
                maxSubChannels: 1 //7d
            },
            {
                name: "RANK 7",
                id: 43,
                points: 1440,
                maxSubChannels: 1 //10d
            },
            {
                name: "RANK 8",
                id: 44,
                points: 2016,
                maxSubChannels: 1 //14d
            },
            {
                name: "RANK 9",
                id: 45,
                points: 3024,
                maxSubChannels: 1 // 21d
            },
            {
                name: "RANK 10",
                id: 46,
                points: 4032,
                maxSubChannels: 1 // 28d
            },
            {
                name: "RANK 11",
                id: 50,
                points: 5040,
                maxSubChannels: 1 //35d
            },
            {
                name: "RANK 12",
                id: 51,
                points: 6048,
                maxSubChannels: 2 //42d
            },
            {
                name: "RANK 13",
                id: 52,
                points: 7056,
                maxSubChannels: 2  //49d
            },
            {
                name: "RANK 14",
                id: 53,
                points: 8064,
                maxSubChannels: 2 //56d
            },
            {
                name: "RANK 15",
                id: 54,
                points: 9072,
                maxSubChannels: 2 //73d
            },
            {
                name: "RANK 16",
                id: 55,
                points: 11088,
                maxSubChannels: 2 //97d
            },
            {
                name: "RANK 17",
                id: 56,
                points: 13104, //111d
                maxSubChannels: 2
            },
            {
                name: "RANK 18",
                id: 57,
                points: 15120, //125d
                maxSubChannels: 2
            },
            {
                name: "RANK 19",
                id: 58,
                points: 17136, //139d
                maxSubChannels: 2
            },
            {
                name: "RANK 20",
                id: 59,
                points: 28800, //200d
                maxSubChannels: 3
            },
        ]
    }
}
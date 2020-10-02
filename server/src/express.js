const CONFIG = require("./config");
const express = require("express");
const EventEmitter = require("events");
const Console = require("./Console");

const app = express();

const messageBus = new EventEmitter();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/", (req, res) => {
    let request = req.body;

    if (request.event == "onTextMessage") {
        let data = request.data;

        messageBus.emit("onTextMessage", data);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.post("/settings", (req, res) => {
    res.send(JSON.stringify(CONFIG.client));
});

app.listen(CONFIG.httpPort, () =>
    Console.log(`Bot HTTP server running at http://localhost:${CONFIG.httpPort}`)
);

module.exports = {
    messageBus: messageBus,
};
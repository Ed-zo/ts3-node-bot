--
-- Testmodule initialisation, this script is called via autoload mechanism when the
-- TeamSpeak 3 client starts.
--

-- CONFIG

HTTP_SERVER_PATH = "http://localhost:8080"

-- CONFIG-END

require("tsbot/sender")

CLIENT_SETTINGS = post({}, "/settings", true)

require("ts3init")            -- Required for ts3RegisterModule
require("tsbot/events")       -- Forwarded TeamSpeak 3 callbacks

local MODULE_NAME = "ts-bot"

-- Define which callbacks you want to receive in your module. Callbacks not mentioned
-- here will not be called. To avoid function name collisions, your callbacks should
-- be put into an own package.
local registeredEvents = {
	onConnectStatusChangeEvent = tsbot_events.onConnectStatusChangeEvent,
    onTextMessageEvent = tsbot_events.onTextMessageEvent
}

-- Register your callback functions with a unique module name.
ts3RegisterModule(MODULE_NAME, registeredEvents)


local serverConnectionHandlerID, error = ts3.guiConnect(1, "Server", CLIENT_SETTINGS['server'], "", CLIENT_SETTINGS['username'] or "Bot", CLIENT_SETTINGS['channel'], CLIENT_SETTINGS['channelPass'], "", "", "", "", "", "", "")
if error == ts3errors.ERROR_ok then
    ts3.printMessageToCurrentTab("serverConnectionHandlerID: " .. serverConnectionHandlerID)
else
    print("Error connecting: " .. error)
end



require("tsbot/sender")
require("ts3defs")

local function onConnectStatusChangeEvent(serverConnectionHandlerID, status, errorNumber)
    print("TSBot: onConnectStatusChangeEvent: " .. serverConnectionHandlerID .. " " .. status .. " " .. errorNumber)

    if status == ts3defs.ConnectStatus.STATUS_CONNECTION_ESTABLISHED then
        local myClientID, error = ts3.getClientID(serverConnectionHandlerID)

        error = ts3.requestClientMove(serverConnectionHandlerID, myClientID, CLIENT_SETTINGS['channel'], CLIENT_SETTINGS['channelPass'])
        if error ~= ts3errors.ERROR_ok then
            print("ERR moving client: " .. error)
        end
    end
end

local function onTextMessageEvent(serverConnectionHandlerID, targetMode, toID, fromID, fromName, fromUniqueIdentifier, message, ffIgnored)
    local myClientID, error = ts3.getClientID(serverConnectionHandlerID)

    if myClientID ~= fromID then

        post({event='onTextMessage', data={fromID=fromID, fromName=fromName, fromUID=fromUniqueIdentifier, message=message}})
        
    end

	return 0
end

tsbot_events = {
    onConnectStatusChangeEvent = onConnectStatusChangeEvent,
    onTextMessageEvent = onTextMessageEvent,
}


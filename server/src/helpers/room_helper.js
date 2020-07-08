/**
 * Get array of room IDs all the way to the root
 *
 * @param {TeamSpeak} teamspeak
 * @param {string} channelID
 * @return {Promise<string[]}
 */
async function getChannelParentTree(teamspeak, channelID) {
    var channel = await teamspeak.getChannelById(channelID);

    if (channel.pid == 0)
        return [channelID, '0'];

    return [channelID, ...await getChannelParentTree(teamspeak, channel.pid)]
}

/**
 * Retrieve channel ID from channel tree based on channel root.
 * This function is used if you want to get parent channel ID from subchannels
 * 
 * @param {string[]} roomTree
 * @param {string|number} roomChannelsRoot
 */
function getRoomChannelID(roomTree, roomChannelsRoot) {
    var i = roomTree.indexOf(roomChannelsRoot.toString())
    return roomTree[i - 1]
}

module.exports = {
    getChannelParentTree,
    getRoomChannelID
}
/*
 Reads player ratings from a url and moves the players to the teams based on the rating
*/
const room = HBInit();

room.pluginSpec = {
    name: `tine2k/balance`,
    author: `tine2k`,
    version: `1.0.0`,
    dependencies: [
        `sav/core`,
    ],
    config: {
        url: 'url',
    },
};

room.onCommand_balance = () => {
    const config = room.getConfig();
    getData(config.url).then(body => {
        room.sendAnnouncement('PlayerList: ' + room.getPlayerList());
        const players = room.getPlayerList()
            .filter(p => p.name !== 'host')
            .map(p => ({
                id: p.id,
                rating: body.filter(r => r.name === p.name).map(r => r.rating)[0]
            }));
        room.sendAnnouncement('Players: ' + JSON.stringify(players));
    });
};

async function getData(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            logError(`Error getting ratings, bad response from API: ${response.status} - ${response.statusText}`);
        } else {
            return await response.json();
        }
    } catch (error) {
        logError(`Error getting ratings: ${error.message}`);
    }
}

function logError(text) {
    console.error(text);
    room.sendAnnouncement(text, null, 16711680, 'bold');
}


/*
 Pushes game statistics to a HTTP endpoint
 inspired by https://github.com/XHerna/hhm-plugins/blob/master/src/tut/gamereview.js
*/
const room = HBInit();

room.pluginSpec = {
    name: `tine2k/push-stats`,
    author: `tine2k`,
    version: `1.0.1`,
    dependencies: [
        `sav/core`,
        `tine2k/stats`,
    ],
    config: {
        url: 'url',
    },
};

let stats;
let timestart;

function createReview(scores) {
    let data = {};
    data.rec = bufferToBase64(room.stopRecording()); // replays
    data.players = room.getPlayerList()
        .filter(p => p.team)
        .map(p => { return {
            name: p.name,
            team: p.team
        }
    });
    data.start = timestart;
    data.scores = scores;
    data.goals = stats.getGoals();
    data.possTeam = stats.getPossessionPerTeam();
    data.distribution = stats.getDistribution();
    data.possPlayer = stats.getPossessionPerPlayer();
    data.passes = stats.getPassesPerPlayer();

    const config = room.getConfig();
    postData(config.url, data, config.username, config.password);
}

function bufferToBase64(buf) {
    return btoa(String.fromCharCode.apply(null, buf));
}

async function postData(url, data, username, password) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + btoa(username + ':' + password),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const body = await response.text();
            logError(`Error posting game stats, bad response from API: ${response.status} - ${response.statusText} - ${body}`);
        } else {
            return response;
        }
    } catch (error) {
        logError(`Error posting game stats: ${error.message}`);
    }
}

function logError(text) {
    console.error(text);
    room.sendAnnouncement(text, null, 16711680, 'bold');
}

room.onTeamVictory = (scores) => {
    createReview(scores);
}

room.onGameStart = () => {
    room.startRecording();
    timestart = new Date().getTime();
};

room.onGameStop = () => {
    room.stopRecording();
};

room.onRoomLink = () => {
    stats = room.getPlugin('tine2k/stats');
};

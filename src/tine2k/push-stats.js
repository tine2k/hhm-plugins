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
    data.rec = room.stopRecording(); // replays
    data.players = room.getPlayerList()
        .filter(p => p.conn !== 'HOST_CONN')
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

    let xhttp = new XMLHttpRequest();
    let url = room.getConfig().url;
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            console.log(xhttp.response);
        }
    };

    data = JSON.stringify(data);
    xhttp.send(data);
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

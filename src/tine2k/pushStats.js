/* Writes a game's statistics and timestamps into a text file. */
const room = HBInit();

room.pluginSpec = {
    name: `tine2k/pushStats`,
    author: `tine2k`,
    version: `1.0.0`,
    dependencies: [
        `sav/core`,
        `tut/stats`,
    ],
    config: {
        url: 'url',
    },
};

let stats;
let timestart;
let gameEnded = true;

function createReview() {
    if (!gameEnded) {
        gameEnded = true;
    } else {
        return;
    }

    data = {};
    data.rec = room.stopRecording();

    data.players = room.playerList();
    data.goals = stats.getGoals();
    data.distr = stats.outputDistribution();
    data.poss = stats.outputPossessionPerTeam();
    data.possPl = stats.outputPossessionPerPlayer();
    data.passes = stats.outputPassesPerPlayer();

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

room.onCommand_ts = (player, argument, argumentString) => {
    if (!room.getScores()) return;
    let timestamp = {
        time: (((new Date().getTime()) - timestart) / 1000),
        by: player.name,
        label: argumentString,
    };
    timestamps.push(timestamp);
};

room.onPlayerChat = (player, message) => {
    if (message === 'q') {
        if (!room.getScores()) return;
        let timestamp = {
            time: (((new Date().getTime()) - timestart) / 1000),
            by: player.name,
            label: '',
        };
        timestamps.push(timestamp);
        return false;
    }
};

room.onGameStart = () => {
    gameEnded = false;
    timestamps = [];
    room.startRecording();
    timestart = new Date().getTime();
};

room.onGameStop = () => {
    createReview();
};

function outputGoals() {
    goals = stats.getGoals();
    for (goal of goals) {
        room.sendChat(goal);
    }
}

room.onGameTick = () => {
    if (room.getScores().time >= room.getScores().timeLimit) {
        createReview();
    }
};

room.onRoomLink = () => {
    stats = room.getPlugin(`tut/stats`);
};

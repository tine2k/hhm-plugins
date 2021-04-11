/**
 * Heavily inspired by https://github.com/XHerna/hhm-plugins/blob/master/src/tut/stats.js
 *
 * Plugin that calculates stats of the match.
 */
const room = HBInit();

room.pluginSpec = {
    name: `tine2k/stats`,
    author: `tine2k`,
    version: `1.0.0`,
    dependencies: [
        `sav/core`,
    ],
};

const BALL_RADIUS = 10; // radius of the ball
const PLAYER_RADIUS = 15; // radius of the players
const DISTANCE_BALL_TOUCH = BALL_RADIUS + PLAYER_RADIUS + 0.1; // distance necessary for a player touching the ball

let distributionBall = {
    0: 0,
    1: 0,
    2: 0,
};

let possession = {};
let possessionPerTeam = {
    1: 0,
    2: 0,
};
let passes = {};
let pass = null;
let possBuffer = 0;
let gameRunning = false;
let goalScored = false;
let lastTouch = {
    scorer: null,
    assist: null,
};
let goals = [];

room.onGameStart = () => {
    pass = null;
    lastTouch = {
        scorer: null,
        assist: null,
    };
    goals = [];
    passes = {};
    goalScored = false;
    gameRunning = false;
    possBuffer = 0;
    possession = {};
    possessionPerTeam = {
        1: 0,
        2: 0,
    };
    for (let area in distributionBall) {
        distributionBall[area] = 0;
    }
};

room.onPlayerBallKick = (player) => {
    if (!goalScored) {
        pass = player;
        checkPass(player);
        addPossession(player.id);
        updateLastTouch(player);
        possBuffer = 0;
    }
};

room.onGameTick = () => {
    if (!gameRunning) {
        if ((room.getBallPosition().x !== 0 || room.getBallPosition().y !== 0) && !goalScored) {
            gameRunning = true;
        } else {
            return;
        }
    }

    updateDistribution();
    updatePossession();
};

function updateDistribution() {
    updateBallDistribution();
}

function updateBallDistribution() {
    const ball = room.getBallPosition();
    if ((ball.x === 0) && (ball.y === 0)) return;

    distributionBall[getArea(ball.x)] += 1;
}

function getArea(positionX) {
    if (positionX > 90) {
        return 2;
    } else if (positionX < -90) {
        return 1;
    } else return 0;
}

/**
 * returns the distance between two points.
 */
function calculateDistance(p1, p2) {
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * returns the distance between the center of a player and the ball.
 */
function calculateDistancePlayerBall(player) {
    return calculateDistance(player.position, room.getBallPosition());
}

function hasPossession(player) {
    let distanceToBall = calculateDistancePlayerBall(player);
    return distanceToBall < DISTANCE_BALL_TOUCH;
}

function updateLastTouch(player) {
    if (lastTouch.scorer !== null) {
        if (player.id !== lastTouch.scorer.id) {
            lastTouch.assist = lastTouch.scorer;
            lastTouch.scorer = player;
        }
    } else {
        lastTouch.scorer = player;
    }
}
/**
 * updates possession for both teams. a team has possession if
 * it is currently touching the ball or touched the ball latest.
 */
function updatePossession() {
    possBuffer += 1;
    let possPlayers = [];
    for (let player of room.getPlayerList().filter(p => p.team !== 0)) {
        if (hasPossession(player)) {
            possPlayers.push(player.id);
            checkPass(player);
            updateLastTouch(player);
        }
    }

    if (possPlayers.length > 0) {
        for (let i = 0; i < possPlayers.length; i++) {
            addPossession(possPlayers[i]);
        }
    }
}

function addPossession(playerId) {
    possessionPerTeam[room.getPlayer(playerId).team] += possBuffer;
    if (possession[playerId] === undefined) {
        possession[playerId] = possBuffer;
    } else {
        possession[playerId] += possBuffer;
    }
}

function checkPass(player) {
    if (pass !== null && pass.id !== player.id) {
        if (passes[pass.id] === undefined) {
            passes[pass.id] = {
                overall: 1,
                succ: 0,
            };
        } else {
            passes[pass.id].overall += 1;
        }

        if (player.team === pass.team) {
            passes[pass.id].succ += 1;
        }

        pass = null;
    }
}

room.onTeamGoal = (teamId) => {
    gameRunning = false;
    goalScored = true;
    pass = null;

    const goal = createGoal(teamId);
    goals.push(goal);
    room.sendAnnouncement(formatGoal(goal));
};

function createGoal(teamId) {
    const scores = room.getScores();
    const goal = {};
    goal.red = scores.red;
    goal.blue = scores.blue;
    goal.team = teamId;
    goal.ownGoal = lastTouch.scorer.team !== teamId;
    goal.scorer = lastTouch.scorer.name;
    goal.assist = (lastTouch.assist && lastTouch.assist.team === lastTouch.scorer.team) ? lastTouch.assist.name : null;
    goal.timestamp = scores.time;
    return goal;
}

function formatGoal(goal) {
    let output = '' + goal.red + '-' + goal.blue + ' → ';
    if (goal.ownGoal) {
        output = output + '🤦 Owngoal by ' + goal.scorer;
    } else {
        output = output + '⚽️ Goal by ' + goal.scorer;
    }

    if (goal.assist) {
        output = output + ', 💪 Assist by ' + goal.assist;
    }
    return output;
}

room.onPositionsReset = () => {
    goalScored = false;
    lastTouch = {
        scorer: null,
        assist: null,
    };
};

room.getGoals = () => goals;

room.getPossessionPerTeam = () => {
    return calculatePercentage(possessionPerTeam);
};

room.getDistribution = () => {
    return calculatePercentage(distributionBall);
};

room.getPossessionPerPlayer = () => {
    let possPerc = calculatePercentage(possession);
    let players = Object.keys(possPerc);
    return players.map(player => {
        return {
            player: room.getPlayer(player).name,
            poss: possPerc[player]
        };
    });
};

room.getPassesPerPlayer = () => {
    const passesPerPlayer = [];
    for (let player in passes) {
        passesPerPlayer.push({
            player: room.getPlayer(player).name,
            success: passes[player].succ,
            overall: passes[player].overall
        });
    }
    return passesPerPlayer;
};

/**
 * takes a map of names and counters and returns map of names and percentage.
 */
function calculatePercentage(object) {
    let objectPerc = {};
    let sum = 0;
    for (let key in object) {
        sum = sum + object[key];
    }

    for (let key in object) {
        let perc = 100 / sum * object[key];
        objectPerc[key] = perc.toFixed(2);
    }

    return objectPerc;
}

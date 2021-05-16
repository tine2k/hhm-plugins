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
    return getData(config.url).then(body => {
        const minRating = Math.min(...body.map(p => p.rating));
        const lowestRating = minRating === Infinity ? 0.0 : minRating;
        const players = room.getPlayerList()
            .filter(p => p.name !== 'host')
            .map(p => ({
                id: p.id,
                name: p.name,
                rating: body.filter(r => r.name === p.name).map(r => r.rating)[0] || lowestRating
            }));
        const balancedTeams = balanceTeams(players, Math.round(players.length / 2), [], 0, 0);
        // console.log(balancedTeams);

        balancedTeams.team1.forEach(p => room.setPlayerTeam(p.id, 1));
        balancedTeams.team2.forEach(p => room.setPlayerTeam(p.id, 2));

        room.sendAnnouncement('Player ratings: ' + players.map(p => `${p.name}: ${p.rating.toFixed(2)}`).reduce((a,b) => `${a}, ${b}`));
        room.sendAnnouncement(`Teams balanced: ${balancedTeams.r1.toFixed(2)} vs ${balancedTeams.r2.toFixed(2)}`);
    });
};

function balanceTeams(players, teamSize, team, posIndex, playerIndex, bestResult) {
    let currentResult = bestResult;
    for (let i = playerIndex; i < players.length; i++) {
        team[posIndex] = players[i];
        if (posIndex < teamSize - 1) {
            currentResult = balanceTeams(players, teamSize, team.concat(), posIndex + 1, i + 1, currentResult) || currentResult;
        } else {
            const otherTeam = players.filter(p => !team.includes(p));
            const r1 = rateTeam(team);
            const r2 = rateTeam(otherTeam);
            if (!bestResult || Math.abs(r1 - r2) < Math.abs(bestResult.r1 - bestResult.r2)) {
                return {
                    r1: r1,
                    r2: r2,
                    team1: team.concat(),
                    team2: otherTeam
                }
            } else {
                return bestResult;
            }
        }
    }
    return currentResult;
}

function rateTeam(team) {
    return team.map(i => i.rating).reduce((a,b) => a + b);
}

async function getData(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            let errorText = `Error getting ratings, bad response from API: ${response.status} - ${response.statusText}`;
            logError(errorText);
            return Promise.reject(errorText);
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


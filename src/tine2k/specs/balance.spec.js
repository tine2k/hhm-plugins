const roomSpy = jasmine.createSpyObj(['getConfig', 'onCommand_balance', 'sendAnnouncement', 'getPlayerList', 'setPlayerTeam']);
global.HBInit = () => {
    return roomSpy;
};
require('../balance');

describe('plugin', () => {
    beforeEach(() => {
        roomSpy.sendAnnouncement.and.callFake(a => console.log('ANN: ' + a));
        roomSpy.getConfig.and.returnValue({
            url: 'myUrl'
        });
    });

    it('should have to correct name', () => {
        expect(roomSpy.pluginSpec.name).toEqual('tine2k/balance');
    });

    it('should send announcement on 500', () => {
        global.fetch = () => {
            return Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
        };

        roomSpy.getPlayerList.and.returnValue([]);
        let errorText = 'Error getting ratings, bad response from API: 500 - Internal Server Error';
        roomSpy.onCommand_balance().catch(e => {
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith(errorText, null, 16711680, 'bold');
            expect(e).toEqual(errorText);
        });
    });

    it('should balance team of known players', () => {
        const ratings = [
            {name: 'A', rating: 0.1},
            {name: 'B', rating: 0.4},
            {name: 'C', rating: 0.6},
            {name: 'D', rating: 0.7},
            {name: 'E', rating: 0.2}
        ];
        const playerList = [
            {id: 0, name: 'host'},
            {id: 1, name: 'A'},
            {id: 2, name: 'B'},
            {id: 3, name: 'C'},
            {id: 4, name: 'D'},
            {id: 5, name: 'E'},
        ];
        global.fetch = () => {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(ratings)
            });
        };

        roomSpy.getPlayerList.and.returnValue(playerList);
        roomSpy.onCommand_balance().then(() => {
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(1, 1);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(2, 2);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(3, 2);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(4, 1);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(5, 1);
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Player ratings: A: 0.10, B: 0.40, C: 0.60, D: 0.70, E: 0.20');
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Teams balanced: 1.00 vs 1.00');
        });
    });

    it('should balance team of some unknown players', () => {
        const ratings = [
            {name: 'A', rating: 0.1},
            {name: 'B', rating: 0.2}
        ];
        const playerList = [
            {id: 0, name: 'host'},
            {id: 1, name: 'A'},
            {id: 2, name: 'B'},
            {id: 3, name: 'C'},
            {id: 4, name: 'D'},
        ];
        global.fetch = () => {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(ratings)
            });
        };

        roomSpy.getPlayerList.and.returnValue(playerList);
        roomSpy.onCommand_balance().then(() => {
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(1, 1);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(2, 1);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(3, 2);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(4, 2);
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Player ratings: A: 0.10, B: 0.20, C: 0.10, D: 0.10');
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Teams balanced: 0.30 vs 0.20');
        });
    });

    it('should balance team of no ratings', () => {
        const ratings = [];
        const playerList = [
            {id: 1, name: 'A'},
            {id: 2, name: 'B'}
        ];
        global.fetch = () => {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(ratings)
            });
        };

        roomSpy.getPlayerList.and.returnValue(playerList);
        roomSpy.onCommand_balance().then(() => {
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(1, 1);
            expect(roomSpy.setPlayerTeam).toHaveBeenCalledWith(2, 2);
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Player ratings: A: 0.00, B: 0.00');
            expect(roomSpy.sendAnnouncement).toHaveBeenCalledWith('Teams balanced: 0.00 vs 0.00');
        });
    });
});

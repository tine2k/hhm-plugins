const room = HBInit();

room.pluginSpec = {
    name: `tine2k/publish-room-url`,
    author: `tine2k`,
    version: `1.0.0`,
    dependencies: [
        `sav/core`,
    ],
    config: {
        url: 'url',
        apiKey: 'apiKey'
    },
};

room.onRoomLink = (roomUrl) => {
    const payload = {
        destination: roomUrl
    };

    const config = room.getConfig();

    fetch(config.url, {
            method: "POST",
            headers: {
                "apikey": config.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Response:", data);
        })
        .catch(err => {
            console.error("Error:", err);
        });
};
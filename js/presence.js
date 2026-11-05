let socket = null;
let heartbeatInterval = null;
let isDataLoaded = false;

function connectWebSocket() {
    try {
        socket = new WebSocket('wss://api.lanyard.rest/socket');
        socket.addEventListener('open', () => {
            console.log('WebSocket connected');
            fetchDcdnData();
        });
        socket.addEventListener('message', event => {
            const message = JSON.parse(event.data);
            switch (message.op) {
                case 1: handleHello(message); break;
                case 0: handleEvent(message); break;
            }
        });
        socket.addEventListener('close', () => {
            console.log('WebSocket disconnected');
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            setTimeout(connectWebSocket, 1000);
        });
        socket.addEventListener('error', () => setTimeout(connectWebSocket, 1000));
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(connectWebSocket, 1000);
    }
}

function handleHello(message) {
    const interval = message.d.heartbeat_interval;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
    }, interval);
    initializeConnection();
}

function initializeConnection() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: coderId } }));
    }
}

async function handleEvent(message) {
    if (['INIT_STATE', 'PRESENCE_UPDATE'].includes(message.t)) {
        const userData = message.d;
        await updateProfile(userData);
        updateNameplateBackground(userData);
        updateTagInfo(userData);

        const customStatusChanged = updateCustomStatus(userData.activities);

        const spotifyChanged = updateSpotifyIfChanged(userData);

        if (hasOtherActivityChanges(userData.activities)) {
            updateActivities(userData.activities);
        }

        if (!isDataLoaded) {
            isDataLoaded = true;
            setTimeout(hideLoadingScreen, 1000);
        }
    }
}

function hasOtherActivityChanges(newActivities) {
    const newOtherActivities = newActivities ? newActivities.filter(activity =>
        activity.type !== 4 && activity.name !== 'Spotify'
    ) : [];

    const oldOtherActivities = lastActivities.filter(activity =>
        activity.type !== 4 && activity.name !== 'Spotify'
    );

    if (newOtherActivities.length !== oldOtherActivities.length) return true;

    for (let i = 0; i < newOtherActivities.length; i++) {
        const newActivity = newOtherActivities[i];
        const oldActivity = oldOtherActivities[i];

        if (!oldActivity ||
            newActivity.name !== oldActivity.name ||
            newActivity.details !== oldActivity.details ||
            newActivity.state !== oldActivity.state) {
            return true;
        }
    }

    return false;
}

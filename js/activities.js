let activityIntervals = {};
let lastActivities = [];

function updateActivities(activities) {
    lastActivities = activities ? [...activities] : [];

    const activitiesContainer = document.getElementById('activitiesContainer');
    activitiesContainer.innerHTML = '';
    const validActivities = activities ? activities.filter(activity =>
        activity.type !== 4 && activity.name !== 'Spotify'
    ) : [];

    validActivities.forEach((activity, index) => {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card activity-active';
        activityCard.id = `activityCard-${index}`;

        let activityIconPath = "M5.79335761,5 L18.2066424,5 C19.7805584,5 21.0868816,6.21634264 21.1990185,7.78625885 L21.8575059,17.0050826 C21.9307825,18.0309548 21.1585512,18.9219909 20.132679,18.9952675 C20.088523,18.9984215 20.0442685,19 20,19 C18.8245863,19 17.8000084,18.2000338 17.5149287,17.059715 L17,15 L7,15 L6.48507125,17.059715 C6.19999155,18.2000338 5.1754137,19 4,19 C2.97151413,19 2.13776159,18.1662475 2.13776159,17.1377616 C2.13776159,17.0934931 2.1393401,17.0492386 2.1424941,17.0050826 L2.80098151,7.78625885 C2.91311838,6.21634264 4.21944161,5 5.79335761,5 Z M14.5,10 C15.3284271,10 16,9.32842712 16,8.5 C16,7.67157288 15.3284271,7 14.5,7 C13.6715729,7 13,7.67157288 13,8.5 C13,9.32842712 13.6715729,10 14.5,10 Z M18.5,13 C19.3284271,13 20,12.3284271 20,11.5 C20,10.6715729 19.3284271,10 18.5,10 C17.6715729,10 17,10.6715729 17,11.5 C17,12.3284271 17.6715729,13 18.5,13 Z M6,9 L4,9 L4,11 L6,11 L6,13 L8,13 L8,11 L10,11 L10,9 L8,9 L8,7 L6,7 L6,9 Z";

        switch (activity.type) {
            case 1:
                activityIconPath = "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z";
                break;
            case 2:
                activityIconPath = "M4 10a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-1.5a1.5 1.5 0 0 1-1.5-1.5v-2A1.5 1.5 0 0 1 16.5 10H18a6 6 0 1 0-12 0h1.5A1.5 1.5 0 0 1 10 11.5v2A1.5 1.5 0 0 1 8.5 15H7a2 2 0 0 1-2-2v-3Z";
                break;
            case 3:
                activityIconPath = "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z";
                break;
            case 5:
                activityIconPath = "M12 2 9 9H2l6 4-2.5 7.5L12 16l6.5 4.5L16 13l6-4h-7L12 2Z";
                break;
            default:
                break;
        }

        let activityTitleText = '';
        switch (activity.type) {
            case 0: activityTitleText = 'Playing'; break;
            case 1: activityTitleText = 'Streaming'; break;
            case 2: activityTitleText = 'Listening to'; break;
            case 3: activityTitleText = 'Watching'; break;
            case 5: activityTitleText = 'Competing in'; break;
            default: activityTitleText = 'Active in';
        }

        if (activity.platform && activity.type === 0) {
            activityTitleText += ` ${activity.platform}`;
        }

        activityCard.innerHTML = `
            <div class="activity-header">
                <svg class="activity-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="${activityIconPath}"/>
                </svg>
                <div class="activity-title"></div>
            </div>
            <div class="activity-content">
                <div class="activity-image-container">
                    <img class="activity-large-image" src="" alt="Activity">
                    <img class="activity-small-image" src="" alt="Small Icon" style="display: none;">
                </div>
                <div class="activity-info">
                    <div class="activity-name"></div>
                    <div class="activity-details"></div>
                    <div class="activity-state"></div>
                    <div class="activity-time" style="display: none;">
                        <svg class="time-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <span class="activity-time-text">0:00:00</span>
                    </div>
                    <div class="activity-progress" style="display: none;">
                        <div class="progress-container">
                            <div class="progress-bar"></div>
                        </div>
                        <div class="time-info">
                            <span class="activity-current-time">0:00</span>
                            <span class="activity-end-time">0:00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="activity-buttons"></div>
        `;
        activityCard.querySelector('.activity-title').textContent = activityTitleText;
        activityCard.querySelector('.activity-name').textContent = activity.name || '';
        activityCard.querySelector('.activity-details').textContent = activity.details || '';
        activityCard.querySelector('.activity-state').textContent = activity.state || '';
        const largeImageElement = activityCard.querySelector('.activity-large-image');
        const smallImageElement = activityCard.querySelector('.activity-small-image');

        if (activity.assets) {
            if (activity.assets.large_image) {
                let largeImageUrl = activity.assets.large_image;
                if (largeImageUrl.startsWith('mp:')) {
                    largeImageUrl = `https://media.discordapp.net/${largeImageUrl.replace('mp:', '')}`;
                } else if (largeImageUrl.startsWith('spotify:')) {
                    largeImageUrl = `https://i.scdn.co/image/${largeImageUrl.replace('spotify:', '')}`;
                } else if (largeImageUrl.startsWith('external:')) {
                    largeImageUrl = largeImageUrl.replace('external:', '');
                } else if (largeImageUrl.startsWith('https%3A%2F%2F')) {
                    largeImageUrl = decodeURIComponent(largeImageUrl);
                } else {
                    largeImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImageUrl}.png?size=512`;
                }
                largeImageElement.src = largeImageUrl;
            } else if (activity.assets.small_image) {
                let smallImageUrl = activity.assets.small_image;
                if (smallImageUrl.startsWith('mp:')) {
                    smallImageUrl = `https://media.discordapp.net/${smallImageUrl.replace('mp:', '')}`;
                } else if (smallImageUrl.startsWith('spotify:')) {
                    smallImageUrl = `https://i.scdn.co/image/${smallImageUrl.replace('spotify:', '')}`;
                } else if (smallImageUrl.startsWith('external:')) {
                    smallImageUrl = smallImageUrl.replace('external:', '');
                } else {
                    smallImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${smallImageUrl}.png?size=512`;
                }
                largeImageElement.src = smallImageUrl;
            }

            if (activity.assets.small_image && activity.assets.large_image) {
                let smallImageUrl = activity.assets.small_image;
                if (smallImageUrl.startsWith('mp:')) {
                    smallImageUrl = `https://media.discordapp.net/${smallImageUrl.replace('mp:', '')}`;
                } else if (smallImageUrl.startsWith('spotify:')) {
                    smallImageUrl = `https://i.scdn.co/image/${smallImageUrl.replace('spotify:', '')}`;
                } else if (smallImageUrl.startsWith('external:')) {
                    smallImageUrl = smallImageUrl.replace('external:', '');
                } else {
                    smallImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${smallImageUrl}.png?size=128`;
                }
                smallImageElement.src = smallImageUrl;
                smallImageElement.style.display = 'block';
            }
        } else if (activity.application_id) {
            largeImageElement.src = `https://dcdn.dstn.to/app-icons/${activity.application_id}.png?size=512`;
        }

        const activityTimeElement = activityCard.querySelector('.activity-time');
        const activityProgressElement = activityCard.querySelector('.activity-progress');
        if (activity.timestamps && activity.timestamps.start && activity.timestamps.end) {
            activityTimeElement.style.display = 'none';
            activityProgressElement.style.display = 'block';
            const startTime = activity.timestamps.start;
            const endTime = activity.timestamps.end;
            const duration = endTime - startTime;
            function updateActivityProgress() {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);
                activityProgressElement.querySelector('.progress-bar').style.width = `${progress}%`;
                const currentMinutes = Math.floor(elapsed / 60000);
                const currentSeconds = Math.floor((elapsed % 60000) / 1000);
                const totalMinutes = Math.floor(duration / 60000);
                const totalSeconds = Math.floor((duration % 60000) / 1000);
                activityProgressElement.querySelector('.activity-current-time').textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
                activityProgressElement.querySelector('.activity-end-time').textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
                if (progress >= 100) clearInterval(activityIntervals[activity.id]);
            }
            if (activityIntervals[activity.id]) clearInterval(activityIntervals[activity.id]);
            updateActivityProgress();
            activityIntervals[activity.id] = setInterval(updateActivityProgress, 100);
        } else if (activity.created_at) {
            activityTimeElement.style.display = 'flex';
            activityProgressElement.style.display = 'none';
            function updateActivityTime() {
                const startTime = activity.created_at;
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);
                const seconds = elapsed % 60;
                let timeText = '';
                if (hours > 0) {
                    timeText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                activityCard.querySelector('.activity-time-text').textContent = timeText;
            }
            updateActivityTime();
            activityIntervals[activity.id] = setInterval(updateActivityTime, 1000);
        }
        if (activity.buttons && activity.buttons.length > 0) {
            const buttonsContainer = activityCard.querySelector('.activity-buttons');
            activity.buttons.forEach(buttonText => {
                const button = document.createElement('a');
                button.className = 'activity-button';
                let buttonUrl = '#';
                if (activity.metadata && activity.metadata.button_urls) {
                    const buttonIndex = activity.buttons.indexOf(buttonText);
                    if (activity.metadata.button_urls[buttonIndex]) {
                        buttonUrl = activity.metadata.button_urls[buttonIndex];
                    }
                } else if (activity.details_url && buttonText.toLowerCase().includes('listen') || buttonText.toLowerCase().includes('watch')) {
                    buttonUrl = activity.details_url;
                }
                button.href = getSafeExternalUrl(buttonUrl);
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
                button.textContent = buttonText;
                buttonsContainer.appendChild(button);
            });
        }
        activitiesContainer.appendChild(activityCard);
    });
    updateContainerLayout();
}

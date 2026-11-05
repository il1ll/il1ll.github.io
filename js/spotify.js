let progressInterval;
let lastSpotifyData = null;

function updateSpotifyIfChanged(userData) {
    const currentSpotifyData = userData.listening_to_spotify && userData.spotify ? userData.spotify : null;

    const spotifyChanged = JSON.stringify(currentSpotifyData) !== JSON.stringify(lastSpotifyData);

    if (spotifyChanged) {
        lastSpotifyData = currentSpotifyData;

        if (userData.listening_to_spotify && userData.spotify) {
            updateSpotify(userData.spotify);
        } else {
            const spotifyCard = document.getElementById('spotifyCard');
            const lyricsCard = document.getElementById('lyricsCard');
            spotifyCard.classList.remove('spotify-active');
            if (lyricsCard) lyricsCard.classList.remove('lyrics-active');
            const lyricsContainer = document.getElementById('lyricsContainer');
            if (lyricsContainer) lyricsContainer.innerHTML = '';
            currentLyricsData = null;
            lastLyricTrackId = null;
            resetLyricsTimeline();
            clearListenAlongTrack();
            clearAlbumTheme();
            closeLyricsFullscreen();
            updateContainerLayout();
            if (progressInterval) clearInterval(progressInterval);
        }
    }

    return spotifyChanged;
}

function updateSpotify(spotifyData) {
    const spotifyCard = document.getElementById('spotifyCard');
    spotifyCard.classList.add('spotify-active');
    updateContainerLayout();
    document.getElementById('albumArt').src = spotifyData.album_art_url;
    document.getElementById('trackName').textContent = spotifyData.song;
    document.getElementById('trackArtist').textContent = `by ${spotifyData.artist}`;
    const startTime = spotifyData.timestamps.start;
    const endTime = spotifyData.timestamps.end;
    const duration = endTime - startTime;
    lyricsStartTime = startTime;
    updateListenAlongTrack(spotifyData);
    updateAlbumTheme(spotifyData.album_art_url);
    updateLyricsFullscreenInfo(spotifyData);
    if (progressInterval) clearInterval(progressInterval);
    function updateProgress() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        document.getElementById('progressBar').style.width = `${progress}%`;
        const currentMinutes = Math.floor(elapsed / 60000);
        const currentSeconds = Math.floor((elapsed % 60000) / 1000);
        const totalMinutes = Math.floor(duration / 60000);
        const totalSeconds = Math.floor((duration % 60000) / 1000);
        const currentTimeText = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        const totalTimeText = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        document.getElementById('currentTime').textContent = currentTimeText;
        document.getElementById('totalTime').textContent = totalTimeText;
        updateLyricsFullscreenProgress(progress, currentTimeText, totalTimeText);

        if (progress >= 100) clearInterval(progressInterval);
    }
    updateProgress();
    progressInterval = setInterval(updateProgress, 100);
    const spotifyButtons = document.getElementById('spotifyButtons');
    spotifyButtons.innerHTML = '';
    const spotifyButton = document.createElement('a');
    spotifyButton.className = 'activity-button';
    spotifyButton.href = spotifyData.track_id ? `https://open.spotify.com/track/${encodeURIComponent(spotifyData.track_id)}` : '#';
    spotifyButton.target = '_blank';
    spotifyButton.rel = 'noopener noreferrer';
    const spotifyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spotifyIcon.setAttribute('class', 'button-icon spotify-button-icon');
    spotifyIcon.setAttribute('viewBox', '0 0 496 512');
    spotifyIcon.setAttribute('fill', 'currentColor');
    const spotifyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    spotifyPath.setAttribute('d', "M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.5 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z");
    spotifyIcon.appendChild(spotifyPath);
    spotifyButton.appendChild(spotifyIcon);
    spotifyButton.appendChild(document.createTextNode('Play on Spotify'));
    spotifyButtons.appendChild(spotifyButton);

    if (spotifyData.track_id !== lastLyricTrackId) {
        lastLyricTrackId = spotifyData.track_id;
        fetchLyrics(spotifyData);
    }
}

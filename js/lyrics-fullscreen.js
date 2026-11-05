let lyricsFullscreenOpen = false;

function updateLyricsFullscreenInfo(spotifyData) {
    document.getElementById('lyricsFsArt').src = spotifyData.album_art_url;
    document.getElementById('lyricsFsBackdrop').src = spotifyData.album_art_url;
    document.getElementById('lyricsFsTrack').textContent = spotifyData.song;
    document.getElementById('lyricsFsArtist').textContent = spotifyData.artist;
}

function updateLyricsFullscreenProgress(progress, currentTimeText, totalTimeText) {
    if (!lyricsFullscreenOpen) return;
    document.getElementById('lyricsFsProgress').style.width = `${progress}%`;
    document.getElementById('lyricsFsCurrent').textContent = currentTimeText;
    document.getElementById('lyricsFsTotal').textContent = totalTimeText;
}

function openLyricsFullscreen() {
    if (lyricsFullscreenOpen) return;
    const overlay = document.getElementById('lyricsFullscreen');
    lyricsFullscreenOpen = true;
    document.getElementById('lyricsFsSlot').appendChild(document.getElementById('lyricsContainer'));
    overlay.hidden = false;
    document.documentElement.classList.add('lyrics-fs-open');
    document.getElementById('lyricsFsClose').focus({ preventScroll: true });
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
}

function closeLyricsFullscreen() {
    if (!lyricsFullscreenOpen) return;
    lyricsFullscreenOpen = false;
    document.getElementById('lyricsCard').appendChild(document.getElementById('lyricsContainer'));
    document.getElementById('lyricsFullscreen').hidden = true;
    document.documentElement.classList.remove('lyrics-fs-open');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.getElementById('lyricsFsOpen').focus({ preventScroll: true });
}

function initializeLyricsFullscreen() {
    document.getElementById('lyricsFsOpen').addEventListener('click', openLyricsFullscreen);
    document.getElementById('lyricsFsClose').addEventListener('click', closeLyricsFullscreen);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeLyricsFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) closeLyricsFullscreen();
    });
}

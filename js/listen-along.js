const LISTEN_ALONG_PROXY = 'https://lyrics.meow67-2a4.workers.dev/?target=';
const LISTEN_ALONG_VOLUME_KEY = 'listen-along-volume';
const LISTEN_ALONG_MAX_CANDIDATES = 6;
const LISTEN_ALONG_DRIFT_SECONDS = 0.75;
const LISTEN_ALONG_SEEK_COOLDOWN_MS = 4000;
const LISTEN_ALONG_SEEK_LEAD_SECONDS = 0.25;
const LISTEN_ALONG_BLOCKED_AFTER_MS = 10000;
const LISTEN_ALONG_STUCK_AFTER_MS = 20000;
const LISTEN_ALONG_UNWANTED = /\b(live|cover|remix|karaoke|instrumental|nightcore|slowed|sped up|reverb|8d|lyrics?)\b/i;

const listenAlong = {
    enabled: false,
    player: null,
    playerReady: false,
    apiRequested: false,
    track: null,
    loadedKey: null,
    candidates: [],
    candidateIndex: 0,
    requestId: 0,
    lastSeekAt: 0,
    loadStartedAt: 0,
    blocked: false,
    showPlayer: false,
    hasPlayed: false,
    syncTimer: null,
    clockSeconds: 0,
    clockAt: 0,
    videoCache: new Map()
};

function setListenAlongStatus(message) {
    const status = document.getElementById('listenAlongStatus');
    if (status) status.textContent = message;
}

function renderListenAlongButton() {
    const icon = document.getElementById('listenAlongIcon');
    const label = document.getElementById('listenAlongLabel');
    if (!icon || !label) return;
    if (!listenAlong.enabled) {
        icon.textContent = 'headphones';
        label.textContent = 'Listen along';
    } else if (listenAlong.blocked) {
        icon.textContent = 'play_arrow';
        label.textContent = 'Tap to start';
    } else {
        icon.textContent = 'headset_off';
        label.textContent = 'Stop listening';
    }
    document.getElementById('listenAlongBtn').classList.toggle('active', listenAlong.enabled && !listenAlong.blocked);
    document.getElementById('spotifyVolume').hidden = !listenAlong.enabled;
    document.querySelector('.listen-along-player').classList.toggle('needs-tap', listenAlong.enabled && listenAlong.showPlayer);
    const status = document.getElementById('listenAlongStatus');
    if (!listenAlong.enabled) status.textContent = '';
}

function parseVideoDuration(text) {
    if (!text) return 0;
    return text.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

function parseSearchResults(html) {
    const marker = 'var ytInitialData = ';
    const start = html.indexOf(marker);
    if (start < 0) return [];
    const end = html.indexOf(';</script>', start);
    if (end < 0) return [];
    const stack = [JSON.parse(html.slice(start + marker.length, end))];
    const videos = [];
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        if (node.videoRenderer && node.videoRenderer.videoId) {
            const video = node.videoRenderer;
            videos.push({
                id: video.videoId,
                title: video.title?.runs?.[0]?.text || '',
                channel: video.ownerText?.runs?.[0]?.text || '',
                duration: parseVideoDuration(video.lengthText?.simpleText)
            });
            continue;
        }
        Object.values(node).forEach(value => stack.push(value));
    }
    return videos;
}

function scoreVideo(video, track) {
    const title = video.title.toLowerCase();
    const channel = video.channel.toLowerCase();
    const song = track.song.toLowerCase();
    const artist = track.artist.split(/[;,]/)[0].trim().toLowerCase();
    let score = -Math.abs(video.duration - track.duration) * 3;
    if (channel.endsWith('- topic')) score += 40;
    if (title.includes(song)) score += 15;
    if (channel.includes(artist) || title.includes(artist)) score += 15;
    if (/\baudio\b/.test(title)) score += 10;
    const unwanted = title.match(LISTEN_ALONG_UNWANTED);
    if (unwanted && !song.includes(unwanted[1].toLowerCase())) score -= 40;
    return score;
}

async function searchYouTube(query) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const response = await fetch(`${LISTEN_ALONG_PROXY}${encodeURIComponent(searchUrl)}`);
    if (!response.ok) throw new Error(`Search failed with ${response.status}`);
    return parseSearchResults(await response.text());
}

async function findVideoCandidates(track) {
    if (listenAlong.videoCache.has(track.key)) return listenAlong.videoCache.get(track.key);
    const artist = track.artist.replace(/;/g, ' ');
    const queries = [`${artist} ${track.song} audio`, `${artist} ${track.song}`, `${artist} ${track.song} official audio`];
    let videos = [];
    let lastError = null;
    for (const query of queries) {
        try {
            videos = (await searchYouTube(query)).filter(video => video.duration > 0);
        } catch (error) {
            lastError = error;
        }
        if (videos.length) break;
    }
    if (!videos.length && lastError) throw lastError;
    const candidates = videos
        .map(video => ({ ...video, score: scoreVideo(video, track) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, LISTEN_ALONG_MAX_CANDIDATES);
    if (candidates.length) listenAlong.videoCache.set(track.key, candidates);
    return candidates;
}

function getListenAlongTargetSeconds() {
    return Math.max(0, (Date.now() - listenAlong.track.start) / 1000);
}

function isListenAlongPlaying() {
    return listenAlong.enabled && listenAlong.playerReady && listenAlong.player.getPlayerState() === YT.PlayerState.PLAYING;
}

function getListenAlongPositionMs() {
    if (!isListenAlongPlaying()) return null;
    const seconds = listenAlong.player.getCurrentTime();
    const now = performance.now();
    if (seconds !== listenAlong.clockSeconds) {
        listenAlong.clockSeconds = seconds;
        listenAlong.clockAt = now;
    }
    return (listenAlong.clockSeconds + (now - listenAlong.clockAt) / 1000) * 1000;
}

function playListenAlongCandidate() {
    const candidate = listenAlong.candidates[listenAlong.candidateIndex];
    if (!candidate) {
        setListenAlongStatus('This song cannot be played here');
        return;
    }
    listenAlong.loadStartedAt = Date.now();
    listenAlong.lastSeekAt = Date.now();
    listenAlong.player.loadVideoById({
        videoId: candidate.id,
        startSeconds: getListenAlongTargetSeconds() + LISTEN_ALONG_SEEK_LEAD_SECONDS
    });
}

async function loadListenAlongTrack() {
    const track = listenAlong.track;
    if (!listenAlong.enabled || !listenAlong.playerReady || !track) return;
    if (listenAlong.loadedKey === track.key) return;
    listenAlong.loadedKey = track.key;
    const requestId = ++listenAlong.requestId;
    listenAlong.candidates = [];
    listenAlong.blocked = false;
    listenAlong.showPlayer = false;
    renderListenAlongButton();
    listenAlong.player.pauseVideo();
    setListenAlongStatus('');
    try {
        const candidates = await findVideoCandidates(track);
        if (requestId !== listenAlong.requestId || !listenAlong.enabled) return;
        if (candidates.length === 0) {
            setListenAlongStatus('Could not find this song on YouTube');
            return;
        }
        listenAlong.candidates = candidates;
        listenAlong.candidateIndex = 0;
        playListenAlongCandidate();
    } catch (error) {
        console.error('Failed to find video:', error);
        if (requestId !== listenAlong.requestId) return;
        listenAlong.loadedKey = null;
        setListenAlongStatus('Could not find this song on YouTube');
    }
}

function checkListenAlongStart() {
    if (listenAlong.blocked || !listenAlong.candidates[listenAlong.candidateIndex]) return;
    const waited = Date.now() - listenAlong.loadStartedAt;
    if (listenAlong.hasPlayed) {
        if (waited > LISTEN_ALONG_STUCK_AFTER_MS && listenAlong.candidates[listenAlong.candidateIndex + 1]) {
            handleListenAlongError();
        }
    } else if (waited > LISTEN_ALONG_BLOCKED_AFTER_MS) {
        listenAlong.blocked = true;
        setListenAlongStatus('Not playing yet? Tap the button');
        renderListenAlongButton();
    }
}

function syncListenAlong() {
    if (!listenAlong.enabled || !listenAlong.playerReady || !listenAlong.track || !listenAlong.candidates.length) return;
    const state = listenAlong.player.getPlayerState();
    if (state === YT.PlayerState.UNSTARTED || state === YT.PlayerState.CUED) {
        checkListenAlongStart();
    }
    if (state !== YT.PlayerState.PLAYING) return;
    const target = getListenAlongTargetSeconds();
    const drift = listenAlong.player.getCurrentTime() - target;
    if (Math.abs(drift) > LISTEN_ALONG_DRIFT_SECONDS && Date.now() - listenAlong.lastSeekAt > LISTEN_ALONG_SEEK_COOLDOWN_MS) {
        listenAlong.lastSeekAt = Date.now();
        listenAlong.player.seekTo(target + LISTEN_ALONG_SEEK_LEAD_SECONDS, true);
    }
}

function handleListenAlongState(event) {
    if (event.data !== YT.PlayerState.PLAYING) return;
    listenAlong.hasPlayed = true;
    listenAlong.blocked = false;
    listenAlong.showPlayer = false;
    renderListenAlongButton();
    setListenAlongStatus('');
    listenAlong.lastSeekAt = 0;
    syncListenAlong();
}

function handleListenAlongError() {
    listenAlong.candidateIndex += 1;
    playListenAlongCandidate();
}

function createListenAlongPlayer() {
    listenAlong.player = new YT.Player('listenAlongPlayer', {
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin
        },
        events: {
            onReady: () => {
                listenAlong.playerReady = true;
                listenAlong.player.setVolume(Number(document.getElementById('listenAlongVolume').value));
                listenAlong.player.unMute();
                loadListenAlongTrack();
            },
            onStateChange: handleListenAlongState,
            onError: handleListenAlongError
        }
    });
}

function requestListenAlongPlayer() {
    if (listenAlong.player || listenAlong.apiRequested) return;
    listenAlong.apiRequested = true;
    window.onYouTubeIframeAPIReady = createListenAlongPlayer;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
        listenAlong.apiRequested = false;
        setListenAlongStatus('Could not load the YouTube player');
    };
    document.head.appendChild(script);
}

function startListenAlong() {
    listenAlong.enabled = true;
    listenAlong.loadedKey = null;
    listenAlong.blocked = false;
    listenAlong.showPlayer = false;
    renderListenAlongButton();
    setListenAlongStatus('');
    if (!listenAlong.syncTimer) listenAlong.syncTimer = setInterval(syncListenAlong, 1000);
    requestListenAlongPlayer();
    loadListenAlongTrack();
}

function stopListenAlong() {
    listenAlong.enabled = false;
    listenAlong.loadedKey = null;
    listenAlong.candidates = [];
    listenAlong.blocked = false;
    listenAlong.showPlayer = false;
    listenAlong.requestId += 1;
    clearInterval(listenAlong.syncTimer);
    listenAlong.syncTimer = null;
    if (listenAlong.playerReady) listenAlong.player.stopVideo();
    renderListenAlongButton();
}

function updateListenAlongTrack(spotifyData) {
    listenAlong.track = {
        key: spotifyData.track_id || `${spotifyData.artist} ${spotifyData.song}`,
        song: spotifyData.song,
        artist: spotifyData.artist,
        start: spotifyData.timestamps.start,
        duration: (spotifyData.timestamps.end - spotifyData.timestamps.start) / 1000
    };
    loadListenAlongTrack();
}

function clearListenAlongTrack() {
    listenAlong.track = null;
    listenAlong.loadedKey = null;
    listenAlong.candidates = [];
    listenAlong.requestId += 1;
    if (listenAlong.enabled && listenAlong.playerReady) listenAlong.player.pauseVideo();
}

function initializeListenAlong() {
    const volume = document.getElementById('listenAlongVolume');
    const muteButton = document.getElementById('listenAlongMute');
    const muteIcon = document.getElementById('listenAlongMuteIcon');
    let restoreVolume = 100;
    const applyVolume = () => {
        const percent = Number(volume.value);
        volume.style.setProperty('--volume-percent', `${percent}%`);
        muteIcon.textContent = percent === 0 ? 'volume_off' : percent < 50 ? 'volume_down' : 'volume_up';
        muteButton.setAttribute('aria-label', percent === 0 ? 'Unmute' : 'Mute');
        if (listenAlong.playerReady) listenAlong.player.setVolume(percent);
        try {
            localStorage.setItem(LISTEN_ALONG_VOLUME_KEY, volume.value);
        } catch (error) {
        }
    };
    let storedVolume = null;
    try {
        storedVolume = localStorage.getItem(LISTEN_ALONG_VOLUME_KEY);
    } catch (error) {
    }
    if (storedVolume !== null && Number.isFinite(Number(storedVolume))) volume.value = storedVolume;
    applyVolume();
    volume.addEventListener('input', () => {
        if (Number(volume.value) > 0) restoreVolume = Number(volume.value);
        applyVolume();
    });
    muteButton.addEventListener('click', () => {
        volume.value = Number(volume.value) === 0 ? restoreVolume : 0;
        applyVolume();
    });
    document.getElementById('listenAlongBtn').addEventListener('click', () => {
        if (listenAlong.blocked) {
            listenAlong.showPlayer = true;
            listenAlong.player.playVideo();
            setListenAlongStatus('Tap the video to start');
            renderListenAlongButton();
        } else if (listenAlong.enabled) {
            stopListenAlong();
        } else {
            startListenAlong();
        }
    });
    renderListenAlongButton();
}

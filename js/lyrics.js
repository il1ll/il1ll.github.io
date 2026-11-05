let currentLyricsData = null;
let lastLyricTrackId = null;
let lyricsTimeline = [];
let lyricsActiveIndex = -1;
let lyricsStartTime = 0;
let lyricsFrame = null;
let lyricsScrollFrame = null;
let lyricsUserScrollUntil = 0;
const WORD_TIMING_ADVANCE_MS = 120;
const LYRIC_INTERLUDE_GAP_MS = 4000;
const LYRIC_SCROLL_DURATION_MS = 700;
const LYRIC_USER_SCROLL_PAUSE_MS = 3000;
const LYRIC_LONG_WORD_MS = 900;

function sanitizeForUrl(str) {
    if (!str) return '';
    return str.replace(/;/g, '').replace(/\s+/g, ' ').trim();
}

function isArabic(text) {
    const pattern = /[\u0600-\u06FF\u0750-\u077F]/;
    return pattern.test(text);
}

async function fetchLyrics(spotifyData) {
    const lyricsContainer = document.getElementById('lyricsContainer');
    const lyricsCard = document.getElementById('lyricsCard');
    if (!lyricsContainer) return;

    currentLyricsData = null;
    resetLyricsTimeline();
    lyricsContainer.innerHTML = '';
    if (lyricsCard) {
        lyricsCard.classList.remove('lyrics-active');
        updateContainerLayout();
    }

    const track = sanitizeForUrl(spotifyData.song);
    const artist = sanitizeForUrl(spotifyData.artist);
    const trackId = spotifyData.track_id;

    console.log('🎶 Fetching lyrics for:', track, 'by', artist);

    if (!trackId) {
        lyricsContainer.innerHTML = '';
        if (lyricsCard) {
            lyricsCard.classList.remove('lyrics-active');
            updateContainerLayout();
        }
        return;
    }

    const apiUrl = `https://spotifyplus-api.devon-shoutz.workers.dev/api/lyrics/${trackId}`;
    const url = `https://lyrics.meow67-2a4.workers.dev/?target=${encodeURIComponent(apiUrl)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data && Array.isArray(data.Content) && data.Content.length) {
            const isSyllable = data.Type === 'Syllable' || (data.Content[0] && data.Content[0].Lead);
            let lines = [];
            if (isSyllable) {
                lines = data.Content.map(item => {
                    const lead = item.Lead || {};
                    const syllables = Array.isArray(lead.Syllables) ? lead.Syllables : [];
                    const tokens = [];
                    let currentToken = null;
                    let prevSyllable = null;
                    syllables.forEach(syl => {
                        const text = (syl && syl.Text != null) ? String(syl.Text).trim() : '';
                        if (!text) return;
                        const startMs = Math.round(((syl.StartTime != null ? syl.StartTime : lead.StartTime) || 0) * 1000);
                        const endMs = Math.round(((syl.EndTime != null ? syl.EndTime : lead.EndTime) || 0) * 1000);
                        if (!currentToken) {
                            currentToken = { text, startMs, endMs };
                        } else {
                            if (prevSyllable && prevSyllable.IsPartOfWord) {
                                currentToken.text += text;
                            } else {
                                currentToken.text += ' ' + text;
                            }
                            currentToken.endMs = endMs;
                        }
                        prevSyllable = syl;
                        if (!syl.IsPartOfWord) {
                            tokens.push(currentToken);
                            currentToken = null;
                        }
                    });
                    if (currentToken) tokens.push(currentToken);

                    const lineText = tokens.map(t => t.text).join(' ').replace(/\s+/g, ' ').trim();
                    return {
                        text: lineText,
                        startMs: Math.round((lead.StartTime || item.StartTime || 0) * 1000),
                        endMs: Math.round((lead.EndTime || item.EndTime || 0) * 1000),
                        tokens: tokens
                    };
                }).filter(line => (line.text && line.text.trim()) || (line.tokens && line.tokens.length));
            } else {
                lines = data.Content
                    .filter(item => item && item.Text && String(item.Text).trim())
                    .map(item => ({
                        text: item.Text,
                        startMs: Math.round((item.StartTime || 0) * 1000),
                        endMs: Math.round((item.EndTime || 0) * 1000)
                    }));
            }

            if (lines.length) {
                if (isSyllable) {
                    currentLyricsData = {
                        wordSyncedLyrics: lines,
                        status: 'wordSynced'
                    };
                } else {
                    currentLyricsData = {
                        lineSyncedLyrics: lines,
                        status: 'lineSynced'
                    };
                }
                renderLyrics();
            } else {
                lyricsContainer.innerHTML = '';
                if (lyricsCard) {
                    lyricsCard.classList.remove('lyrics-active');
                    updateContainerLayout();
                }
            }
        } else if (data && Array.isArray(data.Lines) && data.Lines.length) {
            const lines = data.Lines
                .map(item => (item && (item.Text || item.text)) ? String(item.Text || item.text).trim() : '')
                .filter(t => t);
            if (lines.length) {
                currentLyricsData = {
                    plainLyrics: lines.join('\n'),
                    status: 'plain'
                };
                renderLyrics();
            } else {
                lyricsContainer.innerHTML = '';
                if (lyricsCard) {
                    lyricsCard.classList.remove('lyrics-active');
                    updateContainerLayout();
                }
            }
        } else {
            lyricsContainer.innerHTML = '';
            if (lyricsCard) {
                lyricsCard.classList.remove('lyrics-active');
                updateContainerLayout();
            }
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch lyrics:', error);
        lyricsContainer.innerHTML = '';
        if (lyricsCard) {
            lyricsCard.classList.remove('lyrics-active');
            updateContainerLayout();
        }
    }
}

function parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const result = [];
    lines.forEach(line => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            const text = match[3].trim();
            const startMs = (minutes * 60 + seconds) * 1000;
            result.push({ text, startMs });
        }
    });
    for (let i = 0; i < result.length; i++) {
        result[i].endMs = i < result.length - 1 ? result[i + 1].startMs : result[i].startMs + 5000;
    }
    return result;
}

function resetLyricsTimeline() {
    lyricsTimeline = [];
    lyricsActiveIndex = -1;
    lyricsUserScrollUntil = 0;
    if (lyricsFrame) cancelAnimationFrame(lyricsFrame);
    if (lyricsScrollFrame) cancelAnimationFrame(lyricsScrollFrame);
    lyricsFrame = null;
    lyricsScrollFrame = null;
}

function createLyricWord(text, index) {
    const wordEl = document.createElement('span');
    wordEl.className = 'lyric-word';
    wordEl.textContent = text;
    wordEl.style.setProperty('--word-index', index);
    if (isArabic(text)) wordEl.classList.add('arabic');
    return wordEl;
}

function createLyricInterlude(start, end) {
    const lineEl = document.createElement('div');
    lineEl.className = 'lyric-line lyric-interlude';
    lineEl.innerHTML = '<span></span><span></span><span></span>';
    return { el: lineEl, start, end, words: [], interlude: true };
}

function createLyricEntry(line, nextStart, status) {
    const lineEl = document.createElement('div');
    lineEl.className = 'lyric-line';
    if (isArabic(line.text)) lineEl.classList.add('rtl');
    const words = [];

    if (status === 'wordSynced' && line.tokens) {
        lineEl.classList.add('word-synced');
        line.tokens.forEach((token, index) => {
            const wordEl = createLyricWord(token.text, index);
            const start = Math.max(0, token.startMs - WORD_TIMING_ADVANCE_MS);
            const end = Math.max(start + 80, token.endMs - WORD_TIMING_ADVANCE_MS);
            if (token.endMs - token.startMs >= LYRIC_LONG_WORD_MS) wordEl.classList.add('long');
            lineEl.appendChild(wordEl);
            words.push({ el: wordEl, start, end, progress: -1 });
        });
    } else {
        if (status === 'lineSynced') lineEl.classList.add('line-synced');
        line.text.split(/\s+/).forEach((word, index) => {
            lineEl.appendChild(createLyricWord(word, index));
        });
    }

    const lineEnd = line.endMs || (nextStart != null ? nextStart : line.startMs + 5000);
    const holdsUntilNext = nextStart != null && nextStart - lineEnd < LYRIC_INTERLUDE_GAP_MS;
    return { el: lineEl, start: line.startMs, end: holdsUntilNext ? nextStart : lineEnd + 500, words };
}

function renderLyrics() {
    const container = document.getElementById('lyricsContainer');
    const lyricsCard = document.getElementById('lyricsCard');
    if (!container) return;
    resetLyricsTimeline();
    container.innerHTML = '';
    container.classList.remove('lyrics-static');
    if (currentLyricsData && currentLyricsData.status === 'plain') {
        container.classList.add('lyrics-static');
    }
    if (!currentLyricsData) {
        if (lyricsCard) {
            lyricsCard.classList.remove('lyrics-active');
            updateContainerLayout();
        }
        return;
    }

    if (lyricsCard) {
        lyricsCard.classList.add('lyrics-active');
    }

    const lyrics = currentLyricsData.wordSyncedLyrics || currentLyricsData.lineSyncedLyrics || currentLyricsData.plainLyrics;
    const isSynced = !!(currentLyricsData.wordSyncedLyrics || currentLyricsData.lineSyncedLyrics);

    let parsedLyrics;
    if (isSynced) {
        parsedLyrics = typeof lyrics === 'string' ? parseLRC(lyrics) : lyrics;
    } else {
        parsedLyrics = lyrics.split('\n').map(l => ({ text: l.trim(), startMs: -1, endMs: -1 }));
    }

    if (!Array.isArray(parsedLyrics) || parsedLyrics.length === 0) {
        if (lyricsCard) {
            lyricsCard.classList.remove('lyrics-active');
            updateContainerLayout();
        }
        return;
    }

    const entries = [];
    parsedLyrics.forEach((line, lineIndex) => {
        const next = parsedLyrics[lineIndex + 1];
        const nextStart = isSynced && next ? next.startMs : null;
        if (isSynced && lineIndex === 0 && line.startMs >= LYRIC_INTERLUDE_GAP_MS) {
            entries.push(createLyricInterlude(0, line.startMs));
        }
        entries.push(createLyricEntry(line, nextStart, currentLyricsData.status));
        if (nextStart != null && line.endMs && nextStart - line.endMs >= LYRIC_INTERLUDE_GAP_MS) {
            entries.push(createLyricInterlude(line.endMs + 500, nextStart));
        }
    });

    entries.forEach((entry, index) => {
        entry.el.id = `line-${index}`;
        entry.el.style.setProperty('--line-index', index);
        entry.el.style.setProperty('--line-distance', Math.min(index, 4));
        container.appendChild(entry.el);
    });

    container.scrollTop = 0;
    updateContainerLayout();

    if (isSynced) {
        lyricsTimeline = entries;
        lyricsFrame = requestAnimationFrame(runLyricsFrame);
    }
}

function runLyricsFrame() {
    if (!currentLyricsData || lyricsTimeline.length === 0) {
        lyricsFrame = null;
        return;
    }
    const playerPosition = getListenAlongPositionMs();
    syncLyrics(playerPosition !== null ? playerPosition : Date.now() - lyricsStartTime);
    lyricsFrame = requestAnimationFrame(runLyricsFrame);
}

function clearLyricEntry(entry) {
    entry.el.classList.remove('active');
    entry.words.forEach(word => {
        word.progress = -1;
        word.el.classList.remove('sung', 'singing');
        word.el.style.removeProperty('--word-progress');
    });
}

function setActiveLyricEntry(index) {
    if (lyricsActiveIndex >= 0) clearLyricEntry(lyricsTimeline[lyricsActiveIndex]);
    lyricsActiveIndex = index;
    if (index < 0) return;
    lyricsTimeline.forEach((entry, entryIndex) => {
        entry.el.style.setProperty('--line-distance', Math.min(Math.abs(entryIndex - index), 4));
    });
    const active = lyricsTimeline[index];
    active.el.classList.add('active');
    scrollLyricIntoCenter(active.el);
}

function scrollLyricIntoCenter(lineEl) {
    const container = document.getElementById('lyricsContainer');
    if (!container || Date.now() < lyricsUserScrollUntil) return;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const target = lineRect.top - containerRect.top + container.scrollTop - (container.clientHeight - lineRect.height) / 2;
    if (lyricsScrollFrame) cancelAnimationFrame(lyricsScrollFrame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        container.scrollTop = target;
        return;
    }
    const from = container.scrollTop;
    const startedAt = performance.now();
    function step(now) {
        const t = Math.min((now - startedAt) / LYRIC_SCROLL_DURATION_MS, 1);
        container.scrollTop = from + (target - from) * (1 - Math.pow(1 - t, 4));
        lyricsScrollFrame = t < 1 ? requestAnimationFrame(step) : null;
    }
    lyricsScrollFrame = requestAnimationFrame(step);
}

function pauseLyricsAutoScroll() {
    lyricsUserScrollUntil = Date.now() + LYRIC_USER_SCROLL_PAUSE_MS;
    if (lyricsScrollFrame) cancelAnimationFrame(lyricsScrollFrame);
    lyricsScrollFrame = null;
}

function initializeLyricsScroll() {
    const container = document.getElementById('lyricsContainer');
    if (!container) return;
    container.addEventListener('wheel', pauseLyricsAutoScroll, { passive: true });
    container.addEventListener('touchstart', pauseLyricsAutoScroll, { passive: true });
}

function initializeLyricsHeight() {
    const spotifyCard = document.getElementById('spotifyCard');
    if (!spotifyCard || !window.ResizeObserver) return;
    new ResizeObserver(() => {
        const height = spotifyCard.getBoundingClientRect().height;
        if (height > 0) document.documentElement.style.setProperty('--app-spotify-card-height', `${height}px`);
    }).observe(spotifyCard);
    const container = document.getElementById('lyricsContainer');
    new ResizeObserver(() => {
        const height = container.clientHeight;
        if (height === 0) return;
        container.style.setProperty('--lyrics-edge', `${Math.max(0, height / 2 - 20)}px`);
        if (lyricsActiveIndex >= 0 && lyricsTimeline[lyricsActiveIndex]) scrollLyricIntoCenter(lyricsTimeline[lyricsActiveIndex].el);
    }).observe(container);
}

function syncLyrics(elapsed) {
    let activeIndex = -1;
    lyricsTimeline.forEach((entry, index) => {
        if (elapsed >= entry.start && elapsed < entry.end) activeIndex = index;
    });
    if (activeIndex !== lyricsActiveIndex) setActiveLyricEntry(activeIndex);
    if (activeIndex < 0) return;

    const active = lyricsTimeline[activeIndex];
    if (active.interlude) {
        const progress = (elapsed - active.start) / (active.end - active.start);
        active.el.style.setProperty('--interlude-progress', progress.toFixed(3));
        return;
    }
    active.words.forEach(word => {
        const progress = Math.round(clamp((elapsed - word.start) / (word.end - word.start), 0, 1) * 100);
        if (progress !== word.progress) {
            word.progress = progress;
            word.el.style.setProperty('--word-progress', progress);
        }
        word.el.classList.toggle('sung', elapsed >= word.start);
        word.el.classList.toggle('singing', elapsed >= word.start && elapsed < word.end);
    });
}

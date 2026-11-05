const THEME_STORAGE_KEY = 'theme-settings';
const AVATAR_SEEDS_STORAGE_KEY = 'theme-avatar-seeds';
const FALLBACK_SEED = '#4285f4';
const AVATAR_SEED_COUNT = 5;
const THEME_VARIANTS = {
    tonalSpot: { label: 'Tonal Spot', scheme: MCU.SchemeTonalSpot },
    neutral: { label: 'Spritz', scheme: MCU.SchemeNeutral },
    vibrant: { label: 'Vibrant', scheme: MCU.SchemeVibrant },
    expressive: { label: 'Expressive', scheme: MCU.SchemeExpressive },
    rainbow: { label: 'Rainbow', scheme: MCU.SchemeRainbow },
    fruitSalad: { label: 'Fruit Salad', scheme: MCU.SchemeFruitSalad },
    monochrome: { label: 'Monochrome', scheme: MCU.SchemeMonochrome },
    content: { label: 'Content', scheme: MCU.SchemeContent },
    fidelity: { label: 'Fidelity', scheme: MCU.SchemeFidelity }
};
const THEME_PRESETS = [
    { name: 'Blue', seed: '#4285f4' },
    { name: 'Teal', seed: '#00897b' },
    { name: 'Green', seed: '#34a853' },
    { name: 'Lime', seed: '#7cb342' },
    { name: 'Yellow', seed: '#fbbc04' },
    { name: 'Orange', seed: '#fa7b17' },
    { name: 'Red', seed: '#ea4335' },
    { name: 'Pink', seed: '#e91e63' },
    { name: 'Purple', seed: '#a142f4' },
    { name: 'Indigo', seed: '#3f51b5' }
];
const THEME_ROLES = [
    'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
    'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant', 'inversePrimary',
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
    'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
    'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
    'error', 'onError', 'errorContainer', 'onErrorContainer',
    'background', 'onBackground', 'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
    'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow',
    'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
    'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'shadow', 'scrim', 'surfaceTint'
];
const HARMONIZED_COLORS = {
    'status-online': '#23a55a',
    'status-idle': '#f0b232',
    'status-dnd': '#f23f43',
    'status-offline': '#80848e'
};
const CORNER_PRESETS = {
    sharp: { section: 4, card: 4, button: 4, nav: 8 },
    default: { section: 28, card: 20, button: 20, nav: 32 },
    round: { section: 48, card: 32, button: 20, nav: 32 }
};
const CORNER_LIMITS = { section: 64, card: 40, button: 20, nav: 32 };
const ICON_SHAPES = {
    circle: { label: 'Circle', radius: () => 1 },
    squircle: {
        label: 'Squircle',
        radius: angle => Math.pow(Math.pow(Math.abs(Math.cos(angle)), 4) + Math.pow(Math.abs(Math.sin(angle)), 4), -0.25)
    },
    cookie4: { label: 'Cookie', radius: angle => (1 + 0.1 * Math.cos(4 * angle)) / 1.1 },
    cookie7: { label: 'Flower', radius: angle => (1 + 0.09 * Math.cos(7 * angle)) / 1.09 },
    scallop: { label: 'Scallop', radius: angle => (1 + 0.045 * Math.cos(12 * angle)) / 1.045 }
};
const DEFAULT_THEME_SETTINGS = {
    version: 2,
    source: 'avatar',
    avatarSeedIndex: 0,
    presetSeed: THEME_PRESETS[0].seed,
    customSeed: '#6750a4',
    customExact: false,
    secondaryOverride: null,
    tertiaryOverride: null,
    variant: 'tonalSpot',
    mode: 'dark',
    contrast: 0,
    pitchBlack: false,
    corners: CORNER_PRESETS.default,
    iconShape: 'circle',
    themedIcons: false,
    followAlbumArt: false
};

let themeSettings = loadThemeSettings();
let avatarSeeds = loadAvatarSeeds();
let albumSeeds = null;
let albumArtUrl = null;
const albumSeedCache = new Map();
let currentThemeScheme = null;
let currentThemeTokens = {};
let themeTransitionTimer = null;
const iconShapeCache = {};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function argbToHex(argb) {
    return `#${(argb & 0xffffff).toString(16).padStart(6, '0')}`;
}

function hexToArgb(hex) {
    return (0xff000000 | parseInt(hex.slice(1), 16)) >>> 0;
}

function normalizeHex(value) {
    if (typeof value !== 'string') return null;
    let hex = value.trim().replace('#', '').toLowerCase();
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

function legacyColorToHex(color) {
    if (!color || typeof color !== 'object') return null;
    const channels = [color.r, color.g, color.b].map(Number);
    if (channels.every(Number.isFinite)) {
        return `#${channels.map(channel => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
    }
    const h = Number(color.h), s = Number(color.s) / 100, l = Number(color.l) / 100;
    if (![h, s, l].every(Number.isFinite)) return null;
    const a = s * Math.min(l, 1 - l);
    const channel = n => {
        const k = (n + h / 30) % 12;
        return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function normalizeCorners(raw) {
    if (!raw || typeof raw !== 'object') {
        return raw === 'small' ? CORNER_PRESETS.sharp : raw === 'large' ? CORNER_PRESETS.round : CORNER_PRESETS.default;
    }
    const corners = {};
    Object.keys(CORNER_LIMITS).forEach(key => {
        const value = Number(raw[key]);
        corners[key] = Number.isFinite(value) ? clamp(Math.round(value), 0, CORNER_LIMITS[key]) : CORNER_PRESETS.default[key];
    });
    return corners;
}

function normalizeThemeSettings(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (raw.version !== 2) {
        const primary = legacyColorToHex(raw.primary);
        if (!primary) return null;
        return {
            ...DEFAULT_THEME_SETTINGS,
            source: raw.alwaysUseAvatarTheme === false ? 'custom' : 'avatar',
            customSeed: primary,
            secondaryOverride: raw.alwaysUseAvatarTheme === false ? legacyColorToHex(raw.secondary) : null
        };
    }
    const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
    const defaults = DEFAULT_THEME_SETTINGS;
    return {
        version: 2,
        source: pick(raw.source, ['avatar', 'preset', 'custom'], defaults.source),
        avatarSeedIndex: Number.isInteger(raw.avatarSeedIndex) ? clamp(raw.avatarSeedIndex, 0, AVATAR_SEED_COUNT - 1) : 0,
        presetSeed: normalizeHex(raw.presetSeed) || defaults.presetSeed,
        customSeed: normalizeHex(raw.customSeed) || defaults.customSeed,
        customExact: raw.customExact === true,
        secondaryOverride: normalizeHex(raw.secondaryOverride),
        tertiaryOverride: normalizeHex(raw.tertiaryOverride),
        variant: pick(raw.variant, Object.keys(THEME_VARIANTS), defaults.variant),
        mode: pick(raw.mode, ['system', 'light', 'dark'], defaults.mode),
        contrast: pick(raw.contrast, [0, 0.5, 1], defaults.contrast),
        pitchBlack: raw.pitchBlack === true,
        corners: normalizeCorners(raw.corners || raw.cornerStyle),
        iconShape: pick(raw.iconShape, Object.keys(ICON_SHAPES), defaults.iconShape),
        themedIcons: raw.themedIcons === true,
        followAlbumArt: raw.followAlbumArt === true
    };
}

function loadThemeSettings() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            const normalized = normalizeThemeSettings(JSON.parse(stored));
            if (normalized) return normalized;
        }
    } catch (error) {
    }
    return { ...DEFAULT_THEME_SETTINGS };
}

function saveThemeSettings() {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeSettings));
    } catch (error) {
    }
}

function loadAvatarSeeds() {
    try {
        const stored = JSON.parse(localStorage.getItem(AVATAR_SEEDS_STORAGE_KEY));
        if (stored && typeof stored.url === 'string' && Array.isArray(stored.colors) && stored.colors.every(normalizeHex) && (stored.achromatic === true || stored.colors.length === AVATAR_SEED_COUNT)) {
            return stored;
        }
    } catch (error) {
    }
    return null;
}

function fillSeedColors(colors) {
    const filled = [...colors];
    const base = MCU.Hct.fromInt(hexToArgb(colors[0]));
    const chroma = Math.max(base.chroma, 36);
    while (filled.length < AVATAR_SEED_COUNT) {
        const hues = filled.map(color => MCU.Hct.fromInt(hexToArgb(color)).hue).sort((a, b) => a - b);
        let gapStart = hues[hues.length - 1];
        let gapSize = hues[0] + 360 - gapStart;
        hues.slice(1).forEach((hue, index) => {
            if (hue - hues[index] > gapSize) {
                gapStart = hues[index];
                gapSize = hue - hues[index];
            }
        });
        filled.push(argbToHex(MCU.Hct.from((gapStart + gapSize / 2) % 360, chroma, 50).toInt()));
    }
    return filled;
}

function extractAvatarSeeds(imageUrl) {
    return new Promise(resolve => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onerror = () => resolve(null);
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 112;
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                context.imageSmoothingQuality = 'high';
                context.drawImage(image, 0, 0, size, size);
                const data = context.getImageData(0, 0, size, size).data;
                const pixels = [];
                for (let index = 0; index < data.length; index += 4) {
                    if (data[index + 3] < 255) continue;
                    pixels.push(((0xff << 24) | (data[index] << 16) | (data[index + 1] << 8) | data[index + 2]) >>> 0);
                }
                if (pixels.length === 0) {
                    resolve(null);
                    return;
                }
                const population = MCU.QuantizerCelebi.quantize(pixels, 128);
                const ranked = MCU.Score.score(population, { desired: AVATAR_SEED_COUNT, fallbackColorARGB: 0, filter: true });
                if (ranked.length === 1 && ranked[0] === 0) {
                    const dominant = [...population.entries()].sort((a, b) => b[1] - a[1])[0][0];
                    resolve({ url: imageUrl, colors: [argbToHex(dominant)], achromatic: true });
                    return;
                }
                resolve({ url: imageUrl, colors: fillSeedColors(ranked.map(argbToHex)), achromatic: false });
            } catch (error) {
                resolve(null);
            }
        };
        image.src = imageUrl;
    });
}

async function updateAvatarTheme(imageUrl) {
    if (avatarSeeds && avatarSeeds.url === imageUrl) return;
    const extracted = await extractAvatarSeeds(imageUrl);
    if (!extracted) return;
    avatarSeeds = extracted;
    try {
        localStorage.setItem(AVATAR_SEEDS_STORAGE_KEY, JSON.stringify(avatarSeeds));
    } catch (error) {
    }
    themeSettings.avatarSeedIndex = 0;
    saveThemeSettings();
    applyTheme(true);
    window.dispatchEvent(new CustomEvent('avatarseedschange'));
}

function isAlbumThemeActive() {
    return themeSettings.followAlbumArt && !!albumSeeds;
}

async function refreshAlbumTheme() {
    const wasActive = isAlbumThemeActive();
    const previousSeed = wasActive ? albumSeeds.colors[0] : null;
    if (!themeSettings.followAlbumArt || !albumArtUrl) {
        albumSeeds = null;
    } else {
        const url = albumArtUrl;
        const seeds = albumSeedCache.get(url) || await extractAvatarSeeds(url);
        if (url !== albumArtUrl || !themeSettings.followAlbumArt) return;
        if (seeds) albumSeedCache.set(url, seeds);
        albumSeeds = seeds;
    }
    const nextSeed = isAlbumThemeActive() ? albumSeeds.colors[0] : null;
    if (wasActive === isAlbumThemeActive() && previousSeed === nextSeed) return;
    applyTheme(true);
    window.dispatchEvent(new CustomEvent('avatarseedschange'));
}

function updateAlbumTheme(imageUrl) {
    albumArtUrl = imageUrl || null;
    refreshAlbumTheme();
}

function clearAlbumTheme() {
    albumArtUrl = null;
    refreshAlbumTheme();
}

function isThemeAchromatic() {
    if (isAlbumThemeActive()) return albumSeeds.achromatic === true;
    return themeSettings.source === 'avatar' && !!avatarSeeds && avatarSeeds.achromatic === true;
}

function getActiveSeed() {
    if (isAlbumThemeActive()) return albumSeeds.colors[0];
    if (themeSettings.source === 'preset') return themeSettings.presetSeed;
    if (themeSettings.source === 'custom') return themeSettings.customSeed;
    if (!avatarSeeds || avatarSeeds.colors.length === 0) return FALLBACK_SEED;
    return avatarSeeds.colors[themeSettings.avatarSeedIndex] || avatarSeeds.colors[0];
}

function getActiveVariant() {
    return isThemeAchromatic() ? 'monochrome' : themeSettings.variant;
}

function isDarkThemeActive() {
    if (themeSettings.mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return themeSettings.mode === 'dark';
}

function createThemeScheme(seed, variant, isDark, contrast, overrides) {
    const base = new THEME_VARIANTS[variant].scheme(MCU.Hct.fromInt(hexToArgb(seed)), isDark, contrast);
    if (!overrides || (!overrides.exact && !overrides.secondary && !overrides.tertiary)) return base;
    return new MCU.DynamicScheme({
        sourceColorHct: base.sourceColorHct,
        variant: base.variant,
        contrastLevel: contrast,
        isDark,
        primaryPalette: overrides.exact ? MCU.TonalPalette.fromInt(hexToArgb(seed)) : base.primaryPalette,
        secondaryPalette: overrides.secondary ? MCU.TonalPalette.fromInt(hexToArgb(overrides.secondary)) : base.secondaryPalette,
        tertiaryPalette: overrides.tertiary ? MCU.TonalPalette.fromInt(hexToArgb(overrides.tertiary)) : base.tertiaryPalette,
        neutralPalette: base.neutralPalette,
        neutralVariantPalette: base.neutralVariantPalette,
        errorPalette: base.errorPalette
    });
}

function getThemeOverrides() {
    if (isAlbumThemeActive() || themeSettings.source !== 'custom') return null;
    return { exact: themeSettings.customExact, secondary: themeSettings.secondaryOverride, tertiary: themeSettings.tertiaryOverride };
}

function getSchemeSwatch(seed, variant, overrides) {
    const scheme = createThemeScheme(seed, variant, isDarkThemeActive(), themeSettings.contrast, overrides);
    return {
        primary: overrides && overrides.exact ? seed : argbToHex(scheme.primary),
        secondary: argbToHex(scheme.secondaryContainer),
        tertiary: argbToHex(scheme.tertiary)
    };
}

function buildThemeTokens(scheme) {
    const tokens = {};
    THEME_ROLES.forEach(role => {
        tokens[role] = argbToHex(scheme[role]);
    });
    if (!isAlbumThemeActive() && themeSettings.source === 'custom' && themeSettings.customExact) {
        const seedTone = MCU.Hct.fromInt(hexToArgb(themeSettings.customSeed)).tone;
        const onTone = seedTone >= 60 ? 10 : seedTone >= 50 ? 0 : 100;
        tokens.primary = themeSettings.customSeed;
        tokens.surfaceTint = themeSettings.customSeed;
        tokens.onPrimary = argbToHex(scheme.primaryPalette.tone(onTone));
    }
    if (themeSettings.pitchBlack && scheme.isDark) {
        const tone = value => argbToHex(scheme.neutralPalette.tone(value));
        Object.assign(tokens, {
            background: '#000000',
            surface: '#000000',
            surfaceDim: '#000000',
            surfaceContainerLowest: '#000000',
            surfaceContainerLow: tone(4),
            surfaceContainer: tone(6),
            surfaceContainerHigh: tone(10),
            surfaceContainerHighest: tone(17)
        });
    }
    return tokens;
}

function toTokenName(role) {
    return role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function harmonizeColor(hex, scheme) {
    const blended = MCU.Hct.fromInt(MCU.Blend.harmonize(hexToArgb(hex), scheme.sourceColorArgb));
    return argbToHex(MCU.Hct.from(blended.hue, blended.chroma, scheme.isDark ? 80 : 40).toInt());
}

function getIconShapeClip(name) {
    if (!iconShapeCache[name]) {
        const points = [];
        const count = 96;
        for (let index = 0; index < count; index += 1) {
            const angle = (index / count) * Math.PI * 2;
            const radius = ICON_SHAPES[name].radius(angle);
            const x = 50 + 50 * radius * Math.cos(angle - Math.PI / 2);
            const y = 50 + 50 * radius * Math.sin(angle - Math.PI / 2);
            points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
        }
        iconShapeCache[name] = `polygon(${points.join(',')})`;
    }
    return iconShapeCache[name];
}

function updateThemedIconFilter(scheme) {
    const filter = document.getElementById('themedIconFilter');
    if (!filter) return;
    const tones = scheme.isDark ? [30, 60, 90] : [10, 40, 70];
    const stops = tones.map(tone => scheme.primaryPalette.tone(tone));
    const table = shift => stops.map(argb => (((argb >> shift) & 0xff) / 255).toFixed(3)).join(' ');
    filter.querySelector('feFuncR').setAttribute('tableValues', table(16));
    filter.querySelector('feFuncG').setAttribute('tableValues', table(8));
    filter.querySelector('feFuncB').setAttribute('tableValues', table(0));
}

function animateThemeChange() {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = setTimeout(() => root.classList.remove('theme-transition'), 450);
}

function applyTheme(animate) {
    const root = document.documentElement;
    const isDark = isDarkThemeActive();
    const scheme = createThemeScheme(getActiveSeed(), getActiveVariant(), isDark, themeSettings.contrast, getThemeOverrides());
    if (animate) animateThemeChange();
    currentThemeScheme = scheme;
    currentThemeTokens = buildThemeTokens(scheme);
    Object.entries(currentThemeTokens).forEach(([role, value]) => {
        root.style.setProperty(`--md-sys-color-${toTokenName(role)}`, value);
    });
    Object.entries(HARMONIZED_COLORS).forEach(([name, value]) => {
        root.style.setProperty(`--app-color-${name}`, harmonizeColor(value, scheme));
    });
    const corners = themeSettings.corners;
    root.style.setProperty('--md-sys-shape-corner-extra-large', `${corners.section}px`);
    root.style.setProperty('--md-sys-shape-corner-large-increased', `${corners.card}px`);
    root.style.setProperty('--md-sys-shape-corner-large', `${corners.card * 0.8}px`);
    root.style.setProperty('--md-sys-shape-corner-medium', `${corners.card * 0.6}px`);
    root.style.setProperty('--md-sys-shape-corner-small', `${corners.card * 0.4}px`);
    root.style.setProperty('--md-sys-shape-corner-extra-small', `${corners.card * 0.2}px`);
    root.style.setProperty('--app-corner-button', `${corners.button}px`);
    root.style.setProperty('--app-corner-chip', `${corners.button * 0.4}px`);
    root.style.setProperty('--app-corner-nav', `${corners.nav}px`);
    root.style.setProperty('--app-icon-shape', getIconShapeClip(themeSettings.iconShape));
    root.style.setProperty('--app-icon-shape-hover', getIconShapeClip(themeSettings.iconShape === 'scallop' ? 'circle' : 'scallop'));
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.style.setProperty('--app-color-lyric', isDark ? '#ffffff' : '#000000');
    root.dataset.themedIcons = themeSettings.themedIcons ? 'on' : 'off';
    updateThemedIconFilter(scheme);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) themeColorMeta.setAttribute('content', currentThemeTokens.surface);
}

applyTheme();
document.addEventListener('DOMContentLoaded', () => applyTheme());

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeSettings.mode !== 'system') return;
    applyTheme(true);
    window.dispatchEvent(new CustomEvent('avatarseedschange'));
});

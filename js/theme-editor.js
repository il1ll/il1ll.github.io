function getThemeExportObject() {
    return { ...themeSettings };
}

function highlightJson(json) {
    const escaped = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(
        /"(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b/g,
        token => {
            if (token.endsWith(':')) {
                return `<span class="j-key">${token.slice(0, -1)}</span><span class="j-punc">:</span>`;
            }
            if (token.startsWith('"')) return `<span class="j-str">${token}</span>`;
            if (token === 'true' || token === 'false') return `<span class="j-bool">${token}</span>`;
            if (token === 'null') return `<span class="j-null">${token}</span>`;
            return `<span class="j-num">${token}</span>`;
        }
    );
}

function fallbackCopyText(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
        document.execCommand('copy');
    } catch (error) {
    }
    area.remove();
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
    }
    fallbackCopyText(text);
    return Promise.resolve();
}

function initializeThemeEditor() {
    const avatarWrap = document.getElementById('navAvatarWrap');
    const editor = document.getElementById('themeEditor');
    const scrim = document.getElementById('themeScrim');
    const body = document.getElementById('themeEditorBody');
    const title = document.getElementById('themeEditorTitle');
    const backBtn = document.getElementById('themeBack');
    const closeBtn = document.getElementById('themeClose');
    const fileInput = document.getElementById('themeFileInput');
    const themeCode = document.getElementById('themeCode');
    const copyBtn = document.getElementById('copyThemeBtn');
    const importArea = document.getElementById('importArea');
    const applyImportBtn = document.getElementById('applyImportBtn');
    const themeError = document.getElementById('themeError');
    const snackbar = document.getElementById('themeSnackbar');
    const avatarSwatches = document.getElementById('avatarSwatches');
    const presetSwatches = document.getElementById('presetSwatches');
    const avatarHint = document.getElementById('avatarHint');
    const styleGrid = document.getElementById('styleGrid');
    const styleHint = document.getElementById('styleHint');
    const iconShapes = document.getElementById('iconShapes');
    const pitchBlackRow = document.getElementById('pitchBlackRow');
    const seedPicker = document.getElementById('customSeedPicker');
    const seedHex = document.getElementById('customSeedHex');
    const hueInput = document.getElementById('customHue');
    const chromaInput = document.getElementById('customChroma');
    const toneInput = document.getElementById('customTone');
    const exactSeedToggle = document.getElementById('exactSeedToggle');
    const cornerPresets = document.getElementById('cornerPresets');
    const cornerSliders = editor.querySelectorAll('[data-corner]');
    const overrideControls = [
        { key: 'secondaryOverride', picker: 'secondaryOverridePicker', toggle: 'secondaryOverrideToggle', label: 'secondaryOverrideLabel', role: 'secondary' },
        { key: 'tertiaryOverride', picker: 'tertiaryOverridePicker', toggle: 'tertiaryOverrideToggle', label: 'tertiaryOverrideLabel', role: 'tertiary' }
    ].map(control => ({
        ...control,
        picker: document.getElementById(control.picker),
        toggle: document.getElementById(control.toggle),
        label: document.getElementById(control.label)
    }));
    const parentViews = { 'export-text': 'export-choice', 'import-text': 'import-choice' };
    const rolePairs = [
        ['primary', 'onPrimary'], ['onPrimary', 'primary'],
        ['primaryContainer', 'onPrimaryContainer'], ['onPrimaryContainer', 'primaryContainer'],
        ['secondary', 'onSecondary'], ['onSecondary', 'secondary'],
        ['secondaryContainer', 'onSecondaryContainer'], ['onSecondaryContainer', 'secondaryContainer'],
        ['tertiary', 'onTertiary'], ['onTertiary', 'tertiary'],
        ['tertiaryContainer', 'onTertiaryContainer'], ['onTertiaryContainer', 'tertiaryContainer'],
        ['error', 'onError'], ['errorContainer', 'onErrorContainer'],
        ['surface', 'onSurface'], ['onSurface', 'surface'],
        ['surfaceDim', 'onSurface'], ['surfaceBright', 'onSurface'],
        ['surfaceContainerLowest', 'onSurface'], ['surfaceContainerLow', 'onSurface'],
        ['surfaceContainer', 'onSurface'], ['surfaceContainerHigh', 'onSurface'],
        ['surfaceContainerHighest', 'onSurface'], ['onSurfaceVariant', 'surface'],
        ['outline', 'surface'], ['outlineVariant', 'onSurface'],
        ['inverseSurface', 'inverseOnSurface'], ['inversePrimary', 'onSurface']
    ];
    const tonalPalettes = [
        ['Primary', 'primaryPalette'], ['Secondary', 'secondaryPalette'], ['Tertiary', 'tertiaryPalette'],
        ['Neutral', 'neutralPalette'], ['Neutral variant', 'neutralVariantPalette'], ['Error', 'errorPalette']
    ];
    const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
    let activeView = 'main';
    let activeTab = themeSettings.source;
    let snackbarTimer = null;

    function positionEditor() {
        const rect = avatarWrap.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        editor.style.setProperty('--te-x', `${rect.left + rect.width / 2 - editorRect.left}px`);
        editor.style.setProperty('--te-y', `${rect.top + rect.height / 2 - editorRect.top}px`);
    }

    function showSnackbar(message) {
        snackbar.textContent = message;
        snackbar.classList.add('show');
        clearTimeout(snackbarTimer);
        snackbarTimer = setTimeout(() => snackbar.classList.remove('show'), 2400);
    }

    function showError(message) {
        themeError.textContent = message;
        themeError.classList.add('show');
    }

    function showView(name) {
        activeView = name;
        editor.querySelectorAll('.theme-view').forEach(view => {
            const isActive = view.dataset.view === name;
            view.classList.toggle('active', isActive);
            if (isActive) title.textContent = view.dataset.title;
        });
        backBtn.hidden = name === 'main';
        body.scrollTop = 0;
        themeError.classList.remove('show');
        if (name === 'import-text') importArea.value = '';
        if (name === 'palette') renderPalette();
    }

    function openEditor() {
        syncControls(true);
        positionEditor();
        editor.classList.add('open');
        scrim.classList.add('open');
        closeBtn.focus({ preventScroll: true });
    }

    function closeEditor() {
        editor.classList.remove('open');
        scrim.classList.remove('open');
        avatarWrap.focus({ preventScroll: true });
        setTimeout(() => {
            if (!editor.classList.contains('open')) showView('main');
        }, 300);
    }

    function goBack() {
        showView(parentViews[activeView] || 'main');
    }

    function toggleEditor() {
        if (editor.classList.contains('open')) closeEditor();
        else openEditor();
    }

    function commitTheme(mutate, options) {
        const { animate = true, full = true } = options || {};
        mutate();
        saveThemeSettings();
        applyTheme(animate);
        syncControls(full);
        refreshAlbumTheme();
    }

    function ensureCustomSource() {
        if (themeSettings.source === 'custom') return;
        themeSettings.customSeed = getActiveSeed();
        themeSettings.source = 'custom';
    }

    function createSwatch(seed, variant, label, selected, onPick) {
        const swatch = getSchemeSwatch(seed, variant, null);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-swatch';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(selected));
        button.style.setProperty('--swatch-primary', swatch.primary);
        button.style.setProperty('--swatch-secondary', swatch.secondary);
        button.style.setProperty('--swatch-tertiary', swatch.tertiary);
        button.innerHTML = '<span class="theme-swatch-fill"></span>';
        button.addEventListener('click', onPick);
        return button;
    }

    function renderSwatches() {
        const seeds = avatarSeeds ? avatarSeeds.colors : [];
        const achromatic = !!avatarSeeds && avatarSeeds.achromatic === true;
        avatarSwatches.replaceChildren(...seeds.map((seed, index) => createSwatch(
            seed,
            achromatic ? 'monochrome' : themeSettings.variant,
            `Avatar color ${index + 1}`,
            themeSettings.source === 'avatar' && themeSettings.avatarSeedIndex === index,
            () => commitTheme(() => {
                themeSettings.source = 'avatar';
                themeSettings.avatarSeedIndex = index;
            })
        )));
        avatarHint.textContent = seeds.length === 0
            ? 'Colors will appear here once the avatar has loaded.'
            : achromatic ? 'This avatar has no real colors, so a monochrome theme is generated.' : '';
        avatarHint.hidden = avatarHint.textContent === '';

        presetSwatches.replaceChildren(...THEME_PRESETS.map(preset => createSwatch(
            preset.seed,
            themeSettings.variant,
            preset.name,
            themeSettings.source === 'preset' && themeSettings.presetSeed === preset.seed,
            () => commitTheme(() => {
                themeSettings.source = 'preset';
                themeSettings.presetSeed = preset.seed;
            })
        )));
    }

    function renderStyles() {
        const seed = getActiveSeed();
        const activeVariant = getActiveVariant();
        const locked = isThemeAchromatic();
        styleGrid.replaceChildren(...Object.entries(THEME_VARIANTS).map(([key, variant]) => {
            const swatch = getSchemeSwatch(seed, key, getThemeOverrides());
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-style';
            button.disabled = locked && key !== activeVariant;
            button.setAttribute('aria-pressed', String(key === activeVariant));
            button.style.setProperty('--swatch-primary', swatch.primary);
            button.style.setProperty('--swatch-secondary', swatch.secondary);
            button.style.setProperty('--swatch-tertiary', swatch.tertiary);
            button.innerHTML = `<span class="theme-swatch-fill"></span><span class="theme-style-label">${variant.label}</span>`;
            button.addEventListener('click', () => commitTheme(() => {
                themeSettings.variant = key;
            }));
            return button;
        }));
        styleHint.hidden = !locked;
    }

    function renderIconShapes() {
        iconShapes.replaceChildren(...Object.entries(ICON_SHAPES).map(([key, shape]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-shape';
            button.title = shape.label;
            button.setAttribute('aria-label', shape.label);
            button.setAttribute('aria-pressed', String(themeSettings.iconShape === key));
            button.innerHTML = '<span class="theme-shape-fill"></span>';
            button.firstChild.style.clipPath = getIconShapeClip(key);
            button.addEventListener('click', () => commitTheme(() => {
                themeSettings.iconShape = key;
            }));
            return button;
        }));
    }

    function renderPalette() {
        const rolesContainer = document.getElementById('themeRoles');
        const tonalContainer = document.getElementById('themeTonal');
        const copyColor = hex => copyTextToClipboard(hex.toUpperCase()).then(() => showSnackbar(`Copied ${hex.toUpperCase()}`));
        rolesContainer.replaceChildren(...rolePairs.map(([role, onRole]) => {
            const hex = currentThemeTokens[role];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-role';
            button.style.backgroundColor = hex;
            button.style.color = currentThemeTokens[onRole];
            const name = role.replace(/[A-Z]/g, letter => ` ${letter}`).replace(/^./, letter => letter.toUpperCase());
            button.innerHTML = `<span class="theme-role-name">${name}</span><span class="theme-role-hex">${hex.toUpperCase()}</span>`;
            button.addEventListener('click', () => copyColor(hex));
            return button;
        }));
        tonalContainer.replaceChildren(...tonalPalettes.map(([label, palette]) => {
            const row = document.createElement('div');
            row.className = 'theme-tonal-row';
            const heading = document.createElement('div');
            heading.className = 'theme-tonal-label';
            heading.textContent = label;
            const strip = document.createElement('div');
            strip.className = 'theme-tonal-strip';
            tones.forEach(tone => {
                const hex = argbToHex(currentThemeScheme[palette].tone(tone));
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'theme-tone';
                cell.style.backgroundColor = hex;
                cell.style.color = tone >= 60 ? '#000000' : '#ffffff';
                cell.title = `Tone ${tone} ${hex.toUpperCase()}`;
                cell.setAttribute('aria-label', cell.title);
                cell.textContent = tone;
                cell.addEventListener('click', () => copyColor(hex));
                strip.appendChild(cell);
            });
            row.append(heading, strip);
            return row;
        }));
    }

    function paintSliderTracks() {
        const hue = Number(hueInput.value);
        const chroma = Number(chromaInput.value);
        const tone = Number(toneInput.value);
        const gradient = (count, sample) => `linear-gradient(90deg, ${Array.from({ length: count }, (_, index) => argbToHex(sample(index / (count - 1)).toInt())).join(', ')})`;
        hueInput.style.setProperty('--slider-track', gradient(13, step => MCU.Hct.from(step * 360, Math.max(chroma, 48), clamp(tone, 45, 75))));
        chromaInput.style.setProperty('--slider-track', gradient(7, step => MCU.Hct.from(hue, step * 120, clamp(tone, 30, 80))));
        toneInput.style.setProperty('--slider-track', gradient(9, step => MCU.Hct.from(hue, chroma, step * 100)));
        document.getElementById('customHueVal').textContent = hue;
        document.getElementById('customChromaVal').textContent = chroma;
        document.getElementById('customToneVal').textContent = tone;
    }

    function syncCustomFields(fromSliders) {
        const seed = themeSettings.source === 'custom' ? themeSettings.customSeed : getActiveSeed();
        seedPicker.value = seed;
        seedPicker.parentElement.style.setProperty('--well-color', seed);
        if (document.activeElement !== seedHex) seedHex.value = seed.toUpperCase();
        const sliderHex = argbToHex(MCU.Hct.from(Number(hueInput.value), Number(chromaInput.value), Number(toneInput.value)).toInt());
        if (!fromSliders && sliderHex !== seed) {
            const hct = MCU.Hct.fromInt(hexToArgb(seed));
            hueInput.value = Math.round(hct.hue);
            chromaInput.value = Math.round(hct.chroma);
            toneInput.value = Math.round(hct.tone);
        }
        paintSliderTracks();
        exactSeedToggle.checked = themeSettings.customExact;
        overrideControls.forEach(control => {
            const value = themeSettings[control.key];
            const shown = value || currentThemeTokens[control.role];
            control.picker.value = shown;
            control.picker.parentElement.style.setProperty('--well-color', shown);
            control.toggle.checked = !!value;
            control.label.textContent = value ? value.toUpperCase() : 'Generated from seed';
        });
    }

    function syncCorners() {
        const corners = themeSettings.corners;
        cornerSliders.forEach(slider => {
            const value = corners[slider.dataset.corner];
            const percent = (value / Number(slider.max)) * 100;
            slider.value = value;
            slider.style.setProperty('--slider-track', `linear-gradient(90deg, var(--md-sys-color-primary) ${percent}%, var(--md-sys-color-secondary-container) ${percent}%)`);
            editor.querySelector(`[data-corner-value="${slider.dataset.corner}"]`).textContent = `${value}px`;
        });
        cornerPresets.querySelectorAll('.theme-segment').forEach(segment => {
            const preset = CORNER_PRESETS[segment.dataset.value];
            const isActive = Object.keys(preset).every(key => preset[key] === corners[key]);
            segment.classList.toggle('active', isActive);
            segment.setAttribute('aria-checked', String(isActive));
        });
    }

    function syncControls(full, fromSliders) {
        editor.querySelectorAll('.theme-tab').forEach(tab => {
            const isActive = tab.dataset.tab === activeTab;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
        editor.querySelectorAll('.theme-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === activeTab);
        });
        editor.querySelectorAll('.theme-segmented[data-setting]').forEach(group => {
            group.querySelectorAll('.theme-segment').forEach(segment => {
                const isActive = segment.dataset.value === String(themeSettings[group.dataset.setting]);
                segment.classList.toggle('active', isActive);
                segment.setAttribute('aria-checked', String(isActive));
            });
        });
        editor.querySelectorAll('[data-switch]').forEach(input => {
            input.checked = themeSettings[input.dataset.switch];
        });
        document.getElementById('albumHint').hidden = !isAlbumThemeActive();
        const pitchBlackInput = pitchBlackRow.querySelector('input');
        pitchBlackInput.disabled = !isDarkThemeActive();
        pitchBlackRow.classList.toggle('disabled', pitchBlackInput.disabled);
        syncCustomFields(fromSliders);
        syncCorners();
        if (full) {
            renderSwatches();
            renderStyles();
            renderIconShapes();
        }
    }

    function setCustomSeed(hex, options) {
        commitTheme(() => {
            themeSettings.source = 'custom';
            themeSettings.customSeed = hex;
        }, options);
    }

    function applyImportedTheme(text) {
        let parsed = null;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            parsed = null;
        }
        const normalized = normalizeThemeSettings(parsed);
        if (!normalized) {
            showError('Invalid theme data, expected a valid theme JSON.');
            return false;
        }
        themeSettings = normalized;
        activeTab = themeSettings.source;
        commitTheme(() => {});
        showSnackbar('Theme imported');
        return true;
    }

    avatarWrap.addEventListener('click', toggleEditor);
    avatarWrap.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleEditor();
        }
    });
    closeBtn.addEventListener('click', closeEditor);
    backBtn.addEventListener('click', goBack);
    scrim.addEventListener('click', closeEditor);
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !editor.classList.contains('open')) return;
        if (activeView === 'main') closeEditor();
        else goBack();
    });
    window.addEventListener('resize', () => {
        if (editor.classList.contains('open')) positionEditor();
    });
    window.addEventListener('avatarseedschange', () => syncControls(true));

    editor.querySelectorAll('.theme-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            syncControls(false);
        });
    });

    editor.querySelectorAll('.theme-segmented[data-setting]').forEach(group => {
        group.querySelectorAll('.theme-segment').forEach(segment => {
            segment.addEventListener('click', () => commitTheme(() => {
                const setting = group.dataset.setting;
                themeSettings[setting] = setting === 'contrast' ? Number(segment.dataset.value) : segment.dataset.value;
            }));
        });
    });

    editor.querySelectorAll('[data-switch]').forEach(input => {
        input.addEventListener('change', () => commitTheme(() => {
            themeSettings[input.dataset.switch] = input.checked;
        }));
    });

    seedPicker.addEventListener('input', () => setCustomSeed(seedPicker.value, { animate: false, full: false }));
    seedPicker.addEventListener('change', () => syncControls(true));

    seedHex.addEventListener('input', () => {
        const hex = normalizeHex(seedHex.value);
        seedHex.parentElement.classList.toggle('invalid', !hex);
        if (hex) setCustomSeed(hex);
    });
    seedHex.addEventListener('blur', () => {
        seedHex.parentElement.classList.remove('invalid');
        syncControls(false);
    });

    [hueInput, chromaInput, toneInput].forEach(input => {
        input.addEventListener('input', () => {
            const hex = argbToHex(MCU.Hct.from(Number(hueInput.value), Number(chromaInput.value), Number(toneInput.value)).toInt());
            themeSettings.source = 'custom';
            themeSettings.customSeed = hex;
            if (input !== hueInput) themeSettings.customExact = true;
            saveThemeSettings();
            applyTheme(false);
            syncControls(false, true);
        });
        input.addEventListener('change', () => syncControls(true, true));
    });

    exactSeedToggle.addEventListener('change', () => commitTheme(() => {
        ensureCustomSource();
        themeSettings.customExact = exactSeedToggle.checked;
    }));

    cornerPresets.querySelectorAll('.theme-segment').forEach(segment => {
        segment.addEventListener('click', () => commitTheme(() => {
            themeSettings.corners = CORNER_PRESETS[segment.dataset.value];
        }));
    });

    cornerSliders.forEach(slider => {
        slider.addEventListener('input', () => commitTheme(() => {
            themeSettings.corners = { ...themeSettings.corners, [slider.dataset.corner]: Number(slider.value) };
        }, { animate: false, full: false }));
    });

    overrideControls.forEach(control => {
        control.toggle.addEventListener('change', () => commitTheme(() => {
            ensureCustomSource();
            themeSettings[control.key] = control.toggle.checked ? control.picker.value : null;
        }));
        control.picker.addEventListener('input', () => commitTheme(() => {
            ensureCustomSource();
            themeSettings[control.key] = control.picker.value;
        }, { animate: false, full: false }));
        control.picker.addEventListener('change', () => syncControls(true));
    });

    document.getElementById('paletteBtn').addEventListener('click', () => showView('palette'));
    document.getElementById('exportBtn').addEventListener('click', () => showView('export-choice'));
    document.getElementById('importBtn').addEventListener('click', () => showView('import-choice'));

    document.getElementById('resetBtn').addEventListener('click', () => {
        commitTheme(() => {
            themeSettings = { ...DEFAULT_THEME_SETTINGS };
            activeTab = themeSettings.source;
        });
        showSnackbar('Theme reset');
    });

    document.getElementById('exportFileBtn').addEventListener('click', () => {
        const json = JSON.stringify(getThemeExportObject(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'theme.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    document.getElementById('exportTextBtn').addEventListener('click', () => {
        themeCode.innerHTML = highlightJson(JSON.stringify(getThemeExportObject(), null, 2));
        showView('export-text');
    });

    copyBtn.addEventListener('click', () => {
        copyTextToClipboard(themeCode.textContent).then(() => showSnackbar('Theme copied'));
    });

    document.getElementById('importFileBtn').addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    document.getElementById('importTextBtn').addEventListener('click', () => showView('import-text'));

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (applyImportedTheme(reader.result)) showView('main');
        };
        reader.onerror = () => showError('Could not read the selected file.');
        reader.readAsText(file);
    });

    applyImportBtn.addEventListener('click', () => {
        if (applyImportedTheme(importArea.value)) showView('main');
    });

    importArea.addEventListener('input', () => themeError.classList.remove('show'));

    syncControls(true);
}

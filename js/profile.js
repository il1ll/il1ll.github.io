const coderId = '1099039269391171765';
const CdnBaseUrl = 'https://cdn.discordapp.com/';
const DcdnUrl = `https://dcdn.dstn.to/profile/${coderId}`;

const IconPaths = {
    desktop: "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z",
    web: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z",
    mobile: "M 6.992 0 L 17.008 0 C 18.66 0 20 1.34 20 2.992 L 20 21.008 C 20 22.66 18.66 24 17.008 24 L 6.992 24 C 5.34 24 4 22.66 4 21.008 L 4 2.992 C 4 1.34 5.34 0 6.992 0 Z M 6 16 L 18 16 L 18 4 L 6 4 Z M 12 18 C 10.895 18 10 18.895 10 20 C 10 21.105 10.895 22 12 22 C 13.105 22 14 21.105 14 20 C 14 18.895 13.105 18 12 18 Z",
    embedded: "M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z",
    vr: "M8.46 8.64a1 1 0 0 1 1 1c0 .44-.3.8-.72.92l-.11.07c-.08.06-.2.19-.2.41a.99.99 0 0 1-.98.86h-.06a1 1 0 0 1-.94-1.05l.02-.32c.05-1.06.92-1.9 1.99-1.9ZM15.55 5a5.5 5.5 0 0 1 5.15 3.67h.3a2 2 0 0 1 2 2v3.18a2 2 0 0 1-2 1.99h-.2A4.54 4.54 0 0 1 16.55 19a4.45 4.45 0 0 1-3.6-1.83 1.2 1.2 0 0 0-1.9 0 4.44 4.44 0 0 1-3.9 1.82 4.54 4.54 0 0 1-3.94-3.15H3a2 2 0 0 1-2-2v-3.18c0-1.1.9-1.99 2-1.99h.3A5.5 5.5 0 0 1 8.46 5h7.09Zm-7.1 2C6.6 7 5.06 8.5 4.97 10.41l-.02.66v3.18c0 1.43 1.05 2.66 2.34 2.74.85.06 1.63-.32 2.14-1.01a3.2 3.2 0 0 1 2.57-1.3c1 0 1.97.48 2.57 1.3.5.69 1.3 1.08 2.14 1.01 1.3-.08 2.34-1.31 2.34-2.74l-.02-3.84a3.54 3.54 0 0 0-3.49-3.43H8.45Z", 
};

let currentStatus = '';
let lastCustomStatus = null;

async function fetchDcdnData() {
    try {
        const response = await fetch(DcdnUrl);
        const data = await response.json();
        if (data.user) {
            updateBanner(data.user);
            updateBadges(data.badges);
            updateNameGradient(data.user);
        }
    } catch (error) {
        console.error('Failed to fetch DCDN data:', error);
    }
}

function updateBanner(userData) {
    const bannerElement = document.getElementById('profileBanner');
    const bannerGifElement = document.getElementById('profileBannerGif');
    const colorBannerElement = document.getElementById('colorBanner');
    bannerElement.style.display = 'none';
    bannerGifElement.style.display = 'none';
    colorBannerElement.style.display = 'none';
    if (userData.banner) {
        if (userData.banner.startsWith('a_')) {
            const gifUrl = `${CdnBaseUrl}banners/${coderId}/${userData.banner}.gif?size=480`;
            bannerGifElement.src = gifUrl;
            bannerGifElement.style.display = 'block';
        } else {
            const pngUrl = `${CdnBaseUrl}banners/${coderId}/${userData.banner}.png?size=480`;
            bannerElement.src = pngUrl;
            bannerElement.style.display = 'block';
        }
    } else if (userData.banner_color || userData.accent_color) {
        const color = userData.banner_color || `#${userData.accent_color.toString(16).padStart(6, '0')}`;
        colorBannerElement.style.backgroundColor = color;
        colorBannerElement.style.display = 'block';
    }
}

function updateBadges(badges) {
    const badgesContainer = document.getElementById('badgesContainer');
    badgesContainer.innerHTML = '';
    if (badges && badges.length > 0) {
        badges.forEach(badge => {
            if (badge.icon) {
                const badgeImg = document.createElement('img');
                badgeImg.className = 'badge-icon';
                badgeImg.src = `${CdnBaseUrl}badge-icons/${badge.icon}.png`;
                badgeImg.alt = badge.description || 'Badge';
                badgeImg.title = badge.description || '';
                badgesContainer.appendChild(badgeImg);
            }
        });
    }
}

function updateNameGradient(userData) {
    const styles = userData.display_name_styles;
    const nameElements = ['coder-name', 'displayName', 'nav-name']
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    const rawColors = Array.isArray(styles && styles.colors)
        ? styles.colors.filter((value) => Number.isFinite(value) && value >= 0 && value <= 16777215)
        : [];
    if (rawColors.length < 2) {
        nameElements.forEach((element) => element.classList.remove('name-gradient'));
        return;
    }
    const hexColors = rawColors.map((value) => `#${Math.round(value).toString(16).padStart(6, '0')}`);
    let stops;
    if (hexColors.length <= 3) {
        stops = hexColors.map((hex, index) => `${hex} ${((index / (hexColors.length - 1)) * 100).toFixed(2)}%`);
    } else {
        const step = 100 / hexColors.length;
        const blend = Math.min(14, step * 0.7);
        stops = [`${hexColors[0]} 0%`];
        for (let index = 0; index < hexColors.length - 1; index += 1) {
            const boundary = (index + 1) * step;
            stops.push(`${hexColors[index]} ${(boundary - blend / 2).toFixed(2)}%`);
            stops.push(`${hexColors[index + 1]} ${(boundary + blend / 2).toFixed(2)}%`);
        }
        stops.push(`${hexColors[hexColors.length - 1]} 100%`);
    }
    document.documentElement.style.setProperty('--name-gradient', `linear-gradient(90deg, ${stops.join(', ')})`);
    nameElements.forEach((element) => element.classList.add('name-gradient'));
}

async function updateProfile(userData) {
    const discordUser = userData.discord_user;
    const avatarElement = document.getElementById('avatar');
    const avatarGifElement = document.getElementById('avatarGif');
    const avatarDecorationElement = document.getElementById('avatarDecoration');
    const coderAvatarElement = document.getElementById('coder-avatar');
    const navAvatarElement = document.getElementById('nav-avatar');

    avatarElement.style.display = 'none';
    avatarGifElement.style.display = 'none';

    let avatarUrl;
    if (discordUser.avatar && discordUser.avatar.startsWith('a_')) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.gif?size=256`;
        avatarGifElement.src = avatarUrl;
        avatarGifElement.style.display = 'block';
    } else if (discordUser.avatar) {
        avatarUrl = `${CdnBaseUrl}avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
        avatarElement.src = avatarUrl;
        avatarElement.style.display = 'block';
    } else {
        avatarUrl = `${CdnBaseUrl}embed/avatars/${discordUser.discriminator % 5}.png`;
        avatarElement.src = avatarUrl;
        avatarElement.style.display = 'block';
    }

    coderAvatarElement.src = avatarUrl;
    navAvatarElement.src = avatarUrl;

    await updateAvatarTheme(avatarUrl);

    if (discordUser.avatar_decoration_data) {
        avatarDecorationElement.style.display = 'block';
        avatarDecorationElement.src = `${CdnBaseUrl}avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png`;
    } else {
        avatarDecorationElement.style.display = 'none';
        avatarDecorationElement.src = '';
    }

    const displayName = discordUser.global_name || discordUser.username;
    document.getElementById('displayName').textContent = displayName;
    document.getElementById('coder-name').textContent = displayName;
    document.getElementById('nav-name').textContent = displayName;
    document.getElementById('username').textContent = `@${discordUser.username}`;

    updateStatus(userData.discord_status, userData.activities);
    updateDeviceIcons(userData);
}

function updateNameplateBackground(userData) {
    const nameplateData = userData.discord_user?.collectibles?.nameplate;
    const profileHeader = document.getElementById('profileHeader');
    const nameplateVideo = document.getElementById('nameplateVideo');
    if (nameplateData && nameplateData.asset) {
        const videoUrl = `${CdnBaseUrl}assets/collectibles/${nameplateData.asset}asset.webm`;
        nameplateVideo.src = videoUrl;
        nameplateVideo.style.display = 'block';
        profileHeader.style.backgroundColor = 'transparent';
        profileHeader.style.backgroundImage = 'none';
    } else {
        nameplateVideo.src = '';
        nameplateVideo.style.display = 'none';
        profileHeader.style.backgroundColor = 'var(--md-sys-color-surface-container)';
        profileHeader.style.backgroundImage = 'none';
    }
}

function updateTagInfo(userData) {
    const primaryGuild = userData.discord_user?.primary_guild;
    const tagInfoElement = document.getElementById('tagInfo');
    tagInfoElement.innerHTML = '';
    if (primaryGuild && primaryGuild.tag && primaryGuild.badge && primaryGuild.identity_guild_id) {
        const badgeUrl = `${CdnBaseUrl}clan-badges/${primaryGuild.identity_guild_id}/${primaryGuild.badge}.png?size=16`;
        const tagContainer = document.createElement('div');
        tagContainer.className = 'tag-container';
        const tagImage = document.createElement('img');
        tagImage.className = 'tag-icon';
        tagImage.src = badgeUrl;
        tagImage.alt = 'Tag Icon';
        const tagText = document.createElement('span');
        tagText.textContent = primaryGuild.tag;
        tagContainer.appendChild(tagImage);
        tagContainer.appendChild(tagText);
        tagInfoElement.appendChild(tagContainer);
    }
}

function updateStatus(status, activities) {
    currentStatus = status;
    const indicator = document.getElementById('statusIndicator');
    indicator.className = 'status-indicator';

    const isStreaming = activities && activities.find(activity =>
        activity.type === 1 && activity.url && (activity.url.includes('twitch.tv') || activity.url.includes('youtube.com'))
    );

    if (isStreaming) {
        indicator.classList.add('status-streaming');
        return;
    }

    switch (status) {
        case 'dnd':
            indicator.classList.add('status-dnd');
            break;
        case 'online':
            indicator.classList.add('status-online');
            break;
        case 'idle':
            indicator.classList.add('status-idle');
            break;
        default:
            indicator.classList.add('status-offline');
    }
}

function updateDeviceIcons(userData) {
    const deviceIcons = document.getElementById('deviceIcons');
    deviceIcons.innerHTML = '';
    const devices = [];
    
    if (userData.active_on_discord_desktop) devices.push('desktop');
    if (userData.active_on_discord_mobile) devices.push('mobile');
    if (userData.active_on_discord_web) devices.push('web');
    if (userData.active_on_discord_embedded) devices.push('embedded');
    if (userData.active_on_discord_vr) devices.push('vr');
    
    devices.forEach(device => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `device-icon ${device} ${currentStatus}`);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'currentColor');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', IconPaths[device]);
        
        if (device === 'mobile') {
            path.setAttribute('transform', 'translate(2, 2) scale(0.8333)');
            
            svg.style.marginLeft = '-2px';
            svg.style.marginRight = '-2px';
        }
        
        svg.appendChild(path);
        deviceIcons.appendChild(svg);
    });
}

function updateCustomStatus(activities) {
    const customStatusElement = document.getElementById('customStatus');
    const separatorElement = document.getElementById('statusSeparator');
    const usernameElement = document.getElementById('username');
    const customStatus = activities ? activities.find(activity => activity.type === 4) : null;

    const currentStatusKey = customStatus ? JSON.stringify({
        emoji: customStatus.emoji,
        state: customStatus.state
    }) : null;

    if (currentStatusKey === lastCustomStatus) {
        return false;
    }

    lastCustomStatus = currentStatusKey;

    if (!customStatus) {
        customStatusElement.innerHTML = '';
        separatorElement.style.display = 'none';
        return true;
    }

    customStatusElement.innerHTML = '';
    let hasStatusContent = false;

    if (customStatus.emoji) {
        if (customStatus.emoji.id) {
            const extension = customStatus.emoji.animated ? 'gif' : 'png';
            const emojiUrl = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${extension}`;
            const emojiImg = document.createElement('img');
            emojiImg.src = emojiUrl;
            emojiImg.alt = "emoji";
            emojiImg.className = "custom-status-emoji";
            customStatusElement.appendChild(emojiImg);
            hasStatusContent = true;
        } else if (customStatus.emoji.name) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = customStatus.emoji.name;
            customStatusElement.appendChild(emojiSpan);
            hasStatusContent = true;
        }
    }

    if (customStatus.state) {
    const textSpan = document.createElement('span');
    textSpan.textContent = customStatus.state;
    textSpan.style.overflow = 'hidden';
    textSpan.style.textOverflow = 'ellipsis';
    textSpan.style.whiteSpace = 'nowrap';
    textSpan.style.flexShrink = '1';
    textSpan.style.minWidth = '0';
    customStatusElement.appendChild(textSpan);
    hasStatusContent = true;
    }

    const hasUsernameContent = usernameElement.textContent.trim() !== '';
    if (hasStatusContent) {
        separatorElement.style.display = 'block';
    } else {
        separatorElement.style.display = 'none';
    }

    return true;
}

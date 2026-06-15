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
let progressInterval;
let currentStatus = '';
let socket = null;
let heartbeatInterval = null;
let activityIntervals = {};
let currentPage = 1;
let currentFilter = 'all';
let currentSort = 'newest';
let allProjects = [];
let lastCustomStatus = null;
let lastActivities = [];
let lastSpotifyData = null;
let isDataLoaded = false;

window.addEventListener('load', function() {
    window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', function() {
    window.scrollTo(0, 0);
    setTimeout(function() {
        window.scrollTo(0, 0);
    }, 10);
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.scrollTo(0, 0);
    }
});

function getProjectsPerPage() {
    if (window.innerWidth >= 1200) return 6;
    if (window.innerWidth >= 768) return 4;
    return 4;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function extractColorsFromImage(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 64;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            
            const colorMap = {};

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a < 32) continue;

                const q = 16;
                const qr = Math.min(255, Math.round(r / q) * q);
                const qg = Math.min(255, Math.round(g / q) * q);
                const qb = Math.min(255, Math.round(b / q) * q);
                const key = `${qr},${qg},${qb}`;

                colorMap[key] = (colorMap[key] || 0) + 1;
            }

            const allColors = Object.keys(colorMap).map(key => {
                const [r, g, b] = key.split(',').map(Number);
                return { r, g, b, count: colorMap[key], hsl: rgbToHsl(r, g, b) };
            });

            if (allColors.length === 0) {
                resolve({ primary: { h: 0, s: 40, l: 50 }, secondary: { h: 0, s: 40, l: 50 } });
                return;
            }

            let totalPixels = 0;
            let colorfulPixels = 0;
            allColors.forEach(c => {
                totalPixels += c.count;
                const isNeutral = c.hsl.s < 15 || c.hsl.l > 88 || c.hsl.l < 12;
                if (!isNeutral) colorfulPixels += c.count;
            });

            const isMonochromeImage = (colorfulPixels / totalPixels) < 0.12;

            const scoredColors = allColors.map(c => {
                const isNeutral = c.hsl.s < 15 || c.hsl.l > 88 || c.hsl.l < 12;
                let score = c.count;
                
                if (isMonochromeImage) {
                    score = c.count;
                } else {
                    if (isNeutral) {
                        score *= 0.01;
                    } else {
                        score *= (1 + c.hsl.s / 100);
                    }
                }
                return { ...c, score };
            }).sort((a, b) => b.score - a.score);

            const sortedByCount = [...allColors].sort((a, b) => b.count - a.count);

            const primaryMatch = scoredColors[0];
            
            let secondaryMatch = sortedByCount[0]; 
            
            for (let i = 0; i < sortedByCount.length; i++) {
                const current = sortedByCount[i];
                let hueDiff = Math.abs(primaryMatch.hsl.h - current.hsl.h);
                if (hueDiff > 180) hueDiff = 360 - hueDiff;

                const primaryIsNeutral = primaryMatch.hsl.s < 15 || primaryMatch.hsl.l > 88 || primaryMatch.hsl.l < 12;
                const currentIsNeutral = current.hsl.s < 15 || current.hsl.l > 88 || current.hsl.l < 12;

                let isDifferent = false;
                if (primaryIsNeutral !== currentIsNeutral) {
                    isDifferent = true;
                } else if (!primaryIsNeutral && !currentIsNeutral) {
                    if (hueDiff > 35) isDifferent = true;
                } else {
                    if (Math.abs(primaryMatch.hsl.l - current.hsl.l) > 25) isDifferent = true; 
                }

                if (isDifferent) {
                    secondaryMatch = current;
                    break;
                }
            }

            const p_isNeutral = primaryMatch.hsl.s < 15 || primaryMatch.hsl.l > 88 || primaryMatch.hsl.l < 12;
            const primaryColor = { 
                h: primaryMatch.hsl.h, 
                s: p_isNeutral ? primaryMatch.hsl.s : Math.max(primaryMatch.hsl.s, 65), 
                l: p_isNeutral ? primaryMatch.hsl.l : Math.max(Math.min(primaryMatch.hsl.l, 65), 55) 
            };
            
            const s_isNeutral = secondaryMatch.hsl.s < 15 || secondaryMatch.hsl.l > 88 || secondaryMatch.hsl.l < 12;
            const secondaryColor = { 
                h: secondaryMatch.hsl.h, 
                s: s_isNeutral ? secondaryMatch.hsl.s : Math.max(secondaryMatch.hsl.s, 50), 
                l: s_isNeutral ? secondaryMatch.hsl.l : Math.max(Math.min(secondaryMatch.hsl.l, 45), 35) 
            };

            resolve({ primary: primaryColor, secondary: secondaryColor });
        };
        img.onerror = () => resolve({ primary: { h: 0, s: 40, l: 50 }, secondary: { h: 0, s: 40, l: 50 } });
    });
}

function updateTheme(primaryColor, secondaryColor) {
    const root = document.documentElement;
    let h1 = primaryColor.h;
    let s1 = primaryColor.s;
    let h2 = secondaryColor.h;
    let s2 = secondaryColor.s;
    
    const sNV = 4;
    const surfaceL = 6;
    const surface1L = 10;
    const surface2L = 14;
    const surface3L = 18;
    const surface4L = 22;

    const surface = hslToHex(h1, sNV, surfaceL);
    const surface1 = hslToHex(h1, sNV, surface1L);
    const surface2 = hslToHex(h1, sNV, surface2L);
    const surface3 = hslToHex(h1, sNV, surface3L);
    const surface4 = hslToHex(h1, sNV, surface4L);

    const primary = hslToHex(h1, s1, 75);
    const onPrimary = hslToHex(h1, s1, 12);
    const primaryContainer = hslToHex(h2, Math.min(s2, 30), 20);
    const onPrimaryContainer = hslToHex(h2, Math.min(s2, 30), 88);

    const outlineVariant = hslToHex(h2, sNV, 22);
    const onSurface = hslToHex(h1, sNV, 92);
    const onSurfaceVar = hslToHex(h1, sNV, 68);

    const rippleColor = `hsla(${h2},${Math.min(s2, 30)}%,75%,0.15)`;
    const socialShadow = `hsla(${h2},${Math.min(s2, 30)}%,65%,0.25)`;

    const props = {
        '--md-surface': surface, '--md-surface-1': surface1,
        '--md-surface-2': surface2, '--md-surface-3': surface3,
        '--md-surface-4': surface4,
        '--md-primary': primary, '--md-on-primary': onPrimary,
        '--md-primary-container': primaryContainer,
        '--md-on-primary-container': onPrimaryContainer,
        '--md-on-surface': onSurface,
        '--md-on-surface-variant': onSurfaceVar,
        '--md-outline-variant': outlineVariant,
        '--md-ripple': rippleColor,
        '--social-shadow': socialShadow,
        '--primary-color': primary, '--secondary-color': surface,
        '--text-color': onSurface,
        '--muted-text': onSurfaceVar, '--border-color': outlineVariant,
        '--hover-color': surface3,
    };
    for (const [k, v] of Object.entries(props)) root.style.setProperty(k, v);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        document.body.style.opacity = '1';
        document.body.classList.add('loaded');
        window.scrollTo(0, 0);
    }, 500);
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
}

function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    function toggleMenu() {
        navMenu.classList.toggle('active');
        if (navMenu.classList.contains('active')) {
            menuToggle.innerHTML = '<span class="material-symbols-outlined">close</span>';
        } else {
            menuToggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        }
    }

    menuToggle.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            if (targetSection === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const section = document.getElementById(targetSection);
                if (section) {
                    const offsetTop = section.offsetTop - 100;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
            if (window.innerWidth <= 768) toggleMenu();
        });
    });
}

function initializeDropdowns() {
    const filterBtn = document.getElementById('filterBtn');
    const filterContent = document.getElementById('filterContent');
    const filterLinks = filterContent.querySelectorAll('a');

    const sortBtn = document.getElementById('sortBtn');
    const sortContent = document.getElementById('sortContent');
    const sortLinks = sortContent.querySelectorAll('a');

    filterBtn.addEventListener('click', function (e) {
        e.preventDefault();
        sortContent.classList.remove('show');
        sortBtn.classList.remove('active');
        filterContent.classList.toggle('show');
        filterBtn.classList.toggle('active');
    });

    sortBtn.addEventListener('click', function (e) {
        e.preventDefault();
        filterContent.classList.remove('show');
        filterBtn.classList.remove('active');
        sortContent.classList.toggle('show');
        sortBtn.classList.toggle('active');
    });

    filterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const filter = this.getAttribute('data-filter');
            filterLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentFilter = filter;
            currentPage = 1;
            updateProjectsDisplay();
            filterContent.classList.remove('show');
            filterBtn.classList.remove('active');
        });
    });

    sortLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sort = this.getAttribute('data-sort');
            sortLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentSort = sort;
            currentPage = 1;
            updateProjectsDisplay();
            sortContent.classList.remove('show');
            sortBtn.classList.remove('active');
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('#filterBtn') && !e.target.closest('#filterContent')) {
            filterContent.classList.remove('show');
            filterBtn.classList.remove('active');
        }
        if (!e.target.closest('#sortBtn') && !e.target.closest('#sortContent')) {
            sortContent.classList.remove('show');
            sortBtn.classList.remove('active');
        }
    });
}

async function initializePagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    try {
        const response = await fetch('projects.json');
        const projectsData = await response.json();
        allProjects = projectsData;
    } catch (error) {
        console.error('Failed to load projects:', error);
        allProjects = [];
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateProjectsDisplay();
        }
    });

    nextBtn.addEventListener('click', () => {
        const filteredProjects = getFilteredAndSortedProjects();
        const projectsPerPage = getProjectsPerPage();
        const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateProjectsDisplay();
        }
    });

    updateProjectsDisplay();
}

function getFilteredAndSortedProjects() {
    let projects = [...allProjects];

    if (currentFilter !== 'all') {
        projects = projects.filter(project => {
            return project.tech && project.tech.includes(currentFilter);
        });
    }

    if (currentSort === 'newest') {
        projects.sort((a, b) => b.id - a.id);
    } else {
        projects.sort((a, b) => a.id - b.id);
    }

    return projects;
}

function updateProjectsDisplay() {
    const filteredProjects = getFilteredAndSortedProjects();
    const projectsPerPage = getProjectsPerPage();
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const projectsToShow = filteredProjects.slice(startIndex, endIndex);

    const projectGrid = document.getElementById('projectGrid');
    projectGrid.innerHTML = '';

    projectsToShow.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';

        let techHtml = '';
        if (project.tech) {
            project.tech.forEach(tech => {
                if (tech === 'nodejs') {
                    techHtml += '<i class="devicon-nodejs-plain project-tech-icon" title="Node.js"></i>';
                } else {
                    const iconMap = {
                        'html': 'html5',
                        'css': 'css3',
                        'js': 'javascript',
                        'javascript': 'javascript',
                        'typescript': 'typescript',
                        'python': 'python',
                        'php': 'php',
                        'bash': 'bash',
                        'batch': 'windows8',
                        'lua': 'lua',
                        'java': 'java',
                        'json': 'json',
                        'xml': 'xml'
                    };
                    const iconName = iconMap[tech] || tech;
                    techHtml += `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconName}/${iconName}-original.svg" alt="${tech}" title="${tech}">`;
                }
            });
        }

        let linksHtml = '';
        if (project.source) {
            linksHtml += `<a href="${project.source}" class="btn-source" target="_blank">Source Code</a>`;
        }
        if (project.live) {
            linksHtml += `<a href="${project.live}" class="btn-live" target="_blank">Visit</a>`;
        }

        card.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tech">${techHtml}</div>
            <div class="project-links">${linksHtml}</div>
        `;
        projectGrid.appendChild(card);
    });

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || filteredProjects.length === 0;

    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = filteredProjects.length === 0 ? 'There is no projects yet :)' : `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevBtn').style.display = filteredProjects.length === 0 ? 'none' : 'flex';
    document.getElementById('nextBtn').style.display = filteredProjects.length === 0 ? 'none' : 'flex';

    adjustProjectGrid();
}

function adjustProjectGrid() {
    const projectGrid = document.getElementById('projectGrid');
    const displayedProjects = Array.from(projectGrid.querySelectorAll('.project-card'));

    if (displayedProjects.length === 0) return;

    let columns;
    if (window.innerWidth >= 1200) {
        columns = 3;
    } else if (window.innerWidth >= 768) {
        columns = 2;
    } else {
        columns = 1;
    }

    displayedProjects.forEach(project => {
        project.style.gridColumn = 'auto';
        project.style.gridRow = 'auto';
    });

    const totalProjects = displayedProjects.length;
    const lastRowCount = totalProjects % columns;

    if (lastRowCount === 1 && columns === 3) {
        const lastProject = displayedProjects[totalProjects - 1];
        lastProject.style.gridColumn = 'span 3';
    } else if (lastRowCount === 1 && columns === 2) {
        const lastProject = displayedProjects[totalProjects - 1];
        lastProject.style.gridColumn = 'span 2';
    } else if (lastRowCount === 2 && columns === 3) {
        const lastProject = displayedProjects[totalProjects - 1];
        lastProject.style.gridColumn = 'span 2';
    }
}

async function fetchDcdnData() {
    try {
        const response = await fetch(DcdnUrl);
        const data = await response.json();
        if (data.user) {
            updateBanner(data.user);
            updateBadges(data.badges);
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

        if (!customStatusChanged || spotifyChanged || hasOtherActivityChanges(userData.activities)) {
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

function updateSpotifyIfChanged(userData) {
    const currentSpotifyData = userData.listening_to_spotify && userData.spotify ? userData.spotify : null;

    const spotifyChanged = JSON.stringify(currentSpotifyData) !== JSON.stringify(lastSpotifyData);

    if (spotifyChanged) {
        lastSpotifyData = currentSpotifyData;

        if (userData.listening_to_spotify && userData.spotify) {
            updateSpotify(userData.spotify);
        } else {
            const spotifyCard = document.getElementById('spotifyCard');
            spotifyCard.classList.remove('spotify-active');
            if (progressInterval) clearInterval(progressInterval);
        }
    }

    return spotifyChanged;
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

    const colors = await extractColorsFromImage(avatarUrl);
    updateTheme(colors.primary, colors.secondary);

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
        profileHeader.style.backgroundColor = 'var(--secondary-color)';
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

function updateSpotify(spotifyData) {
    const spotifyCard = document.getElementById('spotifyCard');
    spotifyCard.classList.add('spotify-active');
    document.getElementById('albumArt').src = spotifyData.album_art_url;
    document.getElementById('trackName').textContent = spotifyData.song;
    document.getElementById('trackArtist').textContent = `by ${spotifyData.artist}`;
    const startTime = spotifyData.timestamps.start;
    const endTime = spotifyData.timestamps.end;
    const duration = endTime - startTime;
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
        document.getElementById('currentTime').textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        document.getElementById('totalTime').textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        if (progress >= 100) clearInterval(progressInterval);
    }
    updateProgress();
    progressInterval = setInterval(updateProgress, 100);
    const spotifyButtons = document.getElementById('spotifyButtons');
    spotifyButtons.innerHTML = '';
    const spotifyButton = document.createElement('a');
    spotifyButton.className = 'activity-button';
    spotifyButton.href = spotifyData.track_id ? `https://open.spotify.com/track/${spotifyData.track_id}` : '#';
    spotifyButton.target = '_blank';
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
                <svg class="activity-icon" viewBox="0 0 24 24" fill="#908caa">
                    <path d="M5.79335761,5 L18.2066424,5 C19.7805584,5 21.0868816,6.21634264 21.1990185,7.78625885 L21.8575059,17.0050826 C21.9307825,18.0309548 21.1585512,18.9219909 20.132679,18.9952675 C20.088523,18.9984215 20.0442685,19 20,19 C18.8245863,19 17.8000084,18.2000338 17.5149287,17.059715 L17,15 L7,15 L6.48507125,17.059715 C6.19999155,18.2000338 5.1754137,19 4,19 C2.97151413,19 2.13776159,18.1662475 2.13776159,17.1377616 C2.13776159,17.0934931 2.1393401,17.0492386 2.1424941,17.0050826 L2.80098151,7.78625885 C2.91311838,6.21634264 4.21944161,5 5.79335761,5 Z M14.5,10 C15.3284271,10 16,9.32842712 16,8.5 C16,7.67157288 15.3284271,7 14.5,7 C13.6715729,7 13,7.67157288 13,8.5 C13,9.32842712 13.6715729,10 14.5,10 Z M18.5,13 C19.3284271,13 20,12.3284271 20,11.5 C20,10.6715729 19.3284271,10 18.5,10 C17.6715729,10 17,10.6715729 17,11.5 C17,12.3284271 17.6715729,13 18.5,13 Z M6,9 L4,9 L4,11 L6,11 L6,13 L8,13 L8,11 L10,11 L10,9 L8,9 L8,7 L6,7 L6,9 ZM5.79335761,5 L18.2066424,5 C19.7805584,5 21.0868816,6.21634264 21.1990185,7.78625885 L21.8575059,17.0050826 C21.9307825,18.0309548 21.1585512,18.9219909 20.132679,18.9952675 C20.088523,18.9984215 20.0442685,19 20,19 C18.8245863,19 17.8000084,18.2000338 17.5149287,17.059715 L17,15 L7,15 L6.48507125,17.059715 C6.19999155,18.2000338 5.1754137,19 4,19 C2.97151413,19 2.13776159,18.1662475 2.13776159,17.1377616 C2.13776159,17.0934931 2.1393401,17.0492386 2.1424941,17.0050826 L2.80098151,7.78625885 C2.91311838,6.21634264 4.21944161,5 5.79335761,5 Z M14.5,10 C15.3284271,10 16,9.32842712 16,8.5 C16,7.67157288 15.3284271,7 14.5,7 C13.6715729,7 13,7.67157288 13,8.5 C13,9.32842712 13.6715729,10 14.5,10 Z M18.5,13 C19.3284271,13 20,12.3284271 20,11.5 C20,10.6715729 19.3284271,10 18.5,10 C17.6715729,10 17,10.6715729 17,11.5 C17,12.3284271 17.6715729,13 18.5,13 Z M6,9 L4,9 L4,11 L6,11 L6,13 L8,13 L8,11 L10,11 L10,9 L8,9 L8,7 L6,7 L6,9 Z"/>
                </svg>
                <div class="activity-title">${activityTitleText}</div>
            </div>
            <div class="activity-content">
                <div class="activity-image-container">
                    <img class="activity-large-image" src="" alt="Activity">
                    <img class="activity-small-image" src="" alt="Small Icon" style="display: none;">
                </div>
                <div class="activity-info">
                    <div class="activity-name">${activity.name}</div>
                    <div class="activity-details">${activity.details || ''}</div>
                    <div class="activity-state">${activity.state || ''}</div>
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
                button.href = buttonUrl;
                button.target = '_blank';
                button.textContent = buttonText;
                buttonsContainer.appendChild(button);
            });
        }
        activitiesContainer.appendChild(activityCard);
    });
}

function showError(message) {
    const container = document.querySelector('body');
    container.innerHTML = `<div class="error">${message}</div>`;
}

window.addEventListener('resize', function () {
    updateProjectsDisplay();
    adjustProjectGrid();
});

function initializeRipples() {
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple-effect");

        const existingRipple = button.querySelector(".ripple-effect");
        if (existingRipple) {
            existingRipple.remove();
        }
        button.appendChild(circle);
    }

    const elements = document.querySelectorAll('.nav-link, .menu-toggle, .dropdown-btn, .dropdown-content a, .btn-source, .btn-live, .pagination-btn, .social-app, .activity-button');
    elements.forEach(btn => {
        btn.classList.add('ripple-surface');
        btn.addEventListener('mousedown', createRipple);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    showLoadingScreen();

    setTimeout(() => {
        if (!isDataLoaded) {
            hideLoadingScreen();
        }
    }, 5000);

    initializeNavigation();
    initializeDropdowns();
    initializePagination();
    initializeRipples();
    connectWebSocket();
});


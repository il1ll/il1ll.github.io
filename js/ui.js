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
        navMenu.style.setProperty('--menu-x', `${menuToggle.offsetLeft + menuToggle.offsetWidth / 2 - navMenu.offsetLeft}px`);
        navMenu.style.setProperty('--menu-y', `${menuToggle.offsetTop + menuToggle.offsetHeight / 2 - navMenu.offsetTop}px`);
        navMenu.offsetHeight;
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

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('data-section') === entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    navLinks.forEach(link => {
        const section = document.getElementById(link.getAttribute('data-section'));
        if (section) sectionObserver.observe(section);
    });
}

function updateContainerLayout() {
    const container = document.querySelector('.container');
    const spotifyCard = document.getElementById('spotifyCard');
    const lyricsCard = document.getElementById('lyricsCard');
    const activitiesContainer = document.getElementById('activitiesContainer');
    if (!container || !spotifyCard || !activitiesContainer) return;
    const bodyStyle = window.getComputedStyle(document.body);
    const available = document.body.clientWidth - parseFloat(bodyStyle.paddingLeft) - parseFloat(bodyStyle.paddingRight);
    const columnWidth = 400;
    const columnGap = 10;
    const hasActivities = activitiesContainer.children.length > 0;
    const hasSpotify = spotifyCard.classList.contains('spotify-active');
    const hasLyrics = !!lyricsCard && lyricsCard.classList.contains('lyrics-active');
    const profileColumn = container.querySelector('.profile-column');
    const statusColumn = container.querySelector('.status-column');
    if (profileColumn && statusColumn) {
        const target = hasActivities ? profileColumn : statusColumn;
        if (spotifyCard.parentElement !== target) {
            target.appendChild(spotifyCard);
        }
        if (lyricsCard && profileColumn && statusColumn) {
            if (lyricsCard.parentElement !== statusColumn) {
                statusColumn.appendChild(lyricsCard);
            }
        }
    }
    const maxColumns = Math.max(1, Math.floor((available + columnGap) / (columnWidth + columnGap)));
    const columns = (hasActivities || hasSpotify || hasLyrics) && maxColumns >= 2 ? 2 : 1;
    const rows = columns === 2 ? 1 : 2;
    container.style.setProperty('--smart-columns', String(columns));
    container.style.setProperty('--smart-rows', String(rows));
}

function initializeRipples() {
    const rippleTargets = '.listen-along-btn, .nav-link, .menu-toggle, .dropdown-btn, .dropdown-content a, .btn-source, .btn-live, .pagination-btn, .app-icon, .activity-button, .games-list li, .theme-btn, .theme-icon-btn, .theme-tab, .theme-segment, .theme-list-row, .theme-style, .theme-role';

    document.addEventListener('pointerdown', function (event) {
        const target = event.target.closest(rippleTargets);
        if (!target || target.disabled || target.classList.contains('disabled')) return;
        const rect = target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
        const circle = document.createElement('span');
        circle.className = 'ripple-effect';
        circle.style.width = circle.style.height = `${radius * 2}px`;
        circle.style.left = `${x - radius}px`;
        circle.style.top = `${y - radius}px`;
        circle.addEventListener('animationend', () => circle.remove());
        target.appendChild(circle);
    });
}

function initializeTextareaCursor() {
    function updateCursor(event, element) {
        const rect = element.getBoundingClientRect();
        const corner = 22;
        const scrollbar = 18;
        if (event.clientX >= rect.right - corner && event.clientY >= rect.bottom - corner) {
            element.style.setProperty('cursor', "url('cursor/Diagonal2.png') 15 15, se-resize", 'important');
            return;
        }
        if (element.scrollHeight > element.clientHeight + 1 && event.clientX >= rect.right - scrollbar) {
            element.style.setProperty('cursor', "url('cursor/Vertical.png') 15 15, ns-resize", 'important');
            return;
        }
        element.style.setProperty('cursor', "url('cursor/Text.png') 4 9, text", 'important');
    }
    document.addEventListener('mousemove', function (event) {
        document.querySelectorAll('.theme-textarea').forEach(function (element) {
            const rect = element.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
                updateCursor(event, element);
            }
        });
    });
}

function getSafeExternalUrl(url) {
    try {
        const parsed = new URL(url, window.location.href);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '#';
    } catch (error) {
        return '#';
    }
}

function initializeGameLinks() {
    document.querySelectorAll('.games-list li[data-href]').forEach(item => {
        const open = () => window.open(item.dataset.href, '_blank', 'noopener');
        item.addEventListener('click', open);
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
    });
}

function updateNavbarScrollState() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 24);
}

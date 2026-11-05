function scrollPageToTop() {
    window.scrollTo(0, 0);
}

window.addEventListener('load', scrollPageToTop);

window.addEventListener('pageshow', function (event) {
    if (event.persisted) scrollPageToTop();
});

window.addEventListener('resize', function () {
    updateProjectsDisplay();
    adjustProjectGrid();
    updateContainerLayout();
});

window.addEventListener('scroll', updateNavbarScrollState);

document.addEventListener('DOMContentLoaded', function () {
    scrollPageToTop();
    setTimeout(scrollPageToTop, 10);
    showLoadingScreen();

    setTimeout(() => {
        if (!isDataLoaded) {
            hideLoadingScreen();
        }
    }, 5000);

    initializeThemeEditor();
    initializeNavigation();
    initializeDropdowns();
    initializePagination();
    initializeRipples();
    initializeGameLinks();
    initializeTextareaCursor();
    initializeLyricsScroll();
    initializeLyricsHeight();
    initializeLyricsFullscreen();
    initializeListenAlong();
    updateContainerLayout();
    updateNavbarScrollState();
    connectWebSocket();
});

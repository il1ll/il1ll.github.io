let currentPage = 1;
let currentFilter = 'all';
let currentSort = 'newest';
let allProjects = [];

function getProjectsPerPage() {
    if (window.innerWidth >= 1200) return 6;
    if (window.innerWidth >= 768) return 4;
    return 4;
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

        const title = document.createElement('h3');
        title.textContent = project.title;
        const description = document.createElement('p');
        description.textContent = project.description;
        const techList = document.createElement('div');
        techList.className = 'project-tech';
        const links = document.createElement('div');
        links.className = 'project-links';

        if (project.tech) {
            project.tech.forEach(tech => {
                const chip = document.createElement('span');
                chip.className = 'project-tech-chip';
                if (tech === 'nodejs' || tech === 'bash') {
                    const icon = document.createElement('i');
                    icon.className = tech === 'nodejs' ? 'devicon-nodejs-plain project-tech-icon' : 'devicon-bash-plain project-tech-icon tech-icon-mono';
                    icon.title = tech === 'nodejs' ? 'Node.js' : 'bash';
                    chip.appendChild(icon);
                } else {
                    const iconMap = {
                        'html': 'html5',
                        'css': 'css3',
                        'js': 'javascript',
                        'javascript': 'javascript',
                        'typescript': 'typescript',
                        'python': 'python',
                        'php': 'php',
                        'batch': 'windows8',
                        'lua': 'lua',
                        'java': 'java',
                        'json': 'json',
                        'xml': 'xml'
                    };
                    const iconName = encodeURIComponent(iconMap[tech] || tech);
                    const image = document.createElement('img');
                    image.src = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconName}/${iconName}-original.svg`;
                    image.alt = tech;
                    image.title = tech;
                    chip.appendChild(image);
                }
                techList.appendChild(chip);
            });
        }

        const addLink = (url, className, label) => {
            if (!url) return;
            const link = document.createElement('a');
            link.href = getSafeExternalUrl(url);
            link.className = className;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = label;
            links.appendChild(link);
        };
        addLink(project.source, 'btn-source', 'Source Code');
        addLink(project.live, 'btn-live', 'Visit');

        card.append(title, description, techList, links);
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

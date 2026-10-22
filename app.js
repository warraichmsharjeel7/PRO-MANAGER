// Client Project Management Portal - JavaScript

class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentView = 'dashboard';
        this.currentFilter = 'all';
        this.editingProjectId = null;
        this.init();
    }

    init() {
        this.initTheme(); // Theme Changer Initialization
        this.setupEventListeners();
        this.renderDashboard();
        this.renderProjects();
        this.renderClients();
        this.updateStats();
        this.updateCounts();
    }

    // --- Theme Changer logic ---
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.className = 'ri-sun-line';
            } else {
                themeIcon.className = 'ri-moon-line';
            }
        }
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('add-project-btn').addEventListener('click', () => this.openModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('project-form').addEventListener('submit', (e) => this.handleSubmit(e));

        // View navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Status filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.currentTarget.dataset.status;
                this.currentFilter = status;
                this.renderProjects();
            });
        });

        // Mobile menu
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('active');
        });
        document.getElementById('close-sidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('active');
        });

        // Close modal on outside click
        document.getElementById('project-modal').addEventListener('click', (e) => {
            if (e.target.id === 'project-modal') {
                this.closeModal();
            }
        });
    }

    switchView(view) {
        this.currentView = view;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Update view sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Update header
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Overview of all projects' },
            projects: { title: 'All Projects', subtitle: 'Manage your client projects' },
            clients: { title: 'Clients', subtitle: 'View all your clients' }
        };
        document.getElementById('view-title').textContent = titles[view].title;
        document.getElementById('view-subtitle').textContent = titles[view].subtitle;
    }

    openModal(project = null) {
        const modal = document.getElementById('project-modal');
        const modalTitle = document.getElementById('modal-title');

        if (project) {
            this.editingProjectId = project.id;
            modalTitle.textContent = 'Edit Project';
            document.getElementById('project-name').value = project.name;
            document.getElementById('client-name').value = project.client;
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('start-date').value = project.startDate || '';
            document.getElementById('deadline').value = project.deadline || '';
            document.getElementById('budget').value = project.budget || '';
            document.getElementById('progress').value = project.progress || 0;
        } else {
            this.editingProjectId = null;
            modalTitle.textContent = 'New Project';
            document.getElementById('project-form').reset();
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('project-modal').classList.remove('active');
        document.getElementById('project-form').reset();
        this.editingProjectId = null;
    }

    handleSubmit(e) {
        e.preventDefault();

        const projectData = {
            name: document.getElementById('project-name').value,
            client: document.getElementById('client-name').value,
            status: document.getElementById('project-status').value,
            description: document.getElementById('project-description').value,
            startDate: document.getElementById('start-date').value,
            deadline: document.getElementById('deadline').value,
            budget: parseFloat(document.getElementById('budget').value) || 0,
            progress: parseInt(document.getElementById('progress').value) || 0
        };

        if (this.editingProjectId) {
            this.updateProject(this.editingProjectId, projectData);
        } else {
            this.addProject(projectData);
        }

        this.closeModal();
    }

    addProject(projectData) {
        const project = {
            id: Date.now().toString(),
            ...projectData,
            createdAt: new Date().toISOString()
        };

        this.projects.unshift(project);
        this.saveProjects();
        this.renderDashboard();
        this.renderProjects();
        this.renderClients();
        this.updateStats();
        this.updateCounts();
    }

    updateProject(id, projectData) {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects[index] = {
                ...this.projects[index],
                ...projectData
            };
            this.saveProjects();
            this.renderDashboard();
            this.renderProjects();
            this.renderClients();
            this.updateStats();
        }
    }

    deleteProject(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            this.projects = this.projects.filter(p => p.id !== id);
            this.saveProjects();
            this.renderDashboard();
            this.renderProjects();
            this.renderClients();
            this.updateStats();
            this.updateCounts();
        }
    }

    getFilteredProjects() {
        if (this.currentFilter === 'all') {
            return this.projects;
        }
        return this.projects.filter(p => p.status === this.currentFilter);
    }

    renderDashboard() {
        const container = document.getElementById('dashboard-projects');
        const recentProjects = this.projects.slice(0, 6);

        if (recentProjects.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-folder-open-line"></i><h3>No projects yet</h3><p>Create your first project to get started</p></div>';
            return;
        }

        container.innerHTML = recentProjects.map(project => this.createProjectCard(project)).join('');
    }

    renderProjects() {
        const container = document.getElementById('all-projects');
        const emptyState = document.getElementById('empty-state');
        const filteredProjects = this.getFilteredProjects();

        if (filteredProjects.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = filteredProjects.map(project => this.createProjectCard(project)).join('');
    }

    createProjectCard(project) {
        const statusClass = `status-${project.status}`;
        const statusText = project.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        return `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-title">
                        <h3>${this.escapeHtml(project.name)}</h3>
                        <div class="project-client">
                            <i class="ri-user-line"></i>
                            ${this.escapeHtml(project.client)}
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                ${project.description ? `<p class="project-description">${this.escapeHtml(project.description)}</p>` : ''}
                <div class="project-meta">
                    ${project.deadline ? `
                        <div class="meta-item">
                            <i class="ri-calendar-line"></i>
                            ${this.formatDate(project.deadline)}
                        </div>
                    ` : ''}
                    ${project.budget ? `
                        <div class="meta-item">
                            <i class="ri-money-dollar-circle-line"></i>
                            $${project.budget.toLocaleString()}
                        </div>
                    ` : ''}
                </div>
                <div class="progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-value">${project.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="action-btn" onclick="projectManager.openModal(${this.escapeForAttribute(JSON.stringify(project))})">
                        <i class="ri-edit-line"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="projectManager.deleteProject('${project.id}')">
                        <i class="ri-delete-bin-line"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderClients() {
        const container = document.getElementById('clients-list');
        const clientsMap = new Map();

        // Group projects by client
        this.projects.forEach(project => {
            if (!clientsMap.has(project.client)) {
                clientsMap.set(project.client, []);
            }
            clientsMap.get(project.client).push(project);
        });

        if (clientsMap.size === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-group-line"></i><h3>No clients yet</h3><p>Add projects to see clients</p></div>';
            return;
        }

        container.innerHTML = Array.from(clientsMap.entries()).map(([client, projects]) => `
            <div class="client-card">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(client)}&background=6366f1&color=fff&size=80" alt="${client}" class="client-avatar">
                <h3 class="client-name">${this.escapeHtml(client)}</h3>
                <p class="client-projects">${projects.length} project${projects.length !== 1 ? 's' : ''}</p>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.projects.length;
        const active = this.projects.filter(p => p.status === 'in-progress').length;
        const completed = this.projects.filter(p => p.status === 'completed').length;
        const totalBudget = this.projects.reduce((sum, p) => sum + (p.budget || 0), 0);

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-active').textContent = active;
        document.getElementById('stat-completed').textContent = completed;
        document.getElementById('stat-budget').textContent = '$' + totalBudget.toLocaleString();
    }

    updateCounts() {
        const all = this.projects.length;
        const planning = this.projects.filter(p => p.status === 'planning').length;
        const inProgress = this.projects.filter(p => p.status === 'in-progress').length;
        const completed = this.projects.filter(p => p.status === 'completed').length;
        const onHold = this.projects.filter(p => p.status === 'on-hold').length;

        document.getElementById('count-all').textContent = all;
        document.getElementById('count-planning').textContent = planning;
        document.getElementById('count-progress').textContent = inProgress;
        document.getElementById('count-completed').textContent = completed;
        document.getElementById('count-hold').textContent = onHold;
    }

    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    loadProjects() {
        const saved = localStorage.getItem('projects');
        return saved ? JSON.parse(saved) : [];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForAttribute(text) {
        return text.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
    }
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.remove('active');
}

// Initialize app
let projectManager;
document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});
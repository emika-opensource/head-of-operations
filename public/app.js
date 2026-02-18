class COODashboard {
    constructor() {
        this.currentView = 'workflows';
        this.data = {
            workflows: [],
            tasks: [],
            directory: [],
            communication: []
        };
        
        this.init();
        this.loadInitialData();
    }

    init() {
        this.setupEventListeners();
        this.setupRefreshButton();
        this.setupSidebarToggle();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadCurrentViewData();
        }, 30000);
    }

    setupRefreshButton() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => {
            this.refreshData();
        });
    }

    setupSidebarToggle() {
        const toggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadWorkflows(),
            this.loadTasks(),
            this.loadDirectory()
        ]);
        this.updateUI();
    }

    async loadCurrentViewData() {
        switch(this.currentView) {
            case 'workflows':
                await this.loadWorkflows();
                break;
            case 'tasks':
                await this.loadTasks();
                break;
            case 'communication':
                await this.loadCommunication();
                break;
            case 'metrics':
                await this.loadMetrics();
                break;
        }
        this.updateUI();
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        const icon = refreshBtn.querySelector('svg');
        
        // Add spinning animation
        icon.style.animation = 'spin 1s linear infinite';
        
        try {
            await this.loadCurrentViewData();
        } finally {
            // Remove spinning animation
            setTimeout(() => {
                icon.style.animation = '';
            }, 500);
        }
    }

    async apiCall(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return { error: error.message };
        }
    }

    async loadWorkflows() {
        const result = await this.apiCall('workflows');
        if (!result.error) {
            this.data.workflows = result.workflows || [];
        }
    }

    async loadTasks() {
        const result = await this.apiCall('tasks');
        if (!result.error) {
            this.data.tasks = result.tasks || [];
        }
    }

    async loadDirectory() {
        const result = await this.apiCall('directory');
        if (!result.error) {
            this.data.directory = result.employees || [];
        }
    }

    async loadCommunication() {
        // Mock communication data for now
        this.data.communication = [
            {
                id: 1,
                author: 'Content Writer',
                avatar: 'CW',
                message: 'Blog post draft completed and ready for review',
                timestamp: new Date().toISOString(),
                taskId: 'task-001'
            },
            {
                id: 2,
                author: 'QA Specialist',
                avatar: 'QA',
                message: 'Found 3 minor issues in the latest workflow deliverable',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                taskId: 'task-002'
            },
            {
                id: 3,
                author: 'Designer',
                avatar: 'DS',
                message: 'Updated mockups based on feedback',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                taskId: 'task-003'
            }
        ];
    }

    async loadMetrics() {
        // Mock metrics data for now
        this.data.metrics = {
            agentTurns: 47,
            avgTime: '2.4h',
            reviewRounds: 3,
            totalCost: '$127.50'
        };
    }

    switchView(view) {
        if (view === this.currentView) return;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update content
        document.querySelectorAll('.content-view').forEach(viewEl => {
            viewEl.classList.toggle('active', viewEl.id === `${view}View`);
        });

        // Update page title
        const titles = {
            workflows: 'Operations Overview',
            tasks: 'Task Management',
            communication: 'Communication Log',
            metrics: 'Cost & Metrics'
        };
        document.getElementById('pageTitle').textContent = titles[view] || 'Dashboard';

        this.currentView = view;
        this.loadCurrentViewData();
    }

    updateUI() {
        switch(this.currentView) {
            case 'workflows':
                this.renderWorkflowsView();
                break;
            case 'tasks':
                this.renderTasksView();
                break;
            case 'communication':
                this.renderCommunicationView();
                break;
            case 'metrics':
                this.renderMetricsView();
                break;
        }
        this.renderTeamDirectory();
    }

    renderWorkflowsView() {
        const columns = {
            pending: document.getElementById('pendingColumn'),
            in_progress: document.getElementById('inProgressColumn'),
            in_review: document.getElementById('inReviewColumn'),
            completed: document.getElementById('completedColumn')
        };

        const counts = {
            pending: 0,
            in_progress: 0,
            in_review: 0,
            completed: 0
        };

        // Clear columns
        Object.values(columns).forEach(col => col.innerHTML = '');

        // Populate columns
        this.data.workflows.forEach(workflow => {
            const status = workflow.status || 'pending';
            if (columns[status]) {
                columns[status].appendChild(this.createWorkflowCard(workflow));
                counts[status]++;
            }
        });

        // Update counts
        Object.entries(counts).forEach(([status, count]) => {
            const countEl = document.getElementById(`${status === 'in_progress' ? 'inProgress' : status === 'in_review' ? 'inReview' : status}Count`);
            if (countEl) {
                countEl.textContent = count;
            }
        });

        // Show empty states if no data
        if (this.data.workflows.length === 0) {
            columns.pending.innerHTML = '<div class="loading">No workflows found</div>';
        }
    }

    createWorkflowCard(workflow) {
        const card = document.createElement('div');
        card.className = 'workflow-card';
        
        const progress = workflow.progress || 0;
        const steps = workflow.steps || 'N/A';
        const assignee = workflow.assignee || 'Unassigned';
        const seatUrl = workflow.seatUrl || '#';

        card.innerHTML = `
            <div class="workflow-header">
                <div class="workflow-name">${workflow.name || 'Untitled Workflow'}</div>
                <div class="workflow-steps">${steps} steps</div>
            </div>
            <div class="workflow-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}% complete</div>
            </div>
            <div class="workflow-footer">
                <div class="workflow-assignee">${assignee}</div>
                <button class="open-btn" onclick="window.open('${seatUrl}', '_blank')">
                    Open
                </button>
            </div>
        `;

        return card;
    }

    renderTasksView() {
        const container = document.getElementById('tasksGrid');
        
        if (this.data.tasks.length === 0) {
            container.innerHTML = '<div class="loading">No tasks found</div>';
            return;
        }

        container.innerHTML = '';
        this.data.tasks.forEach(task => {
            container.appendChild(this.createTaskCard(task));
        });
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';

        const status = task.status || 'pending';
        const assignee = task.assignee || 'Unassigned';
        const messageCount = task.messageCount || 0;

        card.innerHTML = `
            <div class="task-header">
                <div class="task-subject">${task.subject || 'Untitled Task'}</div>
                <div class="status-badge ${status}">${status.replace('_', ' ')}</div>
            </div>
            <div class="task-meta">
                <div class="task-assignee">${assignee}</div>
                <div class="message-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    ${messageCount}
                </div>
            </div>
        `;

        return card;
    }

    renderCommunicationView() {
        const container = document.getElementById('communicationLog');
        
        if (this.data.communication.length === 0) {
            container.innerHTML = `
                <div class="log-header">
                    <h3>Communication History</h3>
                </div>
                <div class="log-content">
                    <div class="loading">No messages found</div>
                </div>
            `;
            return;
        }

        const header = `
            <div class="log-header">
                <h3>Communication History</h3>
            </div>
        `;

        const content = this.data.communication.map(msg => `
            <div class="message-item">
                <div class="message-avatar">${msg.avatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <div class="message-author">${msg.author}</div>
                        <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                    </div>
                    <div class="message-text">${msg.message}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = header + `<div class="log-content">${content}</div>`;
    }

    renderMetricsView() {
        if (!this.data.metrics) return;

        document.getElementById('agentTurns').textContent = this.data.metrics.agentTurns || '-';
        document.getElementById('avgTime').textContent = this.data.metrics.avgTime || '-';
        document.getElementById('reviewRounds').textContent = this.data.metrics.reviewRounds || '-';
        document.getElementById('totalCost').textContent = this.data.metrics.totalCost || '-';
    }

    renderTeamDirectory() {
        const container = document.getElementById('teamDirectory');
        
        if (this.data.directory.length === 0) {
            container.innerHTML = '<div class="loading">Loading team...</div>';
            return;
        }

        container.innerHTML = '';
        this.data.directory.forEach(member => {
            container.appendChild(this.createTeamMemberCard(member));
        });
    }

    createTeamMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'team-member';

        const initials = (member.name || '??').split(' ').map(n => n[0]).join('').toUpperCase();
        const status = member.status || 'offline';
        const role = member.role || 'Unknown';

        card.innerHTML = `
            <div class="member-avatar">${initials}</div>
            <div class="member-info">
                <div class="member-name">${member.name || 'Unknown'}</div>
                <div class="member-role">${role}</div>
            </div>
            <div class="member-status ${status}"></div>
        `;

        return card;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString();
    }
}

// Add CSS animation for refresh button
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new COODashboard();
});
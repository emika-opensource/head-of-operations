/* Operations Dashboard — Head of Operations */

const API_BASE = '';
const state = { view: 'overview', tasks: [], workflows: [], team: [], activity: [] };

// Navigation
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + '-view').classList.add('active');
    state.view = view;
  });
});

// API helpers
async function api(path) {
  try {
    const res = await fetch(API_BASE + path);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Overview
function renderOverview() {
  const active = state.workflows.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length;
  const pending = state.tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  const total = state.tasks.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) + '%' : '--';

  setText('active-workflows-card', '.stat-value', active || '0');
  setText('pending-tasks-card', '.stat-value', pending || '0');
  setText('team-size-card', '.stat-value', state.team.length || '0');
  setText('completion-rate-card', '.stat-value', rate);

  // Recent activity — combine tasks and show latest 10
  const items = state.tasks
    .filter(t => t.created_at)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 10);

  const list = document.getElementById('activity-list');
  if (!items.length) {
    list.innerHTML = '<div class="loading">No activity yet</div>';
    return;
  }

  list.innerHTML = items.map(t => `
    <div class="activity-item">
      <div class="activity-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      </div>
      <div class="activity-content">
        <div class="activity-title">${escHtml(t.subject || t.goal || 'Task')}</div>
        <div class="activity-description">${escHtml(t.assigned_to_role || '')} ${t.status ? '· ' + t.status : ''}</div>
      </div>
      <div class="activity-time">${timeAgo(t.updated_at || t.created_at)}</div>
    </div>
  `).join('');
}

function setText(cardId, selector, value) {
  const card = document.getElementById(cardId);
  if (card) {
    const el = card.querySelector(selector);
    if (el) el.textContent = value;
  }
}

// Team
function renderTeam() {
  const grid = document.getElementById('team-grid');
  if (!state.team.length) {
    grid.innerHTML = '<div class="loading">No team members yet. Hire AI employees to get started.</div>';
    return;
  }

  grid.innerHTML = state.team.map(m => {
    const tasks = state.tasks.filter(t => t.assigned_to_seat === m.seat_id && t.status !== 'completed').length;
    const initial = (m.display_name || m.role || '?')[0].toUpperCase();
    return `
      <div class="team-member">
        <div class="member-header">
          <div class="member-avatar">${initial}</div>
          <div class="member-info">
            <h3>${escHtml(m.display_name || m.seat_name || 'Unknown')}</h3>
            <div class="member-role">${escHtml(m.role || 'AI Employee')}</div>
          </div>
        </div>
        <div class="member-status">
          <div class="status-indicator">
            <span class="status-dot online"></span>
            Online
          </div>
          <span class="task-count">${tasks} task${tasks !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Workflows / Kanban
function renderKanban() {
  const buckets = { pending: [], in_progress: [], in_review: [], completed: [] };

  state.tasks.forEach(t => {
    const s = t.status || 'pending';
    if (s === 'assigned' || s === 'pending') buckets.pending.push(t);
    else if (s === 'in_progress') buckets.in_progress.push(t);
    else if (s === 'in_review' || s === 'review') buckets.in_review.push(t);
    else if (s === 'completed' || s === 'done') buckets.completed.push(t);
    else buckets.pending.push(t);
  });

  renderColumn('pending-tasks', 'pending-count', buckets.pending);
  renderColumn('progress-tasks', 'progress-count', buckets.in_progress);
  renderColumn('review-tasks', 'review-count', buckets.in_review);
  renderColumn('done-tasks', 'done-count', buckets.completed);
}

function renderColumn(containerId, countId, tasks) {
  document.getElementById(countId).textContent = tasks.length;
  const el = document.getElementById(containerId);
  if (!tasks.length) {
    el.innerHTML = '<div class="loading" style="padding: 20px;">No tasks</div>';
    return;
  }
  el.innerHTML = tasks.map(t => `
    <div class="task-card">
      <div class="task-title">${escHtml(t.subject || t.goal || 'Untitled')}</div>
      <div class="task-meta">
        <div class="task-assignee">
          <span class="assignee-avatar"></span>
          ${escHtml(t.assigned_to_role || 'Unassigned')}
        </div>
        <span>${timeAgo(t.created_at)}</span>
      </div>
    </div>
  `).join('');
}

// Activity timeline
function renderTimeline() {
  const el = document.getElementById('activity-timeline');
  const items = state.tasks
    .filter(t => t.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);

  if (!items.length) {
    el.innerHTML = '<div class="loading">No activity recorded yet</div>';
    return;
  }

  el.innerHTML = items.map(t => `
    <div class="timeline-item">
      <div class="timeline-header">
        <span class="timeline-title">${escHtml(t.subject || t.goal || 'Task')}</span>
        <span class="timeline-time">${timeAgo(t.created_at)}</span>
      </div>
      <div class="timeline-description">
        ${t.assigned_to_role ? 'Assigned to ' + escHtml(t.assigned_to_role) + ' · ' : ''}Status: ${escHtml(t.status || 'unknown')}
        ${t.thread && t.thread.length ? ' · ' + t.thread.length + ' message' + (t.thread.length > 1 ? 's' : '') : ''}
      </div>
    </div>
  `).join('');
}

// Load data
async function loadAll() {
  const [tasks, workflows, team] = await Promise.all([
    api('/seat-skills/comms/tasks'),
    api('/seat-skills/comms/workflows'),
    api('/seat-skills/comms/directory'),
  ]);

  state.tasks = tasks?.tasks || [];
  state.workflows = workflows?.workflows || [];
  state.team = team?.employees || [];

  renderOverview();
  renderTeam();
  renderKanban();
  renderTimeline();
}

// Init
loadAll();
// Auto-refresh every 30s
setInterval(loadAll, 30000);

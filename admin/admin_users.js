import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, currentUser, setAuthChangeCallback } from '../src/auth.js';

// ============================================================
// STATE
// ============================================================
let allUsers = [];
let userSearchQuery = '';
let activeUserId = null;   // null = show all activity
let activeTab = 'all';     // all | comment | bookmark | read

// ============================================================
// DOM REFS
// ============================================================
const usersContainer = document.getElementById('users-container');
const activityContainer = document.getElementById('activity-container');
const activityTitle = document.getElementById('activity-title');
const userSearch = document.getElementById('user-search');
const registryTotal = document.getElementById('registry-total');
const btnClearFilter = document.getElementById('btn-clear-filter');
const profileOverlay = document.getElementById('profile-overlay');
const overlayBackdrop = document.getElementById('overlay-backdrop');
const overlayContent = document.getElementById('overlay-content');
const btnCloseOverlay = document.getElementById('btn-close-overlay');
const toastEl = document.getElementById('users-toast');
const mainWorkspace = document.getElementById('main-workspace');
const tabUsersBtn = document.getElementById('tab-users');
const tabActivityBtn = document.getElementById('tab-activity');

// ============================================================
// TOAST
// ============================================================
function showToast(msg, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.borderColor = isError ? '#ef4444' : '#22d3ee';
    toastEl.style.color = isError ? '#ef4444' : '#22d3ee';
    toastEl.classList.remove('opacity-0', 'translate-y-2');
    setTimeout(() => toastEl.classList.add('opacity-0', 'translate-y-2'), 2800);
}

// ============================================================
// MOBILE TABS
// ============================================================
function isMobile() { return window.innerWidth < 1024; }
function setMobileTab(tab) {
    if (!isMobile()) return;
    mainWorkspace.dataset.active = tab;
    const onUsers = tab === 'users';
    if (tabUsersBtn) {
        tabUsersBtn.className = `flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors border-b-2 ${onUsers ? 'text-[#22d3ee] border-[#22d3ee]' : 'text-matrix-muted border-transparent'}`;
    }
    if (tabActivityBtn) {
        tabActivityBtn.className = `flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors border-b-2 ${!onUsers ? 'text-[#22d3ee] border-[#22d3ee]' : 'text-matrix-muted border-transparent'}`;
    }
}
if (tabUsersBtn) tabUsersBtn.addEventListener('click', () => setMobileTab('users'));
if (tabActivityBtn) tabActivityBtn.addEventListener('click', () => setMobileTab('activity'));

// ============================================================
// AUTH GUARD
// ============================================================
async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') { window.location.replace('/'); return; }
    loadData();
}

// ============================================================
// DATA LOAD
// ============================================================
async function loadData() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, username, avatar_url, role, created_at, activity_public')
        .order('created_at', { ascending: false });

    if (error) { console.error('Users load failed:', error); return; }
    allUsers = data || [];
    if (registryTotal) registryTotal.innerText = `${allUsers.length} USERS`;
    renderUsers();
    loadActivity();
}

// ============================================================
// RENDER: USERS
// ============================================================
const ROLE_COLORS = {
    SOVEREIGN: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    OPERATOR: 'text-red-400 border-red-500/40 bg-red-500/10',
    Observer: 'text-[#a78bfa]/60 border-[#a78bfa]/20 bg-transparent',
};

function roleClass(role) { return ROLE_COLORS[role] || ROLE_COLORS.Observer; }

function initials(u) {
    const name = u.display_name || u.username || u.email || '?';
    return name.slice(0, 2).toUpperCase();
}

function renderUsers() {
    const q = userSearchQuery.toLowerCase();
    const filtered = allUsers.filter(u =>
        !q ||
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );

    usersContainer.innerHTML = '';

    if (filtered.length === 0) {
        usersContainer.innerHTML = `<p class="text-[10px] text-matrix-muted tracking-widest p-4 text-center">NO CITIZENS MATCH</p>`;
        return;
    }

    filtered.forEach(u => {
        const el = document.createElement('div');
        el.className = `user-row flex items-center gap-3 p-2.5 border border-transparent rounded-sm ${activeUserId === u.id ? 'active' : ''}`;
        el.dataset.userId = u.id;

        const joinDate = u.created_at
            ? new Date(u.created_at).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })
            : '--';

        el.innerHTML = `
            <!-- AVATAR -->
            <div class="w-8 h-8 rounded-full border border-[#22d3ee]/30 flex items-center justify-center text-[10px] font-bold text-[#22d3ee] bg-[#22d3ee]/10 shrink-0 overflow-hidden">
                ${u.avatar_url
                ? `<img src="${u.avatar_url}" alt="" class="w-full h-full object-cover">`
                : initials(u)
            }
            </div>
            <!-- INFO -->
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-white truncate">${u.display_name || u.username || u.email || '[NO NAME]'}</p>
                <p class="text-[9px] text-matrix-muted truncate">${u.username ? '@' + u.username : (u.email || '')}</p>
            </div>
            <!-- ROLE + DATE -->
            <div class="flex flex-col items-end gap-1 shrink-0">
                <span class="text-[8px] font-bold px-1.5 py-0.5 border tracking-widest uppercase ${roleClass(u.role)}">${u.role || 'Observer'}</span>
                <span class="text-[8px] text-matrix-muted">${joinDate}</span>
            </div>`;

        el.addEventListener('click', () => {
            activeUserId = u.id;
            renderUsers();          // refresh highlight
            loadActivity();         // filter to this user
            openUserProfile(u);     // overlay
            setMobileTab('activity');
        });

        usersContainer.appendChild(el);
    });
}

// ============================================================
// SEARCH
// ============================================================
if (userSearch) {
    userSearch.addEventListener('input', e => {
        userSearchQuery = e.target.value;
        renderUsers();
    });
}

// ============================================================
// CLEAR USER FILTER
// ============================================================
if (btnClearFilter) {
    btnClearFilter.addEventListener('click', () => {
        activeUserId = null;
        btnClearFilter.classList.add('hidden');
        activityTitle.innerText = 'ALL ACTIVITY';
        renderUsers();
        loadActivity();
    });
}

// ============================================================
// ACTIVITY TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.classList.add('text-matrix-muted');
        });
        btn.classList.add('active');
        btn.classList.remove('text-matrix-muted');
        loadActivity();
    });
});

// ============================================================
// LOAD ACTIVITY — unified: comments + bookmarks + activity_log
// ============================================================
async function loadActivity() {
    activityContainer.innerHTML = `<p class="text-[10px] text-matrix-muted animate-pulse tracking-widest p-4">LOADING...</p>`;

    const events = [];

    // ── Comments ──
    if (activeTab === 'all' || activeTab === 'comment') {
        let q = supabase.from('comments')
            .select('id, content, created_at, user_id, article_id, articles(id, title)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (activeUserId) q = q.eq('user_id', activeUserId);
        const { data } = await q;
        (data || []).forEach(c => events.push({
            type: 'comment',
            user_id: c.user_id,
            created_at: c.created_at,
            label: c.content?.slice(0, 80) || '[empty]',
            article_id: c.article_id,
            article_title: c.articles?.title || '—',
        }));
    }

    // ── Bookmarks ──
    if (activeTab === 'all' || activeTab === 'bookmark') {
        let q = supabase.from('bookmarks')
            .select('id, created_at, user_id, article_id, articles(id, title)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (activeUserId) q = q.eq('user_id', activeUserId);
        const { data } = await q;
        (data || []).forEach(b => events.push({
            type: 'bookmark',
            user_id: b.user_id,
            created_at: b.created_at,
            label: 'Added to reading list',
            article_id: b.article_id,
            article_title: b.articles?.title || '—',
        }));
    }

    // ── Activity Log (reads etc.) ──
    if (activeTab === 'all' || activeTab === 'read') {
        let q = supabase.from('activity_log')
            .select('id, action, created_at, user_id, article_id, meta, articles(id, title)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (activeUserId) q = q.eq('user_id', activeUserId);
        const { data } = await q;
        (data || []).forEach(a => events.push({
            type: 'read',
            user_id: a.user_id,
            created_at: a.created_at,
            label: a.action || 'page_view',
            article_id: a.article_id,
            article_title: a.articles?.title || '—',
        }));
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Update title
    if (activeUserId) {
        const u = allUsers.find(u => u.id === activeUserId);
        activityTitle.innerText = u ? `${(u.display_name || u.username || u.email || 'USER').toUpperCase()} // FEED` : 'USER FEED';
        btnClearFilter.classList.remove('hidden');
    } else {
        activityTitle.innerText = 'ALL ACTIVITY';
        btnClearFilter.classList.add('hidden');
    }

    // Build index for fast user lookup
    const userIndex = Object.fromEntries(allUsers.map(u => [u.id, u]));

    activityContainer.innerHTML = '';

    if (events.length === 0) {
        activityContainer.innerHTML = `<div class="text-[10px] text-matrix-muted/40 animate-pulse uppercase tracking-[0.2em] p-6 text-center border border-matrix-border/30">DEAD ZONE — NO ACTIVITY</div>`;
        return;
    }

    events.forEach(ev => {
        const u = userIndex[ev.user_id];
        const name = u ? (u.display_name || u.username || u.email || '[ANON]') : '[UNKNOWN]';
        const ts = new Date(ev.created_at).toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });

        const badgeClass = { comment: 'badge-comment', bookmark: 'badge-bookmark', read: 'badge-read' }[ev.type] || 'badge-read';
        const badgeLabel = { comment: '💬 COMMENT', bookmark: '📌 SAVE', read: '👁 READ' }[ev.type] || ev.type.toUpperCase();

        const el = document.createElement('div');
        el.className = 'flex items-start gap-3 py-2.5 border-b border-matrix-border/30 hover:bg-white/[0.02] transition-colors';
        el.innerHTML = `
            <!-- BADGE -->
            <div class="pt-0.5 shrink-0">
                <span class="activity-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <!-- BODY -->
            <div class="flex-1 min-w-0">
                <p class="text-[10px] text-white/70 font-bold truncate">${name}
                    <span class="text-matrix-muted font-normal">·</span>
                    ${ev.article_id
                ? `<a href="/post/?id=${ev.article_id}" target="_blank" class="text-[#22d3ee]/70 hover:text-[#22d3ee] hover:underline transition-colors">${ev.article_title}</a>`
                : `<span class="text-matrix-muted italic text-[9px]">${ev.label}</span>`
            }
                </p>
                ${ev.type === 'comment' ? `<p class="text-[9px] text-matrix-muted mt-0.5 truncate italic">"${ev.label}"</p>` : ''}
            </div>
            <!-- TIME -->
            <span class="text-[8px] text-matrix-muted shrink-0 pt-0.5 font-mono">${ts}</span>`;

        // Click to filter by this user
        el.addEventListener('click', () => {
            if (!ev.user_id || activeUserId === ev.user_id) return;
            activeUserId = ev.user_id;
            renderUsers();
            loadActivity();
        });

        activityContainer.appendChild(el);
    });
}

// ============================================================
// USER PROFILE OVERLAY
// ============================================================
async function openUserProfile(u) {
    profileOverlay.classList.remove('hidden-overlay');
    overlayBackdrop.classList.remove('hidden');

    // Fetch fresh profile data
    const { data: profile } = await supabase.from('profiles')
        .select('*').eq('id', u.id).single();
    const p = profile || u;

    overlayContent.innerHTML = `
        <!-- AVATAR + IDENTITY -->
        <div class="flex items-center gap-4 pb-5 border-b border-[#22d3ee]/10">
            <div class="w-14 h-14 rounded-full border-2 border-[#22d3ee]/40 flex items-center justify-center text-lg font-bold text-[#22d3ee] bg-[#22d3ee]/10 shrink-0 overflow-hidden">
                ${p.avatar_url ? `<img src="${p.avatar_url}" alt="" class="w-full h-full object-cover">` : initials(p)}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-white truncate">${p.display_name || p.username || '[NO NAME]'}</p>
                <p class="text-[10px] text-matrix-muted">${p.username ? '@' + p.username : ''}</p>
                <p class="text-[9px] text-matrix-muted mt-0.5">${p.email || ''}</p>
            </div>
        </div>

        <!-- META -->
        <div class="grid grid-cols-2 gap-3 text-[10px]">
            <div>
                <p class="text-matrix-muted tracking-widest uppercase mb-1">Role</p>
                <span class="font-bold px-2 py-0.5 border text-xs uppercase tracking-widest ${roleClass(p.role)}">${p.role || 'Observer'}</span>
            </div>
            <div>
                <p class="text-matrix-muted tracking-widest uppercase mb-1">Joined</p>
                <p class="text-white font-bold">${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</p>
            </div>
            <div>
                <p class="text-matrix-muted tracking-widest uppercase mb-1">Activity Feed</p>
                <p class="font-bold ${p.activity_public ? 'text-green-400' : 'text-yellow-400'}">${p.activity_public ? 'PUBLIC' : 'PRIVATE'}</p>
            </div>
        </div>

        <!-- BIO -->
        ${p.bio ? `
        <div>
            <p class="text-[9px] text-matrix-muted tracking-widest uppercase mb-1">Bio</p>
            <p class="text-xs text-white/70 leading-relaxed">${p.bio}</p>
        </div>` : ''}

        <!-- ADMIN ACTIONS -->
        <div class="border-t border-[#22d3ee]/10 pt-4">
            <p class="text-[9px] text-matrix-muted tracking-widest uppercase mb-3">// ADMIN CONTROLS</p>
            <div class="space-y-2">

                <!-- Change Role -->
                <div class="flex items-center gap-2">
                    <select id="overlay-role-select" title="Change user role"
                        class="flex-1 bg-matrix-bg border border-matrix-border text-white px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#22d3ee] transition-colors">
                        ${['Observer', 'OPERATOR', 'SOVEREIGN'].map(r =>
        `<option value="${r}" ${p.role === r ? 'selected' : ''}>${r}</option>`
    ).join('')}
                    </select>
                    <button id="btn-save-role"
                        class="text-[9px] font-bold text-black bg-[#22d3ee] hover:bg-white tracking-widest px-3 py-1.5 transition-colors uppercase">
                        SAVE ROLE
                    </button>
                </div>

                <!-- Toggle activity_public -->
                <button id="btn-toggle-activity-public"
                    class="w-full text-[9px] font-bold tracking-widest px-3 py-2 border transition-colors uppercase ${p.activity_public
            ? 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10'
            : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}">
                    ${p.activity_public ? '[ MAKE ACTIVITY PRIVATE ]' : '[ MAKE ACTIVITY PUBLIC ]'}
                </button>

            </div>
        </div>`;

    // ── Wire actions ──
    document.getElementById('btn-save-role').addEventListener('click', async () => {
        const newRole = document.getElementById('overlay-role-select').value;
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
        if (error) { showToast('Role save failed.', true); return; }
        showToast(`Role updated → ${newRole}`);
        const localUser = allUsers.find(x => x.id === u.id);
        if (localUser) localUser.role = newRole;
        renderUsers();
    });

    document.getElementById('btn-toggle-activity-public').addEventListener('click', async () => {
        const next = !p.activity_public;
        const { error } = await supabase.from('profiles').update({ activity_public: next }).eq('id', u.id);
        if (error) { showToast('Update failed.', true); return; }
        p.activity_public = next;
        showToast(next ? 'Activity set to public.' : 'Activity set to private.');
        openUserProfile(u); // re-render overlay
    });
}

// ── Close overlay ──
function closeOverlay() {
    profileOverlay.classList.add('hidden-overlay');
    overlayBackdrop.classList.add('hidden');
}
if (btnCloseOverlay) btnCloseOverlay.addEventListener('click', closeOverlay);
if (overlayBackdrop) overlayBackdrop.addEventListener('click', closeOverlay);

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', bootstrap);

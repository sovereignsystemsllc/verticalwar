import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ── Avatar helpers ────────────────────────────────────────────────────────────
function renderAvatar(avatarUrl, displayName, username) {
    const el = document.getElementById('avatar-display');
    if (!el) return;
    if (avatarUrl) {
        el.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover">`;
    } else {
        const initials = (displayName || username || '?').slice(0, 2).toUpperCase();
        el.textContent = initials;
    }
}

function roleStyle(role) {
    const map = {
        'SOVEREIGN': 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
        'OPERATOR': 'border-red-500 text-red-400 bg-red-500/10',
        'Observer': 'border-[#a78bfa]/30 text-[#a78bfa]/60 bg-transparent',
    };
    return map[role] || map['Observer'];
}

// ── Load profile ──────────────────────────────────────────────────────────────
async function loadProfile(user) {
    const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url, role, created_at')
        .eq('id', user.id)
        .single();

    if (error || !data) return;

    document.getElementById('display-name-display').textContent = data.display_name || data.username || 'Anonymous';
    document.getElementById('username-display').textContent = data.username ? `@${data.username}` : user.email;

    const badge = document.getElementById('role-badge');
    badge.textContent = data.role || 'Observer';
    badge.className = `mt-2 inline-block text-[9px] font-bold px-2 py-0.5 border tracking-widest uppercase ${roleStyle(data.role)}`;

    document.getElementById('iptDisplayName').value = data.display_name || '';
    document.getElementById('iptBio').value = data.bio || '';

    if (data.username) {
        const link = document.getElementById('public-profile-link');
        link.href = `/profile/view.html?u=${data.username}`;
    }

    renderAvatar(data.avatar_url, data.display_name, data.username);
    await loadBookmarks(user.id);
}

// ── Save profile ──────────────────────────────────────────────────────────────
async function saveProfile(user) {
    const display_name = document.getElementById('iptDisplayName').value.trim();
    const bio = document.getElementById('iptBio').value.trim();

    const { error } = await supabase
        .from('profiles')
        .update({ display_name, bio })
        .eq('id', user.id);

    const status = document.getElementById('save-status');
    status.classList.remove('hidden');
    if (error) {
        status.textContent = '✗ SAVE FAILED';
        status.classList.add('text-red-400');
    } else {
        status.textContent = '✓ SAVED';
    }
    setTimeout(() => status.classList.add('hidden'), 2500);
}

// ── Upload avatar ─────────────────────────────────────────────────────────────
async function uploadAvatar(user, file) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}.${ext}`;

    const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) { console.error('Avatar upload failed:', upErr); return; }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatar_url = data.publicUrl + `?t=${Date.now()}`; // bust cache

    await supabase.from('profiles').update({ avatar_url }).eq('id', user.id);
    renderAvatar(avatar_url, null, null);
}

// ── Load bookmarks ────────────────────────────────────────────────────────────
async function loadBookmarks(userId) {
    const container = document.getElementById('bookmark-list');

    const { data, error } = await supabase
        .from('bookmarks')
        .select('id, list_name, created_at, articles(id, title, slug)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        container.innerHTML = `<p class="text-[10px] text-white/20 tracking-widest italic">No saved articles yet. Use the [ + READING LIST ] button on any article.</p>`;
        return;
    }

    container.innerHTML = data.map(b => `
        <div class="flex items-center justify-between py-2 border-b border-[#a78bfa]/10 group">
            <a href="/post/?id=${b.articles.id}"
               class="text-xs text-white/70 hover:text-white transition-colors tracking-wide truncate flex-1 mr-4">
                ${b.articles.title}
            </a>
            <button data-id="${b.id}"
                class="btn-remove-bookmark text-[9px] font-bold text-red-500/40 hover:text-red-500 transition-colors tracking-widest uppercase opacity-0 group-hover:opacity-100 shrink-0">
                [REMOVE]
            </button>
        </div>
    `).join('');

    container.querySelectorAll('.btn-remove-bookmark').forEach(btn => {
        btn.addEventListener('click', async () => {
            await supabase.from('bookmarks').delete().eq('id', btn.dataset.id);
            await loadBookmarks(userId);
        });
    });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setAuthChangeCallback(async () => {
        document.getElementById('loading-state').classList.add('hidden');
        if (!currentUser) {
            document.getElementById('auth-wall').classList.remove('hidden');
            return;
        }
        document.getElementById('profile-card').classList.remove('hidden');
        await loadProfile(currentUser);

        document.getElementById('btnSaveProfile').addEventListener('click', () => saveProfile(currentUser));

        document.getElementById('avatarInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await uploadAvatar(currentUser, file);
            e.target.value = '';
        });
    });
    initAuth();
});

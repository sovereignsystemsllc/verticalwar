import { supabase } from '../src/supabaseClient.js';

function roleStyle(role) {
    const map = {
        'SOVEREIGN': 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
        'OPERATOR': 'border-red-500 text-red-400 bg-red-500/10',
        'Observer': 'border-[#a78bfa]/30 text-[#a78bfa]/60 bg-transparent',
    };
    return map[role] || map['Observer'];
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u');

    if (!username) { showNotFound(); return; }

    const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url, role, created_at')
        .eq('username', username)
        .single();

    document.getElementById('loading-state').classList.add('hidden');

    if (error || !data) { showNotFound(); return; }

    // Update page title and subtitle
    document.title = `${data.display_name || data.username} // SOVEREIGN OS`;
    document.getElementById('page-subtitle').textContent = `// ${data.username}`;

    // Avatar
    const avatarEl = document.getElementById('avatar-display');
    if (data.avatar_url) {
        avatarEl.innerHTML = `<img src="${data.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
    } else {
        avatarEl.textContent = (data.display_name || data.username || '?').slice(0, 2).toUpperCase();
    }

    document.getElementById('display-name').textContent = data.display_name || data.username;
    document.getElementById('username').textContent = `@${data.username}`;

    const badge = document.getElementById('role-badge');
    badge.textContent = data.role || 'Observer';
    badge.className = `mt-2 inline-block text-[9px] font-bold px-2 py-0.5 border tracking-widest uppercase ${roleStyle(data.role)}`;

    const joined = new Date(data.created_at);
    document.getElementById('joined-date').textContent = `Joined ${joined.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }).toUpperCase()}`;

    if (data.bio) {
        document.getElementById('bio-text').textContent = data.bio;
        document.getElementById('bio-block').classList.remove('hidden');
    }

    document.getElementById('profile-view').classList.remove('hidden');
});

function showNotFound() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('not-found').classList.remove('hidden');
}

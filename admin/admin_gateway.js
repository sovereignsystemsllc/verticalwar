import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        window.location.replace('/');
        return;
    }
    loadTelemetry();
    loadActivityLog();

    document.getElementById('btn-refresh-log')?.addEventListener('click', loadActivityLog);
}

async function loadTelemetry() {
    const statArticles = document.getElementById('stat-articles');
    const statFolders = document.getElementById('stat-folders');
    try {
        const [aRes, sRes] = await Promise.all([
            supabase.from('articles').select('*', { count: 'exact', head: true }),
            supabase.from('series').select('*', { count: 'exact', head: true }),
        ]);
        if (aRes.error) throw aRes.error;
        if (sRes.error) throw sRes.error;
        statArticles.innerText = aRes.count || 0;
        statFolders.innerText = sRes.count || 0;
    } catch (e) {
        console.error('Telemetry Load Error', e);
        statArticles.innerText = 'ERR';
        statFolders.innerText = 'ERR';
    }
}

// ── Activity Log ──────────────────────────────────────────────────────────────
const ACTION_LABELS = {
    bookmark_add: { label: '+ BOOKMARK', cls: 'text-[#a78bfa]' },
    bookmark_remove: { label: '- BOOKMARK', cls: 'text-white/30' },
    comment_post: { label: '💬 COMMENT', cls: 'text-[#00ff41]' },
    profile_view: { label: '👁 PROFILE', cls: 'text-yellow-400' },
};

async function loadActivityLog() {
    const container = document.getElementById('activity-log-table');
    if (!container) return;
    container.innerHTML = `<p class="text-[10px] text-matrix-muted tracking-widest animate-pulse">Fetching transmissions...</p>`;

    const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, created_at, profiles(username, display_name), articles(title)')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error || !data) {
        container.innerHTML = `<p class="text-[10px] text-red-500 tracking-widest">// UPLINK FAILURE: ${error?.message}</p>`;
        return;
    }

    if (data.length === 0) {
        container.innerHTML = `<p class="text-[10px] text-matrix-muted tracking-widest italic">No activity recorded yet.</p>`;
        return;
    }

    container.innerHTML = `
        <table class="w-full text-[10px] font-mono border-collapse">
            <thead>
                <tr class="border-b border-matrix-border text-matrix-muted text-left">
                    <th class="pb-2 pr-4 tracking-widest uppercase font-bold">TIME</th>
                    <th class="pb-2 pr-4 tracking-widest uppercase font-bold">OPERATOR</th>
                    <th class="pb-2 pr-4 tracking-widest uppercase font-bold">ACTION</th>
                    <th class="pb-2 tracking-widest uppercase font-bold">TARGET ARTICLE</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => {
        const displayName = row.profiles?.display_name || row.profiles?.username || 'Unknown';
        const articleTitle = row.articles?.title || '—';
        const when = new Date(row.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).toUpperCase();
        const action = ACTION_LABELS[row.action] || { label: row.action, cls: 'text-matrix-muted' };
        return `
                        <tr class="border-b border-matrix-border/30 hover:bg-matrix-green/5 transition-colors">
                            <td class="py-2 pr-4 text-matrix-muted whitespace-nowrap">${when}</td>
                            <td class="py-2 pr-4 text-[#a78bfa] font-bold">${displayName}</td>
                            <td class="py-2 pr-6 ${action.cls} font-bold whitespace-nowrap">${action.label}</td>
                            <td class="py-2 text-white/60 truncate max-w-xs">${articleTitle}</td>
                        </tr>`;
    }).join('')}
            </tbody>
        </table>
        <p class="text-[9px] text-matrix-muted tracking-widest mt-3 text-right uppercase">
            ${data.length} events // newest first
        </p>`;
}

document.addEventListener('DOMContentLoaded', bootstrap);


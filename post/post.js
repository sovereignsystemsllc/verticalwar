import '../src/style.css';
import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ── URL resolver (same as editor.js) ─────────────────────────────────────────
function resolveEmbedUrl(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v') || u.pathname.split('/').pop();
            if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        }
        if (u.hostname === 'youtu.be') {
            const id = u.pathname.replace('/', '');
            if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        }
        if (u.hostname.includes('rumble.com')) {
            const match = u.pathname.match(/\/(v[a-z0-9]+)/i);
            if (match) return `https://rumble.com/embed/${match[1]}/`;
        }
    } catch (_) { /* ignore */ }
    return null;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Avatar initials helper ────────────────────────────────────────────────────
function avatarHtml(profile) {
    if (profile?.avatar_url) {
        return `<img src="${profile.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
    }
    const initials = (profile?.display_name || profile?.username || '?').slice(0, 2).toUpperCase();
    return `<span class="text-[10px] font-bold">${initials}</span>`;
}

let articleId = null;

// ── Render comments ───────────────────────────────────────────────────────────
async function loadComments() {
    const list = document.getElementById('comment-list');
    const countEl = document.getElementById('comment-count');
    if (!list || !articleId) return;

    const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, profiles(username, display_name, avatar_url)')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

    if (error) { list.innerHTML = ''; return; }

    if (countEl) countEl.textContent = `(${data.length})`;

    if (data.length === 0) {
        list.innerHTML = `<p class="text-[10px] text-white/20 tracking-widest italic py-4">No transmissions yet. Be the first.</p>`;
        return;
    }

    list.innerHTML = data.map(c => {
        const p = c.profiles;
        const name = p?.display_name || p?.username || 'Anonymous';
        const date = new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const isSovereign = currentRole === 'SOVEREIGN';
        return `
            <div class="flex gap-3 py-4 border-b border-[#a78bfa]/10 group" data-comment-id="${c.id}">
                <div class="w-8 h-8 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 flex items-center justify-center shrink-0 overflow-hidden text-[#a78bfa]">
                    ${avatarHtml(p)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold text-[#a78bfa]/80 tracking-wide">${name}</span>
                        <span class="text-[9px] text-white/20 tracking-widest">${date}</span>
                        ${isSovereign ? `<button class="btn-hide-comment text-[8px] text-red-500/30 hover:text-red-500 ml-auto tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity" data-id="${c.id}">[HIDE]</button>` : ''}
                    </div>
                    <p class="text-sm text-white/70 leading-relaxed font-mono break-words">${c.content}</p>
                </div>
            </div>`;
    }).join('');

    // SOVEREIGN: bind hide buttons
    list.querySelectorAll('.btn-hide-comment').forEach(btn => {
        btn.addEventListener('click', async () => {
            await supabase.from('comments').update({ is_hidden: true }).eq('id', btn.dataset.id);
            await loadComments();
        });
    });
}

// ── Submit comment ────────────────────────────────────────────────────────────
async function submitComment() {
    if (!currentUser || !articleId) return;
    const input = document.getElementById('comment-input');
    const content = input?.value.trim();
    if (!content) return;

    const btn = document.getElementById('btn-submit-comment');
    btn.textContent = 'TRANSMITTING...';
    btn.disabled = true;

    const { error } = await supabase.from('comments').insert({
        article_id: articleId,
        user_id: currentUser.id,
        content,
    });

    if (!error) {
        input.value = '';
        // Log activity
        supabase.from('activity_log').insert({ user_id: currentUser.id, action: 'comment_post', article_id: articleId }).then(() => { });
        await loadComments();
    }
    btn.textContent = 'TRANSMIT';
    btn.disabled = false;
}

// ── Bookmark logic ────────────────────────────────────────────────────────────
async function setupBookmark() {
    const btn = document.getElementById('btn-bookmark');
    if (!btn || !articleId) return;

    if (!currentUser) {
        btn.addEventListener('click', () => {
            document.getElementById('login-modal')?.classList.remove('hidden');
        });
        return;
    }

    // Check if already bookmarked
    const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('article_id', articleId)
        .single();

    let bookmarked = !!data;
    updateBookmarkBtn(btn, bookmarked);

    btn.addEventListener('click', async () => {
        if (bookmarked) {
            await supabase.from('bookmarks').delete()
                .eq('user_id', currentUser.id).eq('article_id', articleId);
            supabase.from('activity_log').insert({ user_id: currentUser.id, action: 'bookmark_remove', article_id: articleId }).then(() => { });
            bookmarked = false;
        } else {
            await supabase.from('bookmarks').insert({ user_id: currentUser.id, article_id: articleId });
            supabase.from('activity_log').insert({ user_id: currentUser.id, action: 'bookmark_add', article_id: articleId }).then(() => { });
            bookmarked = true;
        }
        updateBookmarkBtn(btn, bookmarked);
    });
}

function updateBookmarkBtn(btn, saved) {
    if (saved) {
        btn.textContent = '✓ SAVED';
        btn.classList.replace('border-[#a78bfa]/30', 'border-[#a78bfa]');
        btn.classList.replace('text-[#a78bfa]/60', 'text-[#a78bfa]');
    } else {
        btn.textContent = '+ READING LIST';
        btn.classList.replace('border-[#a78bfa]', 'border-[#a78bfa]/30');
        btn.classList.replace('text-[#a78bfa]', 'text-[#a78bfa]/60');
    }
}

// ── Auth-aware comment UI ─────────────────────────────────────────────────────
function setupCommentUI() {
    const section = document.getElementById('comment-section');
    const form = document.getElementById('comment-form');
    const prompt = document.getElementById('comment-login-prompt');

    if (!section) return;
    section.classList.remove('hidden');

    if (currentUser) {
        form?.classList.remove('hidden');
        prompt?.classList.add('hidden');
        document.getElementById('btn-submit-comment')?.addEventListener('click', submitComment);
    } else {
        form?.classList.add('hidden');
        prompt?.classList.remove('hidden');
        // Login/Register links in the prompt are plain anchors — no JS needed
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    articleId = urlParams.get('id');

    // Fallback: Extract UUID from the URL path if we're in /post/UUID/
    if (!articleId) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'post' && pathParts.length > 1) {
            articleId = pathParts[1];
        }
    }

    const loadingMsg = document.getElementById('loading-msg');
    const errorMsg = document.getElementById('error-msg');
    const articleContainer = document.getElementById('article-container');
    const articleTitle = document.getElementById('article-display-title');
    const articleSubtitle = document.getElementById('article-display-subtitle');
    const articleSeries = document.getElementById('article-series');
    const articleDate = document.getElementById('article-date');
    const articleContent = document.getElementById('article-content');
    const videoContainer = document.getElementById('video-embed-container');
    const videoIframe = document.getElementById('video-iframe');

    if (!articleId) { showError(); return; }

    // Auth init — comment form visibility depends on auth state
    setAuthChangeCallback(() => {
        setupCommentUI();
        setupBookmark();
    });
    initAuth();

    try {
        const { data, error } = await supabase
            .from('articles')
            .select('title, subtitle, content_html, series, post_date, created_at, video_url')
            .eq('id', articleId)
            .single();

        if (error || !data) { showError(); return; }

        articleTitle.textContent = data.title;
        
        if (data.series) {
            articleSeries.textContent = data.series;
            articleSeries.href = `/series/${slugify(data.series)}/`;
        } else {
            articleSeries.textContent = 'UNCLASSIFIED';
            articleSeries.removeAttribute('href');
            articleSeries.classList.remove('hover:bg-[#a78bfa]', 'hover:text-black', 'cursor-pointer');
        }

        if (data.subtitle) {
            articleSubtitle.textContent = data.subtitle;
            articleSubtitle.classList.remove('hidden');
        }

        const dateObj = new Date(data.post_date || data.created_at);
        articleDate.textContent = 'DATE: ' + dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).toUpperCase();

        const embedSrc = resolveEmbedUrl(data.video_url);
        if (embedSrc && videoContainer && videoIframe) {
            videoIframe.src = embedSrc;
            videoContainer.classList.remove('hidden');
        }

        articleContent.innerHTML = data.content_html;
        document.title = `${data.title} // THE CODEX`;

        loadingMsg.classList.add('hidden');
        // FIX: fx.js adds sv-hidden (opacity:0) to all elements on load via IntersectionObserver.
        // article-container starts display:none so the observer never fires for it.
        // Must remove sv-hidden explicitly here so the article is actually visible.
        articleContainer.classList.remove('hidden', 'sv-hidden');
        articleContainer.classList.add('flex', 'flex-col');

        // Progress bar + Realtime
        initReadingProgress();
        initRealtimeComments(articleId);

    } catch (err) {
        console.error('Unexpected error:', err);
        showError();
    }

    function showError() {
        loadingMsg.classList.add('hidden');
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('flex');
    }
});

// -- READING PROGRESS BAR -----------------------------------------------------
function initReadingProgress() {
    const bar = document.getElementById('reading-progress');
    const content = document.getElementById('article-content');
    if (!bar || !content) return;

    window.addEventListener('scroll', () => {
        const rect = content.getBoundingClientRect();
        const total = content.offsetHeight;
        const scrolled = -rect.top;
        const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
        bar.style.width = pct + '%';
    }, { passive: true });
}

// -- SUPABASE REALTIME: LIVE COMMENTS -----------------------------------------
function initRealtimeComments(artId) {
    if (!artId) return;
    supabase
        .channel(`comments:${artId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `article_id=eq.${artId}`,
        }, () => {
            // Reload comment list and flash the new one green
            loadComments().then(() => {
                const list = document.getElementById('comment-list');
                if (!list) return;
                const first = list.firstElementChild;
                if (first) {
                    first.classList.add('sv-new-comment');
                    setTimeout(() => first.classList.remove('sv-new-comment'), 2000);
                }
            });
        })
        .subscribe();
}

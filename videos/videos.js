import { supabase } from '../src/supabaseClient.js';
import { trackAction } from '../src/telemetry.js';

const feedContainer = document.getElementById('video-feed');
const catFilter = document.getElementById('cat-filter');

let allVideos = [];

async function loadFeed() {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        feedContainer.innerHTML = `
            <div class="w-full flex justify-center py-20">
                <div class="text-center">
                    <p class="text-red-500 font-bold uppercase tracking-widest text-sm mb-2">CONNECTION SEVERED</p>
                    <p class="text-matrix-muted text-xs uppercase tracking-widest">${error.message}</p>
                </div>
            </div>`;
        return;
    }

    allVideos = data || [];
    renderFeed();
}

function renderFeed() {
    const filter = catFilter ? catFilter.value : '';

    const filtered = allVideos.filter(v => {
        if (filter && v.category !== filter) return false;
        return true;
    });

    feedContainer.innerHTML = '';

    if (filtered.length === 0) {
        feedContainer.innerHTML = `
            <div class="w-full flex justify-center py-20 border border-matrix-border bg-matrix-panel/30">
                <p class="text-matrix-muted text-sm tracking-widest uppercase">No transmissions found on this frequency.</p>
            </div>`;
        return;
    }

    filtered.forEach(video => {
        const article = document.createElement('article');
        article.className = 'flex flex-col gap-6 border border-matrix-border bg-matrix-panel/50 p-4 sm:p-8 relative';
        
        // Category styling logic
        let catColor = 'text-matrix-muted';
        if(video.category === 'MONOLOGUE') catColor = 'text-red-500';
        if(video.category === 'TUTORIAL') catColor = 'text-blue-500';
        if(video.category === 'DOCUMENTARY') catColor = 'text-purple-500';
        if(video.category === 'TRANSMISSION') catColor = 'text-yellow-500';

        // Featured Badge
        const featuredBadge = video.is_featured 
            ? `<div class="absolute -top-3 -right-3 bg-red-500 text-black text-[9px] font-bold tracking-widest uppercase px-3 py-1 border border-red-400 z-20 shadow-[0_0_10px_rgba(239,68,68,0.5)]">FEATURED</div>` 
            : '';

        // Generate the embed iframe securely
        // Using nocookie and modestbranding for a cleaner look
        const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtube_id}?rel=0&modestbranding=1`;

        article.innerHTML = `
            ${featuredBadge}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-matrix-border pb-4 gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[10px] font-bold tracking-widest uppercase ${catColor} bg-black/50 px-2 py-0.5 border border-white/5">
                            ${video.category}
                        </span>
                        <span class="text-[10px] text-matrix-muted tracking-widest uppercase">
                            // ${new Date(video.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h2 class="text-xl sm:text-3xl text-white font-bold tracking-tight">${video.title}</h2>
                </div>
            </div>

            <!-- Video Player -->
            <div class="video-container border border-matrix-border bg-black shadow-lg">
                <iframe 
                    src="${embedUrl}" 
                    title="${video.title}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerpolicy="strict-origin-when-cross-origin" 
                    allowfullscreen>
                </iframe>
            </div>

            <!-- Description -->
            <div class="prose prose-invert prose-sm max-w-none text-matrix-text prose-a:text-red-400 hover:prose-a:text-red-300 font-mono text-sm leading-relaxed tracking-wide">
                ${video.content}
            </div>
        `;

        feedContainer.appendChild(article);
    });
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
if (catFilter) {
    catFilter.addEventListener('change', () => {
        renderFeed();
        trackAction('video_category_filter', { category: catFilter.value || 'ALL' });
    });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
});

import { supabase } from './supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from './auth.js';
import { getArticleDescription } from './article-descriptions.js';

// ==========================================
// FORGE STATE
// ==========================================
let globalArticles = [];
let globalSeries = [];
let activeArticleId = null;
let currentSearchQuery = '';



// No local Quill needed

// ==========================================
// DOM ELEMENTS
// ==========================================
const listContainer = document.getElementById('doc-list');
const sidebar = document.getElementById('sidebar');
const reader = document.getElementById('reader');

const placeholderMsg = document.getElementById('placeholder-msg');
const htmlFrame = document.getElementById('html-frame');
const articleContent = document.getElementById('article-content');
const articleTitleDisplay = document.getElementById('article-display-title');
const articleSubtitleDisplay = document.getElementById('article-display-subtitle');

const btnCloseDoc = document.getElementById('close-doc-btn');
const infoPanelTitle = document.getElementById('info-title');
const infoLinkContainer = document.getElementById('info-link-container');
const btnEditActive = document.getElementById('btn-edit-active');

const adminControls = document.getElementById('admin-sidebar-controls');
const btnMobileReturn = document.getElementById('btn-mobile-return');

// Mobile Homepage Bridge
const btnOpenDirectory = document.getElementById('btn-open-directory');



// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  // (Editor moved to standalone Publisher Suite page)

  // Setup Auth callbacks
  setAuthChangeCallback(onAuthChanged);
  await initAuth();

  // Mobile Homepage Bridge Logic
  if (btnOpenDirectory && reader && sidebar) {
    btnOpenDirectory.addEventListener('click', () => {
      // Only swap panes on mobile (desktop is always split-view)
      if (window.innerWidth < 768) {
        reader.classList.remove('flex');
        reader.classList.add('hidden');
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');

        // Push state so back button returns to the Forge active homepage
        history.pushState({ page: 'directory' }, '', window.location.pathname);
      }
    });
  }

  // Handle Initial Deep Link (SPA)
  const urlParams = new URLSearchParams(window.location.search);
  let requestedId = urlParams.get('id');

  // Fallback to path extraction for /post/UUID/ routing if landed via direct link
  if (!requestedId) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'post' && pathParts.length > 1) {
      requestedId = pathParts[1];
    }
  }

  await Promise.all([fetchArticles()]);
  renderSidebar();
  activateSeriesDeepLink();
  setupEventListeners();

  if (requestedId) {
    window.openArticle(requestedId, true);
  }
}

function onAuthChanged() {
  // When login/logout happens, re-render the sidebar to show/hide restricted stuff
  renderSidebar();

  // If we are looking at an article, toggle the edit button availability
  if (activeArticleId) {
    if (currentRole === 'SOVEREIGN') {
      btnEditActive.classList.remove('hidden');
    } else {
      btnEditActive.classList.add('hidden');
      // Full-page editor handles its own auth kick-outs
    }
  }

  // Toggle admin sidebar tools
  const linkMatrixAdmin = document.getElementById('link-matrix-admin');
  if (currentRole === 'SOVEREIGN') {
    if (adminControls) adminControls.classList.remove('hidden');
    if (linkMatrixAdmin) linkMatrixAdmin.classList.remove('hidden');
  } else {
    if (adminControls) adminControls.classList.add('hidden');
    if (linkMatrixAdmin) linkMatrixAdmin.classList.add('hidden');
  }
}



const SIDEBAR_CACHE_KEY = 'vw_sidebar_v1';
const SIDEBAR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchArticles() {
  // \u2500\u2500 CACHE HIT: serve instantly, skip Supabase entirely ──────────────────
  try {
    const cached = localStorage.getItem(SIDEBAR_CACHE_KEY);
    if (cached) {
      const { ts, series, articles } = JSON.parse(cached);
      if (Date.now() - ts < SIDEBAR_CACHE_TTL) {
        globalSeries = series;
        globalArticles = articles;
        return;
      }
    }
  } catch (_) { /* corrupted cache \u2014 fall through to fetch */ }

  // \u2500\u2500 CACHE MISS / STALE: parallel fetch from Supabase ────────────────────
  try {
    const [
      { data: sData, error: sErr },
      { data: aData, error: aErr }
    ] = await Promise.all([
      supabase.from('series').select('*').order('order_index', { ascending: true }),
      supabase.from('articles').select('*').order('order_index', { ascending: true }),
    ]);

    if (sErr) throw sErr;
    if (aErr) throw aErr;
    globalSeries = sData || [];
    globalArticles = aData || [];

    // Update cache
    try {
      localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        series: globalSeries,
        articles: globalArticles,
      }));
    } catch (_) { /* storage full \u2014 ignore */ }
  } catch (e) {
    console.error('Failed to load payload:', e);
  }
}

// ==========================================
// RENDER UI
// ==========================================
function renderSidebar() {
  let html = '';
  const query = currentSearchQuery.toLowerCase();

  // Helper function to build folder HTML
  const buildFolder = (title, tracks, sKey, categoryLabel = null, seriesId = null, splashArticleId = null) => {
    // NEW PAYWALL LOGIC: All tracks are visible in the sidebar to everyone. The lock will act as the hook.
    const accessibleTracks = tracks;

    const filteredTracks = query
      ? accessibleTracks.filter(t => t.title.toLowerCase().includes(query))
      : accessibleTracks;

    if (filteredTracks.length === 0) return ''; // Hide empty folders

    const catHtml = ''; // Monk: Category label already rendered recursively in the section header, removing redundant in-folder label

    let fHtml = `
            <div id="album-${sKey}" class="mb-4">
                <div onclick="window.openFolderSplash('${seriesId}','${sKey}')" class="pl-3 border-l-2 border-[#a78bfa]/50 cursor-pointer group flex justify-between items-center hover:bg-[#a78bfa]/10 py-4 transition-all bg-[#05010a]/50">
                    <div>
                        ${catHtml}
                        <h2 class="text-base font-bold text-white tracking-widest uppercase">${title}</h2>
                        <p class="text-[10px] text-[#a78bfa]/90 tracking-widest uppercase mt-1">${filteredTracks.length} Documents Located</p>
                    </div>
                    <div class="flex items-center gap-2 mr-3 shrink-0">
                        <button onclick="event.stopPropagation();window.copySeriesLink(this, '${title}')" class="group/share relative text-[10px] text-[#a78bfa]/30 hover:text-[#a78bfa] transition-colors p-1 tracking-widest shrink-0 flex items-center justify-center">
                            <span class="chain-icon">&#x1F517;</span>
                            <span class="absolute right-full mr-2 whitespace-nowrap bg-[#05010a] text-[#a78bfa] px-2 py-1 text-[8px] font-bold border border-[#a78bfa]/50 opacity-0 group-hover/share:opacity-100 transition-opacity pointer-events-none uppercase tracking-[0.2em] shadow-[0_0_10px_rgba(167,139,250,0.2)]">SHARE SERIES</span>
                        </button>
                        <div class="text-xs font-bold text-white/30 group-hover:text-[#a78bfa] transition-colors whitespace-nowrap shrink-0" id="folder-icon-${sKey}">[ + ]</div>
                    </div>
                </div>
                <div id="folder-content-${sKey}" class="flex flex-col hidden bg-[#05010a]/20 border-l border-[#a78bfa]/10 ml-[11px] mt-1 pl-2">
    `;

    filteredTracks.forEach((t, idx) => {
      // Monk: Display sequential index based on drag/drop sorting, padded to 2 digits
      const displayIdx = String(idx + 1).padStart(2, '0');
      const dateStr = t.post_date ? new Date(t.post_date).toLocaleDateString() : 'UNKNOWN_DATE';
      // Monk: hasDesc flag only — actual description looked up lazily from window._articleDescMap
      const hasDesc = !!getArticleDescription(t.title);

      fHtml += `
                <div class="relative group/row flex items-stretch border border-transparent border-b-white/5 hover:border-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors"
                     data-article-id="${t.id}">
                    <button onclick="window.openArticle('${t.id}')" class="flex-1 text-left py-4 px-3 pl-4 flex flex-col gap-1">
                        <span class="text-[9px] text-[#a78bfa]/50 tracking-[0.2em] group-hover/row:text-[#a78bfa] flex justify-between">
                            <span>SYS_RECORD // ${displayIdx}</span>
                            <span>[${dateStr}]</span>
                        </span>
                        <span class="text-xs text-white/80 group-hover/row:text-white font-bold leading-snug tracking-wider">
                            ${t.hidden ? '<span class="text-[#f59e0b] mr-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]">[🔒]</span>' : ''}${t.title}
                        </span>
                    </button>${hasDesc ? `
                    <button onclick="event.stopPropagation();window.showArticleInfo('${t.id}')" class="shrink-0 px-2 text-[10px] text-[#a78bfa]/30 hover:text-[#a78bfa] transition-colors flex items-center lg:hidden" title="About this article">ⓘ</button>` : ''}
                </div>
      `;
    });

    fHtml += `</div></div>`;
    return fHtml;
  };

  // 1. Render Official Master Series in Exact DB Order
  let currentCategory = undefined;
  const isElevated = ['OPERATOR', 'SOVEREIGN'].includes(currentRole);
  const visibleSeries = isElevated ? globalSeries : globalSeries.filter(s => !s.hidden);

  visibleSeries.forEach((seriesDef, sIdx) => {
    const cat = seriesDef.category_label || 'UNCATEGORIZED';
    if (cat !== currentCategory) {
      html += `<div class="mt-4 mb-2 px-3 border-b-2 border-[#a78bfa]/50 pb-2">
                 <h3 class="text-sm md:text-base text-[#a78bfa] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">${cat}</h3>
               </div>`;
      currentCategory = cat;
    }

    // Skip building a physical block if this is strictly a structural heading "ghost" folder
    if (seriesDef.title === '[HEADING ONLY]') return;

    // Render pinned standalone article directly in the sidebar
    if (seriesDef.title === '[PINNED ARTICLE]') {
      const pinned = globalArticles.find(a => a.id === seriesDef.pinned_article_id);
      if (!pinned) return;
      html += `
        <div class="mb-1 pl-3 border-l-2 border-[#a78bfa]/30 hover:border-[#a78bfa] transition-all bg-[#05010a]/50 hover:bg-[#a78bfa]/10 cursor-pointer"
             onclick="window.openArticle('${pinned.id}')">
          <div class="py-3 flex items-center gap-2">
            <span class="text-[10px] text-[#a78bfa]/50">📄</span>
            <span class="text-xs font-bold text-white/80 hover:text-white tracking-wide truncate italic">
              ${pinned.hidden ? '<span class="text-[#f59e0b] mr-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]">[🔒]</span>' : ''}${pinned.title}
            </span>
          </div>
        </div>`;
      return;
    }

    // Find articles assigned to this exact series ID and sort them by order_index
    const tracks = globalArticles
      .filter(a => a.series_id === seriesDef.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    html += buildFolder(seriesDef.title, tracks, 'series_' + seriesDef.id, seriesDef.category_label, seriesDef.id, seriesDef.splash_article_id);
  });

  // 2. Render Unassigned Singles at the bottom, also sorted
  const singles = globalArticles
    .filter(a => !a.series_id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  html += buildFolder("Unassigned Singles", singles, 'unassigned_singles', null, null, null);

  listContainer.innerHTML = html;

  // Build description lookup map keyed by article ID — avoids embedding long strings in DOM
  window._articleDescMap = {};
  globalArticles.forEach(a => {
    const d = getArticleDescription(a.title);
    if (d) window._articleDescMap[a.id] = d;
  });
}

window.toggleFolder = function (sKey) {
  const el = document.getElementById(`folder-content-${sKey}`);
  const icon = document.getElementById(`folder-icon-${sKey}`);
  if (el) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      el.classList.add('flex');
      if (icon) icon.innerText = '[ - ]';
      // Mobile: scroll to the folder so the article list is in view
      if (window.innerWidth <= 768) {
        const album = document.getElementById(`album-${sKey}`);
        if (album) setTimeout(() => album.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    } else {
      el.classList.add('hidden');
      el.classList.remove('flex');
      if (icon) icon.innerText = '[ + ]';
    }
  }
};

// ==========================================
// FOLDER SPLASH — opens splash article on click
// ==========================================
window.openFolderSplash = function (seriesId, sKey) {
  // Always toggle the folder open/closed
  window.toggleFolder(sKey);

  // Look up the series to get its splash_article_id
  const series = globalSeries.find(s => s.id === seriesId);
  if (!series || !series.splash_article_id) return;

  const splashId = series.splash_article_id;
  const splashArticle = globalArticles.find(a => a.id === splashId);
  if (!splashArticle) return;

  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // Mobile: show folder info popup with series name + article teaser
    const popup = document.getElementById('article-info-popup');
    const text = document.getElementById('article-info-text');
    if (popup && text) {
      text.textContent = `${series.title.toUpperCase()}\n\n${splashArticle.title}`;
      popup.classList.remove('hidden');
    }
  } else {
    // Desktop: load the splash article in the reader panel
    window.openArticle(splashId);
  }
};


// ==========================================
// FOLDER REVEAL + GLOW (shared deep-link helper)
// ==========================================
function revealFolder(sKey) {
  const contentEl = document.getElementById(`folder-content-${sKey}`);
  const albumEl = document.getElementById(`album-${sKey}`);
  if (!contentEl || !albumEl) return;

  // Open if closed
  if (contentEl.classList.contains('hidden')) {
    window.toggleFolder(sKey);
  }

  // Scroll into view
  setTimeout(() => albumEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  // NEON GLOW — folder header gets a strong multi-color glow sequence
  const headerEl = albumEl.querySelector('div');
  if (headerEl) {
    const glowSteps = [
      [0, '0 0 0px transparent'],
      [80, '0 0 12px #00ff41, 0 0 28px rgba(0,255,65,0.5)'],
      [250, '0 0 20px #00ff41, 0 0 45px rgba(0,255,65,0.7), 0 0 8px #a78bfa'],
      [450, '0 0 25px #00ffcc, 0 0 55px rgba(0,255,200,0.6), 0 0 12px #00ff41'],
      [750, '0 0 14px #a78bfa, 0 0 30px rgba(167,139,250,0.5)'],
      [1150, '0 0 0px transparent'],
    ];
    headerEl.style.transition = 'box-shadow 0.12s ease';
    glowSteps.forEach(([delay, shadow]) =>
      setTimeout(() => { headerEl.style.boxShadow = shadow; }, delay)
    );
    setTimeout(() => { headerEl.style.transition = ''; headerEl.style.boxShadow = ''; }, 1300);
  }

  // CASCADE GLOW — each article button inside the folder gets a staggered neon flash
  const articleBtns = contentEl.querySelectorAll('button');
  articleBtns.forEach((btn, idx) => {
    const delay = 150 + idx * 55; // stagger each article
    setTimeout(() => {
      btn.style.transition = 'box-shadow 0.1s ease, background 0.1s ease';
      btn.style.boxShadow = '0 0 14px #00ff41, 0 0 30px rgba(0,255,65,0.4)';
      btn.style.background = 'rgba(0,255,65,0.07)';
      setTimeout(() => {
        btn.style.boxShadow = '0 0 6px rgba(167,139,250,0.3)';
        btn.style.background = '';
        setTimeout(() => {
          btn.style.transition = '';
          btn.style.boxShadow = '';
        }, 400);
      }, 350);
    }, delay);
  });
}

// Series deep link helpers
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

window.triggerMagicSync = async function(event) {
  const emailInput = document.getElementById('sync-email-input');
  if (!emailInput) return;
  const email = emailInput.value.trim();
  if (!email) return;

  const btn = event ? event.currentTarget : document.activeElement;
  const originalText = btn.innerText;
  btn.innerText = 'TRANSMITTING...';
  btn.disabled = true;

  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href }});
  if (error) {
     alert("Sync Failed: " + error.message);
     btn.innerText = originalText;
     btn.disabled = false;
  } else {
     btn.innerText = 'SYNC INITIATED - CHECK EMAIL';
     btn.classList.add('bg-[#a78bfa]', 'text-black');
     btn.classList.remove('bg-[#a78bfa]/10', 'text-[#a78bfa]');
  }
};

window.copySeriesLink = function (btn, seriesTitle) {
  const slug = slugify(seriesTitle);
  const url = `${location.origin}/series/${slug}/`;
  navigator.clipboard.writeText(url).then(() => {
    const icon = btn.querySelector('.chain-icon');
    if (icon) {
      const orig = icon.innerHTML;
      icon.innerHTML = '✓';
      btn.classList.add('text-[#00ff41]');
      btn.style.textShadow = '0 0 8px rgba(0,255,65,0.7)';
      setTimeout(() => {
        icon.innerHTML = orig;
        btn.classList.remove('text-[#00ff41]');
        btn.style.textShadow = '';
      }, 1500);
    }
  });
};

function activateSeriesDeepLink() {
  let param = new URLSearchParams(location.search).get('series');
  
  if (!param) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'series' && pathParts.length > 1) {
          param = pathParts[1];
      }
  }
  
  if (!param) return;

  const isElevated = ['OPERATOR', 'SOVEREIGN'].includes(currentRole);
  const visibleSeries = isElevated ? globalSeries : globalSeries.filter(s => !s.hidden);

  visibleSeries.forEach((s) => {
    if (slugify(s.title) === param) {
      revealFolder('series_' + s.id);
      // Mobile: switch to sidebar pane so user sees the open folder
      if (window.innerWidth <= 768 && sidebar && reader) {
        reader.classList.add('hidden');
        reader.classList.remove('flex');
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
      }
    }
  });
}

window.openArticle = async function (id, skipState = false) {
  const isReplacing = activeArticleId !== null;
  activeArticleId = id;
  const article = globalArticles.find(a => a.id === id);
  if (!article) return;

  let shareUrl = `/codex/?id=${id}`;
  if (article.series_id) {
    const series = globalSeries.find(s => s.id === article.series_id);
    if (series) {
      // Must be defined globally or we rely on the helper further down in main.js
      const slug = series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      shareUrl = `/codex/?series=${slug}&id=${id}`;
    }
  }

  // SPA Routing: Update URL without reloading (prevent infinite history stacking)
  if (!skipState) {
    if (isReplacing) {
      history.replaceState({ articleId: id }, '', shareUrl);
    } else {
      history.pushState({ articleId: id }, '', shareUrl);
    }
  }

  // UI Updates
  placeholderMsg.classList.add('hidden');
  // Clean render
  htmlFrame.classList.remove('hidden');
  btnCloseDoc.classList.remove('hidden');

  // Populate Reader
  articleTitleDisplay.innerText = article.title;
  if (article.subtitle) {
    articleSubtitleDisplay.innerText = article.subtitle;
    articleSubtitleDisplay.classList.remove('hidden');
  } else {
    articleSubtitleDisplay.classList.add('hidden');
  }

  // --- LAZY LOAD CORE PAYLOAD ---
  articleContent.innerHTML = '<div class="text-[#a78bfa] text-xs font-bold tracking-[0.2em] animate-pulse py-12 text-center">[ ESTABLISHING SECURE CONNECTION... DECRYPTING PAYLOAD ]</div>';
  
  const { data: fullArticle, error } = await supabase
    .from('articles')
    .select('content_html, video_url')
    .eq('id', id)
    .single();

  let final_content_html = (!error && fullArticle) ? fullArticle.content_html : "<p class='text-red-500'>[ ERROR: PAYLOAD DECRYPTION FAILED ]</p>";
  const video_url = (!error && fullArticle) ? fullArticle.video_url : null;

  // ------------------------------------------
  // PAYWALL BLAST DOOR LOGIC (V4 MIGRATION)
  // ------------------------------------------
  const isElevated = ['OPERATOR', 'SOVEREIGN'].includes(currentRole);
  let showBlastDoor = false;

  if (article.hidden && !isElevated) {
      showBlastDoor = true;
      // Truncate Payload (roughly 3 blocks)
      if (final_content_html) {
          const parts = final_content_html.split('</p>');
          if (parts.length > 3) {
              final_content_html = parts.slice(0, 3).join('</p>') + '</p>';
          }
      }

      final_content_html += `
        <div class="mt-16 w-full border border-red-500/50 bg-[#05010a] p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden group">
          <div class="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out"></div>
          <div class="relative z-10 flex flex-col items-center">
            <h3 class="text-xl md:text-2xl font-black text-red-500 uppercase tracking-[0.4em] mb-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">RESTRICTED PAYLOAD</h3>
            <p class="text-xs text-white/70 mb-8 font-mono tracking-widest leading-relaxed max-w-lg">
              The remainder of this transmission is locked inside the Sovereign Hub. You must hold active clearance to decrypt this payload.
            </p>
            <div class="w-full max-w-sm flex flex-col gap-6">
              
              <!-- SECONDARY CTA: SYNC EXISTING (Substack Trap) -->
              <div class="border border-[#a78bfa]/30 p-5 bg-black/60 relative">
                <p class="text-[9px] text-[#a78bfa] mb-3 tracking-[0.2em] font-bold uppercase drop-shadow-[0_0_5px_rgba(167,139,250,0.5)]">Already paying on Substack?</p>
                <p class="text-[8px] text-[#a78bfa]/60 mb-4 tracking-widest leading-relaxed">Enter your email below. Our system will automatically verify your active subscription and sync your clearance instantly.</p>
                <div class="flex flex-col gap-3">
                  <input type="email" id="sync-email-input" placeholder="Substack Email" autocomplete="email" class="w-full bg-[#050505] border border-[#a78bfa]/40 text-[#a78bfa] p-2 focus:outline-none focus:border-[#a78bfa] text-xs font-mono placeholder-[#a78bfa]/30 text-center tracking-wider mb-1">
                  <button onclick="window.triggerMagicSync(event)" class="w-full text-[#a78bfa] hover:text-black font-bold border border-[#a78bfa] bg-[#a78bfa]/10 hover:bg-[#a78bfa] px-4 py-2 uppercase tracking-[0.2em] transition-all text-[10px] shadow-[0_0_10px_rgba(167,139,250,0.2)] hover:shadow-none">
                    [ SYNC PAID ACCESS ]
                  </button>
                </div>
              </div>

              <!-- PRIMARY CTA: NATIVE V4 CHECKOUT -->
              <div>
                <a href="/inner-circle" class="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black font-bold border border-red-500 px-4 py-4 uppercase tracking-[0.2em] transition-all text-xs text-center block shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                  [ UPGRADE NATIVELY ]
                </a>
                <p class="text-[8px] text-red-500/50 mt-3 tracking-widest uppercase">New here? Join the Inner Circle directly on native billing.</p>
              </div>

            </div>
          </div>
        </div>
      `;
  }

  // Handle Video Embed
  const videoContainer = document.getElementById('video-embed-container');
  const videoIframe = document.getElementById('video-iframe');
  if (videoContainer && videoIframe) {
      if (showBlastDoor) {
          // Hide video completely if locked payload
          videoContainer.classList.add('hidden');
          videoIframe.src = '';
      } else {
          const embedSrc = resolveEmbedUrl(video_url);
          if (embedSrc) {
              videoIframe.src = embedSrc;
              videoContainer.classList.remove('hidden');
          } else {
              videoContainer.classList.add('hidden');
              videoIframe.src = '';
          }
      }
  }

  articleContent.innerHTML = final_content_html || "<i>[EMPTY PAYLOAD]</i>";

  // Reader actions + comments
  const readerActions = document.getElementById('reader-actions');
  const readerComments = document.getElementById('reader-comments');
  const readerDirectLink = document.getElementById('reader-direct-link');
  const readerCommentsLink = document.getElementById('reader-comments-link');
  if (readerActions) readerActions.classList.remove('hidden');
  if (readerComments) readerComments.classList.remove('hidden');
  if (readerDirectLink) readerDirectLink.href = shareUrl;
  if (readerCommentsLink) readerCommentsLink.href = shareUrl + '#comment-section';

  // VISUAL ACTIVE STATE (Monk Fix)
  document.querySelectorAll('#doc-list button').forEach(btn => {
    btn.classList.remove('bg-[#a78bfa]/10', 'border-[#a78bfa]');
    btn.classList.add('border-transparent');
  });

  const activeBtn = document.querySelector(`button[onclick="window.openArticle('${id}')"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent');
    activeBtn.classList.add('bg-[#a78bfa]/10', 'border-[#a78bfa]');
  }

  // REVEAL PARENT FOLDER — open + glow the folder this article belongs to
  // (Handles ?id= deep links  // REVEAL PARENT FOLDER
  if (article.series_id) {
    const sKey = 'series_' + article.series_id;
    const contentEl = document.getElementById(`folder-content-${sKey}`);
    // Only reveal if folder is currently closed (don't collapse an open folder)
    if (contentEl && contentEl.classList.contains('hidden')) {
      window.toggleFolder(sKey);
    }
  }

  // Update Sidebar Info Panel
  infoPanelTitle.innerText = article.title;

  // Set the Direct Link to the public V4 routing format
  const directLinkBtn = document.getElementById('info-link');
  if (directLinkBtn) {
    directLinkBtn.href = shareUrl;
  }

  const mobileLinkBtn = document.getElementById('mobile-info-link');
  if (mobileLinkBtn) {
    mobileLinkBtn.href = shareUrl;
    mobileLinkBtn.classList.remove('hidden');
  }

  infoLinkContainer.classList.remove('hidden');
  if (currentRole === 'SOVEREIGN') {
    btnEditActive.classList.remove('hidden');
  }

  // Mobile specific: switch view
  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
    reader.classList.remove('hidden');
    reader.classList.add('flex');
  }

  // RESET SCROLL TO TOP
  setTimeout(() => { htmlFrame.scrollTop = 0; }, 10);

  // Load bookmark state + comments async (don't block render)
  loadReaderBookmarkState(id);
  loadReaderComments(id);
};

window.closeArticle = function (skipState = false) {
  activeArticleId = null;

  if (!skipState) {
    history.pushState({ page: 'directory' }, '', '/codex/');
  }

  placeholderMsg.classList.remove('hidden');
  htmlFrame.classList.add('hidden');
  btnCloseDoc.classList.add('hidden');

  const videoContainer = document.getElementById('video-embed-container');
  const videoIframe = document.getElementById('video-iframe');
  if (videoContainer) videoContainer.classList.add('hidden');
  if (videoIframe) videoIframe.src = '';

  // Hide reader sections
  const readerActions = document.getElementById('reader-actions');
  const readerComments = document.getElementById('reader-comments');
  if (readerActions) readerActions.classList.add('hidden');
  if (readerComments) readerComments.classList.add('hidden');

  infoPanelTitle.innerText = "AWAITING SELECTION...";
  infoLinkContainer.classList.add('hidden');
  btnEditActive.classList.add('hidden');

  const mobileLinkBtn = document.getElementById('mobile-info-link');
  if (mobileLinkBtn) {
    mobileLinkBtn.classList.add('hidden');
  }

  if (window.innerWidth <= 768) {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex');
    reader.classList.add('hidden');
    reader.classList.remove('flex');
  }
};

// ==========================================
// EDITOR INITIATION (THE FORGE)
// ==========================================
function openEditor() {
  if (!activeArticleId || currentRole !== 'SOVEREIGN') return;
  window.location.href = '/admin/editor.html?id=' + activeArticleId;
}

function createNewArticle() {
  if (currentRole !== 'SOVEREIGN') return;
  window.location.href = '/admin/editor.html';
}

// ── URL resolver (same as post.js) ─────────────────────────────────────────
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
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.replace('/', '');
            if (id) return `https://player.vimeo.com/video/${id}`;
        }
    } catch (_) { /* ignore */ }
    return null;
}

// ==========================================
// BINDINGS
// ==========================================
function setupEventListeners() {
  const searchInput = document.getElementById('article-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderSidebar();

      // If holding a search query, force everything visible
      if (currentSearchQuery) {
        document.querySelectorAll('[id^="folder-content-"]').forEach(el => {
          el.classList.remove('hidden');
          el.classList.add('flex');
        });
      }
    });
  }

  // Mobile Return & X Button
  btnCloseDoc.addEventListener('click', () => { window.closeArticle(); });
  btnMobileReturn.addEventListener('click', () => { window.closeArticle(); });

  // Hide return buttons if user landed directly (not from verticalwar.com)
  const fromSite = document.referrer && document.referrer.includes('verticalwar.com');
  if (!fromSite) {
    if (btnCloseDoc) btnCloseDoc.classList.add('hidden');
    if (btnMobileReturn) btnMobileReturn.classList.add('hidden');
  }

  // Removed old carousel controls

  btnEditActive.addEventListener('click', openEditor);
  document.getElementById('btn-new-article').addEventListener('click', createNewArticle);
  document.getElementById('btn-curation-mode').addEventListener('click', () => {
    window.location.href = '/admin/index.html';
  });

  // Handle Browser Back/Forward buttons (SPA)
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.articleId) {
      // User backed into an article
      window.openArticle(e.state.articleId, true);
    } else if (e.state && e.state.page === 'directory') {
      // User backed into the directory
      window.closeArticle(true);
    } else {
      // User backed into the initial splash page state (null state)
      activeArticleId = null;
      if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
        reader.classList.remove('hidden');
        reader.classList.add('flex');
      }
      placeholderMsg.classList.remove('hidden');
      htmlFrame.classList.add('hidden');
      btnCloseDoc.classList.add('hidden');
      infoPanelTitle.innerText = "AWAITING SELECTION...";
      infoLinkContainer.classList.add('hidden');
      btnEditActive.classList.add('hidden');
      const mobileLinkBtn = document.getElementById('mobile-info-link');
      if (mobileLinkBtn) mobileLinkBtn.classList.add('hidden');
    }
  });
}

// ==========================================
// READER: BOOKMARK + COMMENTS
// ==========================================

async function loadReaderBookmarkState(articleId) {
  const btn = document.getElementById('reader-bookmark-btn');
  const icon = document.getElementById('reader-bookmark-icon');
  if (!btn) return;

  if (!currentUser) {
    btn.classList.add('hidden');
    return;
  }
  btn.classList.remove('hidden');
  btn.dataset.articleId = articleId;

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('article_id', articleId)
    .maybeSingle();

  if (data) {
    icon.textContent = '★';
    btn.classList.add('text-[#a78bfa]', 'border-[#a78bfa]/70');
    btn.classList.remove('text-[#a78bfa]/60');
  } else {
    icon.textContent = '☆';
    btn.classList.remove('text-[#a78bfa]', 'border-[#a78bfa]/70');
    btn.classList.add('text-[#a78bfa]/60');
  }
}

window.toggleReaderBookmark = async function () {
  if (!currentUser || !activeArticleId) return;
  const icon = document.getElementById('reader-bookmark-icon');
  const btn = document.getElementById('reader-bookmark-btn');
  const alreadySaved = icon && icon.textContent === '★';

  if (alreadySaved) {
    await supabase.from('bookmarks').delete()
      .eq('user_id', currentUser.id).eq('article_id', activeArticleId);
  } else {
    await supabase.from('bookmarks').upsert(
      { user_id: currentUser.id, article_id: activeArticleId },
      { onConflict: 'user_id,article_id' }
    );
  }
  loadReaderBookmarkState(activeArticleId);
};

async function loadReaderComments(articleId) {
  const list = document.getElementById('reader-comments-list');
  const inputEl = document.getElementById('reader-comment-input');
  const loginPrompt = document.getElementById('reader-comment-login-prompt');
  if (!list) return;

  list.innerHTML = '<p class="text-[9px] text-[#a78bfa]/30 animate-pulse tracking-widest">LOADING...</p>';

  const { data: comments } = await supabase
    .from('comments')
    .select('content, created_at, profiles(display_name, username)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(2);

  if (!comments || comments.length === 0) {
    list.innerHTML = '<p class="text-[9px] text-[#a78bfa]/20 tracking-widest italic">No signals yet.</p>';
  } else {
    list.innerHTML = comments.map(c => {
      const name = c.profiles?.display_name || c.profiles?.username || 'CITIZEN';
      const date = new Date(c.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
      return `<div class="border-l-2 border-[#a78bfa]/20 pl-3 py-1">
        <p class="text-[9px] text-[#a78bfa]/50 tracking-widest mb-1">${name.toUpperCase()} · ${date}</p>
        <p class="text-xs text-white/70 leading-relaxed">${c.content}</p>
      </div>`;
    }).join('');
  }

  if (inputEl && loginPrompt) {
    if (currentUser) {
      inputEl.classList.remove('hidden');
      loginPrompt.classList.add('hidden');
    } else {
      inputEl.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
    }
  }
  // Store for submit
  if (inputEl) inputEl.dataset.articleId = articleId;
}

window.submitReaderComment = async function () {
  if (!currentUser || !activeArticleId) return;
  const textarea = document.getElementById('reader-comment-text');
  const submit = document.getElementById('reader-comment-submit');
  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) return;

  submit.textContent = '[ SENDING... ]';
  submit.disabled = true;
  const { error } = await supabase.from('comments').insert({ user_id: currentUser.id, article_id: activeArticleId, content });
  if (!error) {
    textarea.value = '';
    loadReaderComments(activeArticleId);
  }
  submit.textContent = '[ POST ]';
  submit.disabled = false;
};

window.onload = init;

// Mobile sigil tap flash (< 1024px only)
const sigilEl = document.querySelector('.sigil-bg');
if (sigilEl) {
  let sigilTimer = null;
  document.addEventListener('touchstart', () => {
    if (window.innerWidth >= 1024) return;
    sigilEl.classList.add('sigil-tap');
    clearTimeout(sigilTimer);
    sigilTimer = setTimeout(() => sigilEl.classList.remove('sigil-tap'), 600);
  }, { passive: true });
}

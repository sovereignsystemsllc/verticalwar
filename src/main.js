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

// Carousel state
let splashSlides = [];
let carouselIndex = 0;
let carouselTimer = null;

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

// Carousel DOM
const carouselTrack = document.getElementById('carousel-track');
const carouselDots = document.getElementById('carousel-dots');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const btnEditCarousel = document.getElementById('btn-edit-carousel');

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
  const requestedId = urlParams.get('id');

  await Promise.all([fetchArticles(), fetchSplashSlides()]);
  renderSidebar();
  activateSeriesDeepLink();
  renderCarousel();
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
    if (btnEditCarousel) btnEditCarousel.classList.remove('hidden');
  } else {
    if (adminControls) adminControls.classList.add('hidden');
    if (linkMatrixAdmin) linkMatrixAdmin.classList.add('hidden');
    if (btnEditCarousel) btnEditCarousel.classList.add('hidden');
  }
}

// ==========================================
// SPLASH CAROUSEL
// ==========================================
async function fetchSplashSlides() {
  try {
    const { data, error } = await supabase
      .from('splash_slides')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    splashSlides = data || [];
  } catch (e) {
    console.warn('Failed to load splash slides:', e);
    splashSlides = [];
  }
}

function renderCarousel() {
  if (!carouselTrack) return;

  if (splashSlides.length === 0) {
    carouselTrack.innerHTML = `<div class="min-w-full p-8 flex flex-col items-center justify-center min-h-[320px]"><p class="text-[#a78bfa]/30 text-xs uppercase tracking-widest">NO TRANSMISSIONS FOUND</p></div>`;
    if (carouselDots) carouselDots.innerHTML = '';
    return;
  }

  // Build slides
  carouselTrack.innerHTML = splashSlides.map((slide) => {
    const imgHtml = slide.image_url
      ? `<img src="${slide.image_url}" alt="${slide.title}" class="w-full max-h-48 object-cover mb-6 border border-[#a78bfa]/10">`
      : '';
    const bodyHtml = slide.body
      ? slide.body.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')
      : '';
    const linkHtml = slide.link_url
      ? `<a href="${slide.link_url}" target="_blank" rel="noopener noreferrer"
           class="inline-block mt-6 text-[10px] text-[#a78bfa]/70 hover:text-[#a78bfa] transition-colors tracking-widest uppercase border border-[#a78bfa]/30 hover:border-[#a78bfa] px-5 py-2">
           ${slide.link_label || '[ OPEN LINK ]'}
         </a>`
      : '';
    return `
      <div class="min-w-full p-6 md:p-8 flex flex-col items-center justify-center min-h-[320px]">
        ${imgHtml}
        <h2 class="text-lg md:text-2xl text-white font-bold tracking-[0.2em] uppercase mb-4 text-center">${slide.title}</h2>
        <div class="text-[10px] md:text-xs text-white/70 leading-relaxed font-mono text-center space-y-3 max-w-lg">${bodyHtml}</div>
        ${linkHtml}
      </div>`;
  }).join('');

  // Build dots
  if (carouselDots) {
    carouselDots.innerHTML = splashSlides.map((_, i) =>
      `<button class="carousel-dot w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-[#a78bfa] scale-125' : 'bg-[#a78bfa]/30 hover:bg-[#a78bfa]/60'
      }" data-index="${i}" title="Slide ${i + 1}"></button>`
    ).join('');

    carouselDots.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
    });
  }

  goToSlide(0);
  startAutoplay();
}

function goToSlide(idx) {
  carouselIndex = idx;
  if (carouselTrack) {
    carouselTrack.style.transform = `translateX(-${idx * 100}%)`;
  }
  // Update dots
  if (carouselDots) {
    carouselDots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      if (i === idx) {
        dot.classList.add('bg-[#a78bfa]', 'scale-125');
        dot.classList.remove('bg-[#a78bfa]/30');
      } else {
        dot.classList.remove('bg-[#a78bfa]', 'scale-125');
        dot.classList.add('bg-[#a78bfa]/30');
      }
    });
  }
}

function startAutoplay() {
  if (carouselTimer) clearInterval(carouselTimer);
  if (splashSlides.length <= 1) return;
  carouselTimer = setInterval(() => {
    goToSlide((carouselIndex + 1) % splashSlides.length);
  }, 5000);

  // Pause on hover
  const wrapper = carouselTrack?.parentElement;
  if (wrapper) {
    wrapper.addEventListener('mouseenter', () => clearInterval(carouselTimer));
    wrapper.addEventListener('mouseleave', startAutoplay);
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
    // SECURITY GATE: Only OPERATOR or SOVEREIGN can see Inside the Forge
    if (title === 'Inside the Forge' && !['OPERATOR', 'SOVEREIGN'].includes(currentRole)) {
      return '';
    }

    // SECURITY GATE: Hidden articles are restricted to OPERATOR/SOVEREIGN, same as Inside the Forge
    const accessibleTracks = ['OPERATOR', 'SOVEREIGN'].includes(currentRole)
      ? tracks
      : tracks.filter(t => !t.hidden);

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
                        <button onclick="event.stopPropagation();window.copySeriesLink('${title}')" title="Copy link to this series" class="text-[9px] text-[#a78bfa]/30 hover:text-[#a78bfa] transition-colors px-1 tracking-widest shrink-0">&#x1F517;</button>
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
                        <span class="text-xs text-white/80 group-hover/row:text-white font-bold leading-snug tracking-wider">${t.title}</span>
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
      if (pinned.hidden && !isElevated) return; // respect visibility rules
      html += `
        <div class="mb-1 pl-3 border-l-2 border-[#a78bfa]/30 hover:border-[#a78bfa] transition-all bg-[#05010a]/50 hover:bg-[#a78bfa]/10 cursor-pointer"
             onclick="window.openArticle('${pinned.id}')">
          <div class="py-3 flex items-center gap-2">
            <span class="text-[10px] text-[#a78bfa]/50">📄</span>
            <span class="text-xs font-bold text-white/80 hover:text-white tracking-wide truncate italic">${pinned.title}</span>
          </div>
        </div>`;
      return;
    }

    // Find articles assigned to this exact series ID and sort them by order_index
    const tracks = globalArticles
      .filter(a => a.series_id === seriesDef.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    html += buildFolder(seriesDef.title, tracks, 'series_' + sIdx, seriesDef.category_label, seriesDef.id, seriesDef.splash_article_id);
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

window.copySeriesLink = function (seriesTitle) {
  const slug = slugify(seriesTitle);
  const url = `${location.origin}/?series=${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.createElement('div');
    toast.textContent = 'LINK COPIED';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#a78bfa;color:#000;font-family:monospace;font-size:10px;font-weight:bold;letter-spacing:.15em;padding:6px 16px;z-index:9999;pointer-events:none';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  });
};

function activateSeriesDeepLink() {
  const param = new URLSearchParams(location.search).get('series');
  if (!param) return;
  globalSeries.forEach((s, i) => {
    if (slugify(s.title) === param) {
      revealFolder('series_' + i);
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

window.openArticle = function (id, skipState = false) {
  activeArticleId = id;
  const article = globalArticles.find(a => a.id === id);
  if (!article) return;

  // SPA Routing: Update URL without reloading
  if (!skipState) {
    history.pushState({ articleId: id }, '', '?id=' + id);
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

  articleContent.innerHTML = article.content_html || "<i>[EMPTY PAYLOAD]</i>";

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
  // (Handles ?id= deep links so desktop users notice the sidebar opened)
  if (article.series_id) {
    const seriesIdx = globalSeries.findIndex(s => s.id === article.series_id);
    if (seriesIdx !== -1) {
      const sKey = 'series_' + seriesIdx;
      const contentEl = document.getElementById(`folder-content-${sKey}`);
      // Only reveal if folder is currently closed (don't collapse an open folder)
      if (contentEl && contentEl.classList.contains('hidden')) {
        revealFolder(sKey);
      }
    }
  }

  // Update Sidebar Info Panel
  infoPanelTitle.innerText = article.title;

  // Set the Direct Link to the public V4 routing format
  const directLinkBtn = document.getElementById('info-link');
  if (directLinkBtn) {
    directLinkBtn.href = `/post/?id=${article.id}`;
  }

  const mobileLinkBtn = document.getElementById('mobile-info-link');
  if (mobileLinkBtn) {
    mobileLinkBtn.href = `/post/?id=${article.id}`;
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
};

window.closeArticle = function (skipState = false) {
  activeArticleId = null;

  if (!skipState) {
    history.pushState({ page: 'directory' }, '', window.location.pathname);
  }

  placeholderMsg.classList.remove('hidden');
  htmlFrame.classList.add('hidden');
  // Closed
  btnCloseDoc.classList.add('hidden');

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

  // Mobile Return Button uses history.back() to pop the stack
  btnCloseDoc.addEventListener('click', () => { history.back(); });
  btnMobileReturn.addEventListener('click', () => { history.back(); });

  // Hide return buttons if user landed directly (not from verticalwar.com)
  const fromSite = document.referrer && document.referrer.includes('verticalwar.com');
  if (!fromSite) {
    if (btnCloseDoc) btnCloseDoc.classList.add('hidden');
    if (btnMobileReturn) btnMobileReturn.classList.add('hidden');
  }

  // Carousel arrow controls
  if (carouselPrev) {
    carouselPrev.addEventListener('click', () => {
      clearInterval(carouselTimer);
      goToSlide((carouselIndex - 1 + splashSlides.length) % splashSlides.length);
    });
  }
  if (carouselNext) {
    carouselNext.addEventListener('click', () => {
      clearInterval(carouselTimer);
      goToSlide((carouselIndex + 1) % splashSlides.length);
    });
  }

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

document.addEventListener('DOMContentLoaded', init);

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

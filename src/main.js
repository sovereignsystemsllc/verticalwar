import { supabase } from './supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from './auth.js';

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

async function fetchArticles() {
  try {
    // 1. Fetch Series mapped by user's explicit drag-and-drop order
    const { data: sData, error: sErr } = await supabase
      .from('series')
      .select('*')
      .order('order_index', { ascending: true });

    if (sErr) throw sErr;
    globalSeries = sData || [];

    // 2. Fetch Articles (ordered by their internal order_index)
    const { data: aData, error: aErr } = await supabase
      .from('articles')
      .select('*')
      .order('order_index', { ascending: true });

    if (aErr) throw aErr;
    globalArticles = aData || [];
  } catch (e) {
    console.error("Failed to load payload:", e);
  }
}

// ==========================================
// RENDER UI
// ==========================================
function renderSidebar() {
  let html = '';
  const query = currentSearchQuery.toLowerCase();

  // Helper function to build folder HTML
  const buildFolder = (title, tracks, sKey, categoryLabel = null) => {
    // SECURITY GATE: Only OPERATOR or SOVEREIGN can see Inside the Forge
    if (title === 'Inside the Forge' && !['OPERATOR', 'SOVEREIGN'].includes(currentRole)) {
      return '';
    }

    const filteredTracks = query
      ? tracks.filter(t => t.title.toLowerCase().includes(query))
      : tracks;

    if (filteredTracks.length === 0) return ''; // Hide empty folders

    const catHtml = ''; // Monk: Category label already rendered recursively in the section header, removing redundant in-folder label

    let fHtml = `
            <div id="album-${sKey}" class="mb-4">
                <div onclick="window.toggleFolder('${sKey}')" class="pl-3 border-l-2 border-[#a78bfa]/50 cursor-pointer group flex justify-between items-center hover:bg-[#a78bfa]/10 py-4 transition-all bg-[#05010a]/50">
                    <div>
                        ${catHtml}
                        <h2 class="text-base font-bold text-white tracking-widest uppercase">${title}</h2>
                        <p class="text-[10px] text-[#a78bfa]/90 tracking-widest uppercase mt-1">${filteredTracks.length} Documents Located</p>
                    </div>
                    <div class="flex items-center gap-2 mr-3">
                        <button onclick="event.stopPropagation();window.copySeriesLink('${title}')" title="Copy link to this series" class="text-[9px] text-[#a78bfa]/30 hover:text-[#a78bfa] transition-colors px-1 tracking-widest">&#x1F517;</button>
                        <div class="text-xs font-bold text-white/30 group-hover:text-[#a78bfa] transition-colors" id="folder-icon-${sKey}">[ + ]</div>
                    </div>
                </div>
                <div id="folder-content-${sKey}" class="flex flex-col hidden bg-[#05010a]/20 border-l border-[#a78bfa]/10 ml-[11px] mt-1 pl-2">
    `;

    filteredTracks.forEach((t, idx) => {
      // Monk: Display sequential index based on drag/drop sorting, padded to 2 digits for aesthetic consistency
      const displayIdx = String(idx + 1).padStart(2, '0');
      const dateStr = t.post_date ? new Date(t.post_date).toLocaleDateString() : 'UNKNOWN_DATE';

      fHtml += `
                <button onclick="window.openArticle('${t.id}')" class="w-full text-left py-4 px-3 hover:bg-[#a78bfa]/10 group transition-colors flex flex-col gap-1 border border-transparent border-b-white/5 hover:border-[#a78bfa] pl-4">
                    <span class="text-[9px] text-[#a78bfa]/50 tracking-[0.2em] group-hover:text-[#a78bfa] flex justify-between">
                        <span>SYS_RECORD // ${displayIdx}</span>
                        <span>[${dateStr}]</span>
                    </span>
                    <span class="text-xs text-white/80 group-hover:text-white font-bold leading-snug tracking-wider">${t.title}</span>
                </button>
      `;
    });

    fHtml += `</div></div>`;
    return fHtml;
  };

  // 1. Render Official Master Series in Exact DB Order
  let currentCategory = undefined;

  globalSeries.forEach((seriesDef, sIdx) => {
    const cat = seriesDef.category_label || 'UNCATEGORIZED';
    if (cat !== currentCategory) {
      html += `<div class="mt-10 mb-2 px-3 border-b-2 border-[#a78bfa]/50 pb-2">
                 <h3 class="text-sm md:text-base text-[#a78bfa] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">${cat}</h3>
               </div>`;
      currentCategory = cat;
    }

    // Skip building a physical block if this is strictly a structural heading "ghost" folder
    if (seriesDef.title === '[HEADING ONLY]') return;

    // Find articles assigned to this exact series ID and sort them by order_index
    const tracks = globalArticles
      .filter(a => a.series_id === seriesDef.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    html += buildFolder(seriesDef.title, tracks, 'series_' + sIdx, seriesDef.category_label);
  });

  // 2. Render Unassigned Singles at the bottom, also sorted
  const singles = globalArticles
    .filter(a => !a.series_id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  html += buildFolder("Unassigned Singles", singles, 'unassigned_singles');

  listContainer.innerHTML = html;
}

window.toggleFolder = function (sKey) {
  const el = document.getElementById(`folder-content-${sKey}`);
  const icon = document.getElementById(`folder-icon-${sKey}`);
  if (el) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      el.classList.add('flex');
      if (icon) icon.innerText = '[ - ]';
    } else {
      el.classList.add('hidden');
      el.classList.remove('flex');
      if (icon) icon.innerText = '[ + ]';
    }
  }
};

// Series deep link helpers
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

window.copySeriesLink = function (seriesTitle) {
  const slug = slugify(seriesTitle);
  const url = `${location.origin}/?series=${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    // Brief toast
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
  // Find matching series folder by slugified title
  globalSeries.forEach((s, i) => {
    if (slugify(s.title) === param) {
      const sKey = 'series_' + i;
      const el = document.getElementById(`folder-content-${sKey}`);
      if (el && el.classList.contains('hidden')) {
        window.toggleFolder(sKey);
        // Scroll sidebar to the folder
        const folder = document.getElementById(`album-${sKey}`);
        if (folder) setTimeout(() => folder.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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

  // (Scroll reset moved to bottom of function to ensure it fires after mobile unhides the reader)

  // VISUAL ACTIVE STATE (Monk Fix)
  // First, strip the active styling from all buttons
  document.querySelectorAll('#doc-list button').forEach(btn => {
    btn.classList.remove('bg-[#a78bfa]/10', 'border-[#a78bfa]');
    btn.classList.add('border-transparent');
  });

  // Then, apply the active styling to the explicitly clicked item
  const activeBtn = document.querySelector(`button[onclick="window.openArticle('${id}')"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent');
    activeBtn.classList.add('bg-[#a78bfa]/10', 'border-[#a78bfa]');
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

  // RESET SCROLL TO TOP (Monk Fix)
  // Deferring slightly ensures the DOM has updated the 'display' property before calculating scroll position.
  setTimeout(() => {
    htmlFrame.scrollTop = 0;
  }, 10);
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

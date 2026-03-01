import { supabase } from './supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from './auth.js';

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

// Removed editorFrame
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
  const requestedId = urlParams.get('id');

  await fetchArticles();
  renderSidebar();
  setupEventListeners();

  if (requestedId) {
    // If arriving via deep link, immediately open the article (skipping the homepage)
    window.openArticle(requestedId, true); // true = skip pushing state on initial load
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
  const buildFolder = (title, tracks, sKey) => {
    // SECURITY GATE: Only OPERATOR or SOVEREIGN can see Inside the Forge
    if (title === 'Inside the Forge' && !['OPERATOR', 'SOVEREIGN'].includes(currentRole)) {
      return '';
    }

    const filteredTracks = query
      ? tracks.filter(t => t.title.toLowerCase().includes(query))
      : tracks;

    if (filteredTracks.length === 0) return ''; // Hide empty folders

    let fHtml = `
            <div id="album-${sKey}" class="mb-4">
                <div onclick="window.toggleFolder('${sKey}')" class="pl-3 border-l-2 border-[#22c55e]/50 cursor-pointer group flex justify-between items-center hover:bg-[#22c55e]/10 py-3 transition-all bg-[#05010a]/50">
                    <div>
                        <h2 class="text-sm font-bold text-white tracking-widest uppercase">${title}</h2>
                        <p class="text-[9px] text-[#22c55e]/80 tracking-widest uppercase mt-1">${filteredTracks.length} Documents Located</p>
                    </div>
                    <div class="text-xs font-bold text-white/30 group-hover:text-[#22c55e] mr-3 transition-colors">[ &equiv; ]</div>
                </div>
                <div id="folder-content-${sKey}" class="flex flex-col hidden bg-[#05010a]/20 border-l border-[#22c55e]/10 ml-[11px] mt-1 pl-2">
    `;

    filteredTracks.forEach(t => {
      const shortId = t.id.substring(0, 4).toUpperCase();
      const dateStr = t.post_date ? new Date(t.post_date).toLocaleDateString() : 'UNKNOWN_DATE';

      fHtml += `
                <button onclick="window.openArticle('${t.id}')" class="w-full text-left py-3 px-2 hover:bg-[#22c55e]/5 group transition-colors flex flex-col gap-1 border-b border-white/5 last:border-0">
                    <span class="text-[8px] text-[#22c55e]/50 tracking-[0.2em] group-hover:text-[#22c55e] flex justify-between">
                        <span>SYS_${shortId} // T_NATIVE</span>
                        <span>[${dateStr}]</span>
                    </span>
                    <span class="text-[11px] text-white/80 group-hover:text-white font-bold leading-snug tracking-wider">${t.title}</span>
                </button>
      `;
    });

    fHtml += `</div></div>`;
    return fHtml;
  };

  // 1. Render Official Master Series in Exact DB Order
  globalSeries.forEach((seriesDef, sIdx) => {
    // Find articles assigned to this exact series ID and sort them by order_index
    const tracks = globalArticles
      .filter(a => a.series_id === seriesDef.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    html += buildFolder(seriesDef.title, tracks, 'series_' + sIdx);
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
  if (el) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      el.classList.add('flex');
    } else {
      el.classList.add('hidden');
      el.classList.remove('flex');
    }
  }
};

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

  // RESET SCROLL TO TOP (Monk Fix)
  htmlFrame.scrollTop = 0;

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

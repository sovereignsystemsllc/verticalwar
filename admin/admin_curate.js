import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ============================================================
// STATE
// ============================================================
let masterSeries = [];
let allArticles = [];
let folderMap = new Map(); // article_id -> Set<series_id>
let activeFolderId = null;      // null = UNASSIGNED view
let matrixSearchQuery = '';
let isGlobalSearch = false;

let articlesSortable = null;
let foldersSortable = null;

const COLOR_PALETTE = [null, '#a78bfa', '#f59e0b', '#ef4444', '#22d3ee', '#86efac', '#f472b6'];

// ============================================================
// DOM REFS
// ============================================================
const foldersContainer = document.getElementById('series-container');
const articlesContainer = document.getElementById('articles-container');
const activeFolderTitle = document.getElementById('active-folder-title');
const articleCount = document.getElementById('article-count');
const seriesCount = document.getElementById('series-count');
const btnSaveOrder = document.getElementById('btn-save-order');
const btnNewFolder = document.getElementById('btn-new-folder');
const btnNewHeading = document.getElementById('btn-new-heading');
const btnSaveFolderOrder = document.getElementById('btn-save-folder-order');
const btnSyncTimeline = document.getElementById('btn-sync-timeline');
const matrixSearchInput = document.getElementById('matrix-search');
const chkGlobalSearch = document.getElementById('chk-global-search');
const mainWorkspace = document.getElementById('main-workspace');
const tabFolders = document.getElementById('tab-folders');
const tabArticles = document.getElementById('tab-articles');
const articleCountTab = document.getElementById('article-count-tab');
const toastEl = document.getElementById('curate-toast');

// ============================================================
// MOBILE ACTION BAR (bottom-sheet)
// ============================================================
const mobileActionBar = document.getElementById('mobile-action-bar');
const mobileBackdrop = document.getElementById('mobile-backdrop');
const mabTitle = document.getElementById('mab-title');
const mabEdit = document.getElementById('mab-edit');
const mabVisibility = document.getElementById('mab-visibility');
const mabCarousel = document.getElementById('mab-carousel');
const mabFolder = document.getElementById('mab-folder');
const mabDelete = document.getElementById('mab-delete');

let _mabCleanup = null;

function openMobileActionBar(article) {
    if (!mobileActionBar) return;
    // Tear down previous listeners
    if (_mabCleanup) { _mabCleanup(); _mabCleanup = null; }

    mabTitle.textContent = article.title;
    mabEdit.href = `/admin/editor.html?id=${article.id}`;

    const hiddenNow = article.hidden;
    mabVisibility.textContent = hiddenNow ? '[SHOW]' : '[HIDE]';
    mabVisibility.className = hiddenNow
        ? 'mab-btn'
        : 'mab-btn muted';

    const onVisibility = async () => { closeMobileActionBar(); await toggleHidden(article); };
    const onCarousel = async () => { closeMobileActionBar(); await pinToCarousel(article); };
    const onFolder = async () => { closeMobileActionBar(); await assignExtraFolder(article); };
    const onDelete = async () => { closeMobileActionBar(); await deleteArticle(article.id); };
    const onBackdrop = () => closeMobileActionBar();

    mabVisibility.addEventListener('click', onVisibility);
    mabCarousel.addEventListener('click', onCarousel);
    mabFolder.addEventListener('click', onFolder);
    mabDelete.addEventListener('click', onDelete);
    mobileBackdrop.addEventListener('click', onBackdrop);

    _mabCleanup = () => {
        mabVisibility.removeEventListener('click', onVisibility);
        mabCarousel.removeEventListener('click', onCarousel);
        mabFolder.removeEventListener('click', onFolder);
        mabDelete.removeEventListener('click', onDelete);
        mobileBackdrop.removeEventListener('click', onBackdrop);
    };

    mobileBackdrop.classList.add('open');
    mobileActionBar.classList.add('open');
}

function closeMobileActionBar() {
    if (!mobileActionBar) return;
    mobileActionBar.classList.remove('open');
    mobileBackdrop.classList.remove('open');
    if (_mabCleanup) { _mabCleanup(); _mabCleanup = null; }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = `fixed bottom-6 right-6 z-[200] px-4 py-2 text-xs font-bold tracking-widest uppercase border transition-all duration-300 ${isError
        ? 'bg-red-900/80 border-red-500 text-red-300'
        : 'bg-[#0a0a0a] border-matrix-green text-matrix-green'
        }`;
    toastEl.classList.remove('opacity-0', 'translate-y-2');
    setTimeout(() => {
        toastEl.classList.add('opacity-0', 'translate-y-2');
    }, 2800);
}

// ============================================================
// MOBILE TABS
// ============================================================
function isMobile() { return window.innerWidth < 1024; }

function _applyMobileTabUI(tab) {
    mainWorkspace.dataset.active = tab;
    if (!tabFolders || !tabArticles) return;
    const onFolders = tab === 'folders';
    tabFolders.classList.toggle('text-matrix-green', onFolders);
    tabFolders.classList.toggle('border-matrix-green', onFolders);
    tabFolders.classList.toggle('text-matrix-muted', !onFolders);
    tabFolders.classList.toggle('border-transparent', !onFolders);
    tabArticles.classList.toggle('text-matrix-green', !onFolders);
    tabArticles.classList.toggle('border-matrix-green', !onFolders);
    tabArticles.classList.toggle('text-matrix-muted', onFolders);
    tabArticles.classList.toggle('border-transparent', onFolders);
}

function setMobileTab(tab) {
    if (!isMobile()) return;
    _applyMobileTabUI(tab);
    // Push a history entry so swipe-back returns to the previous tab
    history.pushState({ matrixTab: tab }, '');
}

// Intercept swipe-back: navigate to the other tab instead of leaving the page
window.addEventListener('popstate', (e) => {
    if (!isMobile()) return;
    const tab = e.state?.matrixTab;
    if (tab) {
        // Only update the UI — do NOT push another state (that would loop)
        _applyMobileTabUI(tab);
    }
    // No matrixTab in state = genuine back navigation, let browser proceed
});

// Anchor the page entry so the very first swipe-back stays within the page
history.replaceState({ matrixTab: 'folders' }, '');

if (tabFolders) tabFolders.addEventListener('click', () => setMobileTab('folders'));
if (tabArticles) tabArticles.addEventListener('click', () => setMobileTab('articles'));


// ============================================================
// MODAL SYSTEM
// ============================================================

// Shared helpers used by all modal functions
function _modalRefs() {
    return {
        modal: document.getElementById('sovereign-modal'),
        title: document.getElementById('modal-title'),
        inputEl: document.getElementById('modal-input'),
        selectEl: document.getElementById('modal-select'),
        thumbWrap: document.getElementById('modal-thumb-preview-wrap'),
        thumbImg: document.getElementById('modal-thumb-preview'),
        btnCancel: document.getElementById('modal-btn-cancel'),
        btnConfirm: document.getElementById('modal-btn-confirm'),
    };
}

// Text input modal — returns string or null (cancelled)
function sovereignPrompt(message, defaultValue = '', showThumbPreview = false) {
    return new Promise((resolve) => {
        const { modal, title, inputEl, selectEl, thumbWrap, thumbImg, btnCancel, btnConfirm } = _modalRefs();

        title.innerText = message;
        if (selectEl) selectEl.classList.add('hidden');
        inputEl.classList.remove('hidden');
        inputEl.value = defaultValue;

        // Named reference prevents listener accumulation (fixes the leak bug)
        const onThumbInput = () => { thumbImg.src = inputEl.value; };

        if (showThumbPreview && defaultValue) {
            thumbImg.src = defaultValue;
            thumbWrap.classList.remove('hidden');
            inputEl.addEventListener('input', onThumbInput);
        } else {
            thumbWrap.classList.add('hidden');
            thumbImg.src = '';
        }

        modal.classList.remove('hidden');
        inputEl.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            thumbWrap.classList.add('hidden');
            inputEl.removeEventListener('input', onThumbInput); // properly removed
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
            inputEl.removeEventListener('keydown', onKeydown);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onConfirm = () => { cleanup(); resolve(inputEl.value); };
        const onKeydown = (e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        inputEl.addEventListener('keydown', onKeydown);
    });
}

// Confirm modal — returns true/false
function sovereignConfirm(message) {
    return new Promise((resolve) => {
        const { modal, title, inputEl, selectEl, thumbWrap, btnCancel, btnConfirm } = _modalRefs();

        title.innerText = message;
        inputEl.classList.add('hidden');
        if (selectEl) selectEl.classList.add('hidden');
        thumbWrap.classList.add('hidden');
        modal.classList.remove('hidden');

        const cleanup = () => {
            modal.classList.add('hidden');
            inputEl.classList.remove('hidden');
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onConfirm = () => { cleanup(); resolve(true); };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
    });
}

// Select dropdown modal — options: [{ value, label }] — returns chosen value or null
function sovereignSelect(message, options) {
    return new Promise((resolve) => {
        const { modal, title, inputEl, selectEl, thumbWrap, btnCancel, btnConfirm } = _modalRefs();

        if (!selectEl) { resolve(null); return; }

        title.innerText = message;
        inputEl.classList.add('hidden');
        thumbWrap.classList.add('hidden');
        selectEl.innerHTML = options.map(o =>
            `<option value="${o.value}">${o.label}</option>`
        ).join('');
        selectEl.classList.remove('hidden');
        modal.classList.remove('hidden');
        selectEl.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            inputEl.classList.remove('hidden');
            selectEl.classList.add('hidden');
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onConfirm = () => { cleanup(); resolve(selectEl.value || null); };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
    });
}

// ============================================================
// AUTH
// ============================================================

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        window.location.replace('/');
        return;
    }
    loadData();
}

// ============================================================
// DATA LAYER — parallel fetches
// ============================================================

async function loadData() {
    const [sRes, aRes, fRes] = await Promise.all([
        supabase.from('series').select('*').order('order_index', { ascending: true }),
        supabase.from('articles')
            .select('id, title, subtitle, series, series_id, order_index, post_date, audience, thumbnail_url, color_tag, hidden')
            .order('order_index', { ascending: true }),
        supabase.from('article_folders').select('article_id, series_id'),
    ]);

    if (sRes.error) { console.error('Series load failed:', sRes.error); return; }
    if (aRes.error) { console.error('Articles load failed:', aRes.error); return; }

    masterSeries = sRes.data || [];
    allArticles = aRes.data || [];

    folderMap = new Map();
    if (!fRes.error && fRes.data) {
        for (const row of fRes.data) {
            if (!folderMap.has(row.article_id)) folderMap.set(row.article_id, new Set());
            folderMap.get(row.article_id).add(row.series_id);
        }
    }

    seriesCount.innerText = `${masterSeries.length} FOLDERS`;
    renderFolders();
    renderArticles(activeFolderId);
}

// ============================================================
// SAVE ARTICLE ORDER — single upsert, not N requests
// ============================================================

async function saveAllArticleOrder() {
    const items = Array.from(articlesContainer.children);
    const updates = [];

    items.forEach((item, index) => {
        const id = item.dataset.articleId;
        if (!id) return;
        updates.push({ id, order_index: index });
        const a = allArticles.find(art => art.id === id);
        if (a) a.order_index = index;
    });

    if (updates.length === 0) return;

    const { error } = await supabase.from('articles').upsert(updates, { onConflict: 'id' });
    if (error) { console.error('Article order upsert failed:', error); showToast('Save failed.', true); return; }

    allArticles.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

// ============================================================
// FOLDER HIGHLIGHT — lightweight, no DOM rebuild
// ============================================================

function syncFolderHighlight() {
    foldersContainer.querySelectorAll('[data-folder-id]').forEach(el => {
        const fid = el.dataset.folderId;
        const isActive = (activeFolderId === null && fid === 'unassigned') ||
            (activeFolderId !== null && fid === String(activeFolderId));

        if (el.dataset.folderType === 'folder') {
            el.classList.toggle('bg-matrix-green', isActive);
            el.classList.toggle('text-black', isActive);
            el.classList.toggle('border-matrix-green', isActive);
            el.classList.toggle('bg-transparent', !isActive);
            el.classList.toggle('text-matrix-text', !isActive);
            el.classList.toggle('border-matrix-border', !isActive);
        } else if (fid === 'unassigned') {
            el.classList.toggle('bg-matrix-green', isActive);
            el.classList.toggle('text-black', isActive);
            el.classList.toggle('border-matrix-green', isActive);
            el.classList.toggle('bg-transparent', !isActive);
            el.classList.toggle('text-matrix-muted', !isActive);
            el.classList.toggle('border-matrix-border', !isActive);
        }
    });
}

// ============================================================
// RENDER: FOLDERS (LEFT PANEL)
// ============================================================

function renderFolders() {
    foldersContainer.innerHTML = '';

    // ── UNASSIGNED SINGLES bucket (pinned, not part of section groups) ──
    const unassignedCount = allArticles.filter(a => !a.series_id).length;
    const unIsActive = activeFolderId === null && !isGlobalSearch;

    const unEl = document.createElement('div');
    unEl.dataset.folderId = 'unassigned';
    unEl.className = `p-2.5 mb-1 flex justify-between items-center cursor-pointer border transition-colors ${unIsActive
        ? 'bg-matrix-green text-black border-matrix-green'
        : 'bg-transparent text-matrix-muted border-matrix-border hover:border-matrix-green hover:text-white'
        }`;
    unEl.innerHTML = `
        <span class="uppercase font-bold tracking-widest text-xs flex items-center gap-2">
            <span class="opacity-60 text-[10px]">📁</span> UNASSIGNED
        </span>
        <span class="text-[9px] font-bold tracking-widest">(${unassignedCount})</span>`;

    unEl.onclick = () => {
        isGlobalSearch = false;
        if (chkGlobalSearch) chkGlobalSearch.checked = false;
        renderArticles(null);
        setMobileTab('articles');
    };

    new Sortable(unEl, {
        group: 'articles-group',
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 3,
        onAdd: async (evt) => {
            const items = (evt.items && evt.items.length > 0) ? evt.items : [evt.item];
            for (const item of items) {
                if (item.dataset.articleId) await moveToFolder(item.dataset.articleId, null, null, true);
            }
            renderFolders();
            renderArticles(activeFolderId);
        }
    });

    foldersContainer.appendChild(unEl);

    // ── GROUP masterSeries into sections: [ { heading, folders[] } ] ──
    // Each heading starts a new section. Folders before any heading go into
    // a headingless section so they're still draggable as a unit.
    const sections = [];
    let current = { heading: null, folders: [] };

    masterSeries.forEach(s => {
        if (s.title === '[HEADING ONLY]') {
            sections.push(current);
            current = { heading: s, folders: [] };
        } else {
            current.folders.push(s);
        }
    });
    sections.push(current);

    // ── RENDER each section as a draggable wrapper ──
    sections.forEach(section => {
        // Skip empty headingless sections (no folders, no heading)
        if (!section.heading && section.folders.length === 0) return;

        const wrapper = document.createElement('div');
        wrapper.dataset.sectionGroup = '1';
        wrapper.dataset.headingId = section.heading ? section.heading.id : '';
        wrapper.className = 'section-group';

        // ── Heading row ──
        if (section.heading) {
            const s = section.heading;
            const head = document.createElement('div');
            head.dataset.folderId = s.id;
            head.className = 'pt-6 pb-2 border-b border-matrix-border/40 relative cursor-grab group select-none';
            head.innerHTML = `
                <div class="flex items-center justify-between px-1">
                    <h3 class="text-[9px] ${s.hidden ? 'text-matrix-muted line-through' : 'text-matrix-green/70'} font-bold tracking-[0.4em] uppercase">${s.category_label || 'UNCATEGORIZED'}${s.hidden ? ' [HIDDEN]' : ''}</h3>
                    <div class="flex gap-2 folder-actions-group opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="btn-hide-folder text-[8px] font-bold ${s.hidden ? 'text-yellow-400 hover:text-yellow-300' : 'text-matrix-green/50 hover:text-yellow-400'}">[${s.hidden ? 'SHOW' : 'H'}]</button>
                        <button class="btn-edit-folder text-[8px] text-matrix-green/50 hover:text-matrix-green font-bold">[E]</button>
                        <button class="btn-del-folder  text-[8px] text-matrix-green/50 hover:text-red-500 font-bold">[D]</button>
                    </div>
                </div>`;
            head.querySelector('.btn-hide-folder').addEventListener('click', e => { e.stopPropagation(); toggleHiddenFolder(s.id, s.hidden); });
            head.querySelector('.btn-edit-folder').addEventListener('click', e => { e.stopPropagation(); editFolder(s.id); });
            head.querySelector('.btn-del-folder').addEventListener('click', e => { e.stopPropagation(); deleteFolder(s.id, true); });
            wrapper.appendChild(head);
        }

        // ── Folder / Pinned Article rows ──
        section.folders.forEach(s => {

            // ── PINNED ARTICLE entry ──
            if (s.title === '[PINNED ARTICLE]') {
                const pinned = allArticles.find(a => a.id === s.pinned_article_id);
                const pin = document.createElement('div');
                pin.dataset.folderId = s.id;
                pin.className = 'p-2.5 mb-1 flex items-center gap-2 border border-matrix-border/50 border-dashed relative group overflow-hidden text-matrix-muted hover:text-white hover:border-matrix-green transition-colors';
                pin.innerHTML = `
                    <span class="text-[10px] opacity-60 shrink-0">📄</span>
                    <span class="min-w-0 flex-1 font-bold tracking-wide text-[11px] truncate italic">${pinned ? pinned.title : '[MISSING ARTICLE]'}</span>
                    <div class="flex gap-1.5 shrink-0 folder-actions-group opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="btn-del-pin text-[8px] font-bold text-matrix-green/50 hover:text-red-500">[D]</button>
                    </div>`;
                pin.querySelector('.btn-del-pin').addEventListener('click', async e => {
                    e.stopPropagation();
                    const ok = await sovereignConfirm(`UNPIN: "${pinned ? pinned.title : s.id}"?`);
                    if (!ok) return;
                    await supabase.from('series').delete().eq('id', s.id);
                    loadData();
                });
                // Clicking the row opens the article in a new tab
                pin.addEventListener('click', () => {
                    if (pinned) window.open(`/post/?id=${pinned.id}`, '_blank');
                });
                wrapper.appendChild(pin);
                return; // skip folder rendering for this entry
            }

            // ── Regular folder row ──
            const isActive = activeFolderId === s.id;
            const count = allArticles.filter(a =>
                a.series_id === s.id || folderMap.get(a.id)?.has(s.id)
            ).length;

            const el = document.createElement('div');
            el.dataset.folderId = s.id;
            el.dataset.folderType = 'folder';
            el.className = `p-2.5 mb-1 flex items-center gap-2 cursor-pointer border transition-colors relative group overflow-hidden ${isActive
                ? 'bg-matrix-green text-black border-matrix-green'
                : 'bg-transparent text-matrix-text border-matrix-border hover:border-matrix-green'
                }`;

            el.addEventListener('click', () => {
                isGlobalSearch = false;
                if (chkGlobalSearch) chkGlobalSearch.checked = false;
                renderArticles(s.id);
                setMobileTab('articles');
            });

            if (s.hidden && !isActive) el.classList.add('opacity-40');

            el.innerHTML = `
                <span class="text-[10px] opacity-50 shrink-0">📁</span>
                <span class="min-w-0 flex-1 uppercase font-bold tracking-wide text-xs truncate ${s.hidden ? 'line-through' : ''}" style="${isActive ? 'color:#000' : ''}">${s.title}${s.hidden ? ' [HIDDEN]' : ''}${s.splash_article_id ? ' <span title="Has splash page" style="opacity:0.7">🎯</span>' : ''}</span>
                <span class="text-[9px] font-bold shrink-0 ml-auto" style="${isActive ? 'color:rgba(0,0,0,0.5)' : 'color:#6b7280'}">(${count})</span>
                <div class="flex gap-1.5 shrink-0 folder-actions-group opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-splash-folder text-[8px] font-bold" style="color:${s.splash_article_id ? '#22d3ee' : 'rgba(167,139,250,0.6)'}" title="${s.splash_article_id ? 'Change splash page' : 'Assign splash page'}">[${s.splash_article_id ? 'S✓' : 'S'}]</button>
                    <button class="btn-hide-folder text-[8px] font-bold" style="color:${s.hidden ? '#facc15' : 'rgba(167,139,250,0.6)'}">[${s.hidden ? 'SHOW' : 'H'}]</button>
                    <button class="btn-move-folder text-[8px] font-bold" style="color:rgba(167,139,250,0.6);" title="Move to a different heading">[M]</button>
                    <button class="btn-edit-folder text-[8px] font-bold" style="${isActive ? 'color:rgba(0,0,0,0.5)' : 'color:rgba(167,139,250,0.6)'}">[E]</button>
                    <button class="btn-del-folder  text-[8px] font-bold" style="${isActive ? 'color:rgba(0,0,0,0.5)' : 'color:rgba(167,139,250,0.6)'}">[D]</button>
                </div>`;

            el.querySelector('.btn-splash-folder').addEventListener('click', e => { e.stopPropagation(); assignFolderSplash(s.id); });
            el.querySelector('.btn-hide-folder').addEventListener('click', e => { e.stopPropagation(); toggleHiddenFolder(s.id, s.hidden); });
            el.querySelector('.btn-move-folder').addEventListener('click', e => { e.stopPropagation(); moveFolderToHeading(s.id); });
            el.querySelector('.btn-edit-folder').addEventListener('click', e => { e.stopPropagation(); editFolder(s.id); });
            el.querySelector('.btn-del-folder').addEventListener('click', e => { e.stopPropagation(); deleteFolder(s.id); });

            // Drop target: article dragged from right panel lands here
            new Sortable(el, {
                group: 'articles-group',
                delay: 150,
                delayOnTouchOnly: true,
                touchStartThreshold: 3,
                onAdd: async (evt) => {
                    const items = (evt.items && evt.items.length > 0) ? evt.items : [evt.item];
                    for (const item of items) {
                        if (item.dataset.articleId) await moveToFolder(item.dataset.articleId, s.id, s.title, true);
                    }
                    renderFolders();
                    renderArticles(activeFolderId);
                }
            });

            wrapper.appendChild(el);
        });

        foldersContainer.appendChild(wrapper);
    });

    // ── SortableJS on SECTION WRAPPERS — drags the whole group ──
    if (foldersSortable) foldersSortable.destroy();
    foldersSortable = new Sortable(foldersContainer, {
        group: 'folders-group',
        animation: 150,
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 3,
        draggable: '[data-section-group]',
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        onMove: (evt) => {
            // Never drag UNASSIGNED bucket
            if (evt.dragged.dataset.folderId === 'unassigned' ||
                evt.related?.dataset.folderId === 'unassigned') return false;
        },
        onEnd: () => {
            if (btnSaveFolderOrder) {
                btnSaveFolderOrder.classList.remove('hidden');
                btnSaveFolderOrder.classList.add('animate-pulse');
            }
        }
    });
}

// ============================================================
// RENDER: ARTICLES (RIGHT PANEL) — FTP file-list style
// ============================================================

function renderArticles(folderId) {
    activeFolderId = folderId;

    // Path / title bar
    if (isGlobalSearch) {
        activeFolderTitle.innerText = `GLOBAL // ${matrixSearchQuery || 'ALL RECORDS'}`;
    } else if (folderId === null) {
        activeFolderTitle.innerText = 'UNASSIGNED SINGLES';
    } else {
        const f = masterSeries.find(s => s.id === folderId);
        activeFolderTitle.innerText = f ? f.title.toUpperCase() : 'UNKNOWN';
    }

    // Filter
    let filtered = isGlobalSearch
        ? [...allArticles]
        : (folderId === null
            ? allArticles.filter(a => !a.series_id)
            : allArticles.filter(a => a.series_id === folderId));

    // Search
    if (matrixSearchQuery) {
        const q = matrixSearchQuery.toLowerCase();
        filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
    }

    articleCount.innerText = `${filtered.length} RECORDS`;
    if (articleCountTab) articleCountTab.innerText = `(${filtered.length})`;

    // Sync folder highlight without rebuilding DOM
    syncFolderHighlight();

    // Close any open trays before wiping
    articlesContainer.innerHTML = '';

    if (filtered.length === 0) {
        articlesContainer.innerHTML = `
            <div class="text-[10px] text-matrix-green/40 animate-pulse uppercase tracking-[0.2em] p-6 text-center border border-matrix-border/30">
                ZONE EMPTY — NO RECORDS
            </div>`;
        setupArticlesSortable();
        return;
    }

    filtered.forEach((a, idx) => {
        const dateStr = a.post_date
            ? new Date(a.post_date).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })
            : '--/--/--';
        const colorStyle = a.color_tag
            ? `background:${a.color_tag};`
            : 'background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.3);';
        const pillCls = a.audience === 'only_paid' ? 'pill-members' : 'pill-everyone';
        const pillTxt = a.audience === 'only_paid' ? 'MBR' : 'ALL';
        const thumbHtml = a.thumbnail_url
            ? `<img src="${a.thumbnail_url}" alt="" class="thumb-preview" data-action="thumb">`
            : `<div class="thumb-placeholder" data-action="thumb">IMG</div>`;

        const extras = folderMap.get(a.id);
        const multiBadge = (extras && extras.size > 0)
            ? `<span class="text-[7px] text-matrix-green/60 border border-matrix-green/30 px-1">+${extras.size}F</span>`
            : '';

        const el = document.createElement('div');
        el.dataset.articleId = a.id;
        el.className = `file-row border-b border-matrix-border/30 flex items-center hover:bg-matrix-green/5 transition-colors group relative${a.hidden ? ' article-hidden-row' : ''}`;

        el.innerHTML = `
            <!-- DRAG HANDLE -->
            <div class="drag-handle w-7 self-stretch flex items-center justify-center cursor-grab active:cursor-grabbing text-matrix-muted/30 hover:text-matrix-green hover:bg-matrix-green/10 transition-colors text-xs border-r border-matrix-border/30 shrink-0">⋮</div>

            <!-- COLOR DOT -->
            <div class="w-7 flex items-center justify-center shrink-0 pl-1">
                <div class="color-dot" style="${colorStyle}" data-action="color" title="Cycle color tag"></div>
            </div>

            <!-- THUMBNAIL -->
            <div class="w-9 flex items-center justify-center shrink-0 py-1.5">${thumbHtml}</div>

            <!-- TITLE + FLAGS -->
            <div class="flex-1 min-w-0 px-2 py-2">
                <p class="text-xs font-bold tracking-wide truncate${a.hidden ? ' line-through opacity-40' : ''}">${a.title}</p>
                <div class="flex items-center gap-1 mt-0.5">
                    ${multiBadge}
                    ${a.hidden ? '<span class="text-[7px] text-red-500/70 border border-red-500/30 px-1 tracking-widest">HIDDEN</span>' : ''}
                </div>
            </div>

            <!-- AUDIENCE PILL -->
            <div class="w-10 flex items-center justify-center shrink-0">
                <button class="${pillCls} text-[7px] font-bold px-1.5 py-0.5 tracking-widest cursor-pointer hover:opacity-80 rounded-full" data-action="audience">${pillTxt}</button>
            </div>

            <!-- DATE -->
            <div class="w-16 text-[9px] text-matrix-muted font-mono text-center shrink-0 hidden md:block">${dateStr}</div>

            <!-- TRAY TOGGLE -->
            <div class="w-7 self-stretch flex items-center justify-center shrink-0 cursor-pointer border-l border-matrix-border/30 text-matrix-muted/30 hover:text-matrix-green hover:bg-matrix-green/10 transition-colors text-xs" data-action="toggle-tray">▾</div>

            <!-- ACTION TRAY (slides down on toggle) -->
            <div class="article-actions absolute left-0 right-0 z-30 bg-[#0d0d0d] border-b border-matrix-green/30 items-center gap-3 px-8 py-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.6)]" style="top:100%;">
                <a href="/admin/editor.html?id=${a.id}" target="_blank"
                   class="text-[8px] font-bold text-matrix-green hover:underline tracking-widest shrink-0">[EDIT →]</a>
                <button data-action="${a.hidden ? 'show' : 'hide'}"
                        class="text-[8px] font-bold tracking-widest shrink-0 ${a.hidden ? 'text-green-400 hover:text-green-300' : 'text-matrix-muted hover:text-yellow-400'}">
                    [${a.hidden ? 'SHOW' : 'HIDE'}]
                </button>
                <button data-action="carousel"
                        class="text-[8px] font-bold text-matrix-muted hover:text-[#f59e0b] tracking-widest shrink-0"
                        title="Pin to homepage carousel">[📌 CAROUSEL]</button>
                <button data-action="delete"
                        class="text-[8px] font-bold text-matrix-muted hover:text-red-500 tracking-widest shrink-0">[DEL]</button>
                <button data-action="multi-folder"
                        class="text-[8px] font-bold text-matrix-muted hover:text-matrix-green tracking-widest ml-auto shrink-0">[+FOLDER]</button>
            </div>`;

        // ── Click delegation ──────────────────────────────
        el.addEventListener('click', async (e) => {
            if (e.target.closest('a')) return;
            const action = e.target.closest('[data-action]')?.dataset?.action;
            if (!action) return;
            e.stopPropagation();

            if (action === 'toggle-tray') {
                if (isMobile()) {
                    // Mobile: open bottom-sheet
                    openMobileActionBar(a);
                } else {
                    // Desktop: absolute dropdown
                    const tray = el.querySelector('.article-actions');
                    const isOpen = tray.classList.contains('open');
                    articlesContainer.querySelectorAll('.article-actions.open').forEach(t => t.classList.remove('open'));
                    if (!isOpen) tray.classList.add('open');
                }
                return;
            }
            if (action === 'color') { await cycleColorTag(a); return; }
            if (action === 'audience') { await toggleAudience(a); return; }
            if (action === 'thumb') { await editThumbnail(a); return; }
            if (action === 'hide' || action === 'show') { await toggleHidden(a); return; }
            if (action === 'carousel') { await pinToCarousel(a); return; }
            if (action === 'delete') { await deleteArticle(a.id); return; }
            if (action === 'multi-folder') { await assignExtraFolder(a); return; }
        });

        articlesContainer.appendChild(el);
    });

    setupArticlesSortable();
}

function setupArticlesSortable() {
    if (articlesSortable) articlesSortable.destroy();
    articlesSortable = new Sortable(articlesContainer, {
        group: 'articles-group',
        handle: '.drag-handle',
        animation: 150,
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 3,
        multiDrag: true,
        selectedClass: 'sortable-selected',
        fallbackTolerance: 3,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        onEnd: (evt) => {
            if (evt.to === evt.from) {
                btnSaveOrder.classList.remove('hidden');
                btnSaveOrder.classList.add('animate-pulse');
            }
        }
    });
}

// ============================================================
// ARTICLE ACTIONS
// ============================================================

async function cycleColorTag(article) {
    const currentIdx = COLOR_PALETTE.indexOf(article.color_tag);
    const nextColor = COLOR_PALETTE[(currentIdx + 1) % COLOR_PALETTE.length];
    article.color_tag = nextColor;
    await supabase.from('articles').update({ color_tag: nextColor }).eq('id', article.id);
    renderArticles(activeFolderId);
}

async function toggleAudience(article) {
    const next = article.audience === 'only_paid' ? 'everyone' : 'only_paid';
    article.audience = next;
    await supabase.from('articles').update({ audience: next }).eq('id', article.id);
    renderArticles(activeFolderId);
}

async function editThumbnail(article) {
    const newUrl = await sovereignPrompt('ENTER THUMBNAIL URL:', article.thumbnail_url || '', true);
    if (newUrl === null) return;
    article.thumbnail_url = newUrl.trim() || null;
    await supabase.from('articles').update({ thumbnail_url: article.thumbnail_url }).eq('id', article.id);
    renderArticles(activeFolderId);
}

async function toggleHidden(article) {
    const next = !article.hidden;
    article.hidden = next;
    await supabase.from('articles').update({ hidden: next }).eq('id', article.id);
    renderArticles(activeFolderId);
}

async function deleteArticle(articleId) {
    const confirmed = await sovereignConfirm('CRITICAL WARNING: PERMANENTLY DELETE THIS RECORD?');
    if (!confirmed) return;
    const { error } = await supabase.from('articles').delete().eq('id', articleId);
    if (error) { console.error('Delete failed:', error.message); showToast('Delete failed.', true); return; }
    allArticles = allArticles.filter(a => a.id !== articleId);
    folderMap.delete(articleId);
    renderArticles(activeFolderId);
}

async function assignExtraFolder(article) {
    const choices = masterSeries.filter(s => s.title !== '[HEADING ONLY]' && s.id !== article.series_id);
    if (choices.length === 0) {
        await sovereignConfirm('No other folders available to assign.');
        return;
    }
    // sovereignSelect shows a proper dropdown — no more "type a number"
    const options = choices.map(s => ({ value: s.id, label: s.title }));
    const targetId = await sovereignSelect('ASSIGN TO ADDITIONAL FOLDER:', options);
    if (!targetId) return;

    const target = choices.find(s => s.id === targetId);
    if (!target) return;

    const { error } = await supabase.from('article_folders').upsert({ article_id: article.id, series_id: target.id });
    if (error) { console.error('Multi-folder assign failed:', error.message); showToast('Assign failed.', true); return; }

    if (!folderMap.has(article.id)) folderMap.set(article.id, new Set());
    folderMap.get(article.id).add(target.id);
    showToast(`Assigned to "${target.title}"`);
    renderArticles(activeFolderId);
}

// Quick-pin article to homepage carousel (splash_slides)
async function pinToCarousel(article) {
    const confirmed = await sovereignConfirm(
        `PIN TO CAROUSEL: "${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}"?`
    );
    if (!confirmed) return;

    // Get max order_index from existing slides
    const { data: slides } = await supabase.from('splash_slides').select('order_index').order('order_index', { ascending: false }).limit(1);
    const nextOrder = slides && slides.length > 0 ? (slides[0].order_index || 0) + 1 : 0;

    const payload = {
        title: article.title,
        body: article.subtitle || null,
        image_url: article.thumbnail_url || null,
        link_url: `/post/?id=${article.id}`,
        link_label: '[ READ → ]',
        order_index: nextOrder,
    };

    const { error } = await supabase.from('splash_slides').insert([payload]);
    if (error) {
        console.error('Carousel pin failed:', error.message);
        showToast('Carousel pin failed.', true);
        return;
    }
    showToast('📌 Pinned to carousel!');
}

async function moveToFolder(articleId, targetFolderId, targetFolderTitle, skipRender = false) {
    const article = allArticles.find(a => a.id === articleId);
    if (article) {
        article.series_id = targetFolderId;
        article.series = targetFolderTitle;
    }
    const { error } = await supabase.from('articles')
        .update({ series_id: targetFolderId, series: targetFolderTitle })
        .eq('id', articleId);

    if (error) {
        console.error('Move to folder failed:', error.message);
        if (!skipRender) await loadData();
    } else {
        if (!skipRender) { renderFolders(); renderArticles(activeFolderId); }
    }
}

// ============================================================
// SAVE ARTICLE ORDER BUTTON
// ============================================================

btnSaveOrder.addEventListener('click', async () => {
    btnSaveOrder.innerText = '[ SAVING... ]';
    btnSaveOrder.classList.remove('animate-pulse');
    await saveAllArticleOrder();
    showToast('Sort order saved.');
    btnSaveOrder.innerText = '[ SAVED ✓ ]';
    btnSaveOrder.classList.add('bg-white', 'text-black');
    setTimeout(() => {
        btnSaveOrder.innerText = '[ SAVE ORDER ]';
        btnSaveOrder.classList.remove('bg-white', 'text-black');
        btnSaveOrder.classList.add('hidden');
    }, 2000);
});

// ============================================================
// FOLDER CRUD
// ============================================================

async function editFolder(id) {
    const s = masterSeries.find(series => series.id === id);
    if (!s) return;

    if (s.title === '[HEADING ONLY]') {
        const newVal = await sovereignPrompt('EDIT CATEGORY HEADING:', s.category_label || '');
        if (!newVal || newVal.trim() === '' || newVal === s.category_label) return;
        const { error } = await supabase.from('series').update({ category_label: newVal.trim() }).eq('id', id);
        if (error) { console.error('Edit heading failed:', error.message); return; }
        loadData();
    } else {
        const newVal = await sovereignPrompt('EDIT FOLDER DESIGNATION:', s.title);
        if (!newVal || newVal.trim() === '' || newVal === s.title) return;
        const { error } = await supabase.from('series').update({ title: newVal.trim() }).eq('id', id);
        if (error) { console.error('Edit folder failed:', error.message); return; }
        loadData();
    }
}

async function deleteFolder(id, isHeading = false) {
    const s = masterSeries.find(series => series.id === id);
    if (!s) return;

    const count = allArticles.filter(a => a.series_id === id).length;
    if (count > 0 && !isHeading) {
        await sovereignConfirm(`SYSTEM LOCK: Folder contains ${count} records. Empty it first.`);
        return;
    }

    const nameStr = isHeading ? s.category_label : s.title;
    const confirmed = await sovereignConfirm(`DELETE: [ ${nameStr} ]?`);
    if (!confirmed) return;

    const { error } = await supabase.from('series').delete().eq('id', id);
    if (error) { console.error('Delete folder failed:', error.message); return; }
    if (activeFolderId === id) activeFolderId = null;
    loadData();
}

async function toggleHiddenFolder(id, currentlyHidden) {
    const next = !currentlyHidden;
    const { error } = await supabase.from('series').update({ hidden: next }).eq('id', id);
    if (error) { console.error('Toggle hidden failed:', error.message); showToast('Failed to update visibility.', true); return; }
    showToast(next ? 'Folder hidden from public.' : 'Folder visible to public.');
    loadData();
}

// ============================================================
// ASSIGN SPLASH ARTICLE TO FOLDER
// ============================================================
async function assignFolderSplash(folderId) {
    const choices = allArticles.filter(a => a.title && !a.hidden);
    if (choices.length === 0) { showToast('No articles available.', true); return; }

    // Prepend a [CLEAR] option so admin can unassign
    const options = [
        { value: '__CLEAR__', label: '[ CLEAR — Remove Splash Page ]' },
        ...choices.map(a => ({ value: a.id, label: a.title }))
    ];

    const selected = await sovereignSelect('ASSIGN SPLASH ARTICLE TO FOLDER:', options);
    if (!selected) return; // cancelled

    const newValue = selected === '__CLEAR__' ? null : selected;
    const { error } = await supabase.from('series').update({ splash_article_id: newValue }).eq('id', folderId);
    if (error) { showToast('Failed to assign splash article.', true); return; }

    showToast(newValue ? 'Splash page assigned.' : 'Splash page cleared.');
    loadData();
}

// ============================================================
// MOVE FOLDER TO A DIFFERENT HEADING
// ============================================================

async function moveFolderToHeading(folderId) {
    const headings = masterSeries.filter(s => s.title === '[HEADING ONLY]');
    if (headings.length === 0) {
        await sovereignConfirm('No headings exist. Create a heading first.');
        return;
    }

    const options = headings.map(h => ({ value: h.id, label: h.category_label || 'UNCATEGORIZED' }));
    const targetHeadingId = await sovereignSelect('MOVE FOLDER UNDER HEADING:', options);
    if (!targetHeadingId) return;

    // Find the heading's current order_index, then slot the folder right after it.
    // We rebuild a new flat ordering: everything in order, but with the folder
    // removed from its old position and inserted after the chosen heading.
    const headingRow = masterSeries.find(s => s.id === targetHeadingId);
    if (!headingRow) return;

    const withoutFolder = masterSeries.filter(s => s.id !== folderId);
    const headingPos = withoutFolder.findIndex(s => s.id === targetHeadingId);

    // Insert folder immediately after the heading
    withoutFolder.splice(headingPos + 1, 0, masterSeries.find(s => s.id === folderId));

    // Assign sequential order_index values
    const updates = withoutFolder.map((s, idx) => ({
        id: s.id,
        order_index: idx,
        category_label: s.category_label
    }));

    const { error } = await supabase.from('series').upsert(updates, { onConflict: 'id' });
    if (error) { console.error('Move folder failed:', error.message); showToast('Move failed.', true); return; }

    showToast(`Moved under "${headingRow.category_label || 'UNCATEGORIZED'}".`);
    await loadData();
}

// ============================================================
// NEW HEADING
// ============================================================

if (btnNewHeading) {
    btnNewHeading.addEventListener('click', async () => {
        const catLabel = await sovereignPrompt("NEW CATEGORY HEADING:");
        if (!catLabel || catLabel.trim() === '') return;
        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);
        const { error } = await supabase.from('series').insert([{
            title: '[HEADING ONLY]',
            category_label: catLabel.trim(),
            order_index: maxOrder + 1
        }]);
        if (error) { console.error('New heading failed:', error.message); showToast('Failed to create heading.', true); return; }
        showToast(`Heading "${catLabel.trim()}" created.`);
        await loadData();
        setTimeout(() => { foldersContainer.scrollTop = foldersContainer.scrollHeight; }, 100);
    });
}

// ============================================================
// NEW FOLDER
// ============================================================

if (btnNewFolder) {
    btnNewFolder.addEventListener('click', async () => {
        const name = await sovereignPrompt('NEW FOLDER NAME:');
        if (!name || name.trim() === '') return;

        let defaultCat = 'UNCATEGORIZED';
        if (masterSeries.length > 0) {
            const last = masterSeries[masterSeries.length - 1];
            defaultCat = last.category_label || 'UNCATEGORIZED';
        }
        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);

        const { data, error } = await supabase.from('series')
            .insert([{ title: name.trim(), category_label: defaultCat, order_index: maxOrder + 1 }])
            .select();

        if (error) { console.error('New folder failed:', error.message); showToast('Failed to create folder.', true); return; }
        showToast(`Folder "${name.trim()}" created.`);
        await loadData();
        if (data && data.length > 0) {
            renderArticles(data[0].id);
            setTimeout(() => { foldersContainer.scrollTop = foldersContainer.scrollHeight; }, 100);
        }
    });
}

// ============================================================
// PIN ARTICLE TO SIDEBAR
// ============================================================

const btnPinArticle = document.getElementById('btn-pin-article');
if (btnPinArticle) {
    btnPinArticle.addEventListener('click', async () => {
        const choices = allArticles.filter(a => a.title);
        if (choices.length === 0) { showToast('No articles available.', true); return; }
        const options = choices.map(a => ({ value: a.id, label: a.title }));
        const articleId = await sovereignSelect('PIN ARTICLE TO SIDEBAR:', options);
        if (!articleId) return;

        let defaultCat = 'UNCATEGORIZED';
        if (masterSeries.length > 0) defaultCat = masterSeries[masterSeries.length - 1].category_label || 'UNCATEGORIZED';
        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);

        const { error } = await supabase.from('series').insert([{
            title: '[PINNED ARTICLE]',
            pinned_article_id: articleId,
            category_label: defaultCat,
            order_index: maxOrder + 1
        }]);
        if (error) { console.error('Pin article failed:', error.message); showToast('Pin failed.', true); return; }
        showToast('📄 Article pinned to sidebar.');
        await loadData();
        setTimeout(() => { foldersContainer.scrollTop = foldersContainer.scrollHeight; }, 100);
    });
}

// ============================================================
// SAVE FOLDER ORDER — single upsert
// ============================================================

if (btnSaveFolderOrder) {
    btnSaveFolderOrder.addEventListener('click', async () => {
        btnSaveFolderOrder.innerText = '[ SAVING... ]';
        btnSaveFolderOrder.classList.remove('animate-pulse');

        // Walk section wrappers in their new DOM order, then items within each wrapper.
        // This re-flattens the grouped structure back into a linear order_index sequence.
        const updates = [];
        let dbIndex = 0;

        Array.from(foldersContainer.children).forEach(child => {
            if (!child.dataset.sectionGroup) return; // skip UNASSIGNED bucket

            // Resolve category_label from in-memory masterSeries — never from DOM text
            const headingId = child.dataset.headingId;
            const headingRow = headingId ? masterSeries.find(s => s.id === headingId) : null;
            const categoryLabel = headingRow ? (headingRow.category_label || 'UNCATEGORIZED') : 'UNCATEGORIZED';

            // Walk every [data-folder-id] inside this section wrapper
            Array.from(child.querySelectorAll('[data-folder-id]')).forEach(item => {
                const id = item.dataset.folderId;
                if (!id || id === 'unassigned') return;
                const s = masterSeries.find(series => series.id === id);
                if (!s) return;

                updates.push({ id, order_index: dbIndex, category_label: categoryLabel });
                dbIndex++;
            });
        });

        if (updates.length > 0) {
            const { error } = await supabase.from('series').upsert(updates, { onConflict: 'id' });
            if (error) { console.error('Folder order upsert failed:', error); showToast('Save failed.', true); }
            else {
                updates.forEach(u => {
                    const s = masterSeries.find(series => series.id === u.id);
                    if (s) { s.order_index = u.order_index; s.category_label = u.category_label; }
                });
                masterSeries.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                showToast('Folder order saved.');
            }
        }

        renderFolders();
        btnSaveFolderOrder.innerText = '[ SAVED ✓ ]';
        btnSaveFolderOrder.classList.add('bg-white', 'text-black');
        setTimeout(() => {
            btnSaveFolderOrder.innerText = 'SAVE ORDER';
            btnSaveFolderOrder.classList.remove('bg-white', 'text-black');
            btnSaveFolderOrder.classList.add('hidden');
        }, 2000);
    });
}

// ============================================================
// SYNC TIMELINE — upsert, not loop
// ============================================================

if (btnSyncTimeline) {
    btnSyncTimeline.addEventListener('click', async () => {
        if (!allArticles || allArticles.length === 0) return;

        const subset = allArticles.filter(a =>
            activeFolderId === null ? !a.series_id : a.series_id === activeFolderId
        );
        if (subset.length === 0) return;

        subset.sort((a, b) => new Date(a.post_date || 0) - new Date(b.post_date || 0));

        const updates = subset.map((a, idx) => {
            a.order_index = idx;
            return { id: a.id, order_index: idx };
        });

        allArticles.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        btnSyncTimeline.innerText = '[ SYNCING... ]';

        const { error } = await supabase.from('articles').upsert(updates, { onConflict: 'id' });
        if (error) { console.error('Sync timeline failed:', error); showToast('Sync failed.', true); }
        else {
            await saveAllArticleOrder(); // commit full matrix sort state atomically
            showToast('Timeline synced [OK]');
        }

        renderArticles(activeFolderId);
        btnSyncTimeline.innerText = '[ SYNC ]';
        setTimeout(() => { btnSyncTimeline.innerText = 'SYNC'; }, 2000);
    });
}

// ============================================================
// RSS SYNC — Import new Substack articles into the Matrix
// ============================================================

const SOVEREIGN_UUID = '5abcdeb3-0d75-4201-ba36-2f0c9d7a41ff';
const RSS_FEED_URL = 'https://constructamiracle.com/feed';
// allorigins proxies the RSS so we dodge the CORS wall in the browser
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

async function syncFromRSS() {
    const btn = document.getElementById('btn-rss-sync');
    if (btn) { btn.innerText = '[ LOADING... ]'; btn.disabled = true; }

    try {
        // ── 1. Fetch feed via CORS proxy ───────────────────────
        const proxyUrl = CORS_PROXY + encodeURIComponent(RSS_FEED_URL);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
        const json = await res.json();
        const xmlText = json.contents;
        if (!xmlText) throw new Error('Empty response from proxy.');

        // ── 2. Parse XML ────────────────────────────────────────
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const items = Array.from(doc.querySelectorAll('item'));
        if (items.length === 0) {
            showToast('RSS feed returned 0 articles.', true);
            return;
        }

        // ── 3. Pull existing slugs to deduplicate ───────────────
        const { data: existingSlugs, error: slugErr } = await supabase
            .from('articles')
            .select('slug');
        if (slugErr) throw new Error(`Slug fetch failed: ${slugErr.message}`);
        const knownSlugs = new Set((existingSlugs || []).map(r => r.slug).filter(Boolean));

        // ── 4. Build insert payload ─────────────────────────────
        const toInsert = [];

        for (const item of items) {
            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || null;
            const desc = item.querySelector('description')?.textContent?.trim() || '';

            // Full HTML body — Substack puts it in <content:encoded>
            const contentEl = item.getElementsByTagNameNS('*', 'encoded')[0];
            const contentHtml = contentEl ? contentEl.textContent.trim() : desc;

            // Thumbnail: <media:thumbnail> or <enclosure>
            let thumbnailUrl = null;
            const mediaThumbnail = item.getElementsByTagNameNS('*', 'thumbnail')[0];
            if (mediaThumbnail) thumbnailUrl = mediaThumbnail.getAttribute('url');
            if (!thumbnailUrl) {
                const enclosure = item.querySelector('enclosure');
                if (enclosure) thumbnailUrl = enclosure.getAttribute('url');
            }

            // Derive a slug from the URL path (last segment)
            let slug = null;
            try {
                const url = new URL(link);
                const segments = url.pathname.replace(/\/$/, '').split('/');
                slug = segments[segments.length - 1] || null;
            } catch (_) { /* malformed URL — skip slug */ }

            // Skip if we already have it
            if (slug && knownSlugs.has(slug)) continue;

            // Strip Substack-flavoured HTML (keep it simple — just use as-is,
            // admin can clean inside the editor if needed)
            const subtitle = desc.replace(/<[^>]+>/g, '').substring(0, 300).trim() || null;

            toInsert.push({
                title,
                content_html: contentHtml || '<p></p>',
                subtitle,
                slug,
                post_date: pubDate ? new Date(pubDate).toISOString() : null,
                thumbnail_url: thumbnailUrl,
                author_id: SOVEREIGN_UUID,
                author_name: 'Ethan',
                status: 'draft',
                hidden: true,        // land in staging — you review before publishing
                published: false,
                audience: 'everyone',
                series: null,
                order_index: 0,
            });
        }

        if (toInsert.length === 0) {
            showToast('✓ Already up to date — no new articles.');
            return;
        }

        // ── 5. Insert ──────────────────────────────────────────
        const { error: insertErr } = await supabase.from('articles').insert(toInsert);
        if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

        showToast(`↓ ${toInsert.length} article(s) imported as hidden drafts.`);
        await loadData(); // refresh the matrix

    } catch (err) {
        console.error('[syncFromRSS]', err);
        showToast(`RSS sync failed: ${err.message}`, true);
    } finally {
        if (btn) { btn.innerText = '↓ RSS'; btn.disabled = false; }
    }
}

const btnRssSync = document.getElementById('btn-rss-sync');
if (btnRssSync) {
    btnRssSync.addEventListener('click', syncFromRSS);
}

// ============================================================
// SEARCH
// ============================================================

if (matrixSearchInput) {
    matrixSearchInput.addEventListener('input', (e) => {
        matrixSearchQuery = e.target.value;
        renderArticles(activeFolderId); // single call, no dead branch
    });
}

if (chkGlobalSearch) {
    chkGlobalSearch.addEventListener('change', (e) => {
        isGlobalSearch = e.target.checked;
        renderArticles(activeFolderId);
    });
}

// ============================================================
// BOOT
// ============================================================
window.onload = bootstrap;

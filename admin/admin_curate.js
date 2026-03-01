import { createClient } from '@supabase/supabase-js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// Initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// State
let masterSeries = [];
let allArticles = [];
let activeFolderId = null;
let matrixSearchQuery = '';

// DOM Elements
const foldersContainer = document.getElementById('series-container');
const articlesContainer = document.getElementById('articles-container');
const activeFolderTitle = document.getElementById('active-folder-title');
const articleCount = document.getElementById('article-count');
const seriesCount = document.getElementById('series-count');
const btnSaveOrder = document.getElementById('btn-save-order');
const btnNewFolder = document.getElementById('btn-new-folder');
const btnSaveFolderOrder = document.getElementById('btn-save-folder-order');

// Sortable Instances
let articlesSortable = null;
let foldersSortable = null;

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

async function loadData() {
    // Load Series
    const { data: sData, error: sErr } = await supabase.from('series').select('*').order('order_index', { ascending: true });
    if (sErr) return console.error("Series Load Error", sErr);
    masterSeries = sData || [];

    // Load Articles
    const { data: aData, error: aErr } = await supabase.from('articles').select('id, title, series, series_id, order_index, post_date').order('order_index', { ascending: true });
    if (aErr) return console.error("Articles Load Error", aErr);
    allArticles = aData || [];

    seriesCount.innerText = `${masterSeries.length} FOLDERS`;

    renderFolders();
    renderArticles(null); // Load Unassigned Singles by default
}

function renderFolders() {
    foldersContainer.innerHTML = '';

    // Default Unassigned Folder
    const unEl = document.createElement('div');
    unEl.className = `p-3 mb-2 flex justify-between items-center cursor-pointer border transition-colors ${activeFolderId === null ? 'bg-matrix-green text-black border-matrix-green' : 'bg-transparent text-matrix-muted border-matrix-border hover:border-matrix-green hover:text-white'}`;
    unEl.innerHTML = `<span class="uppercase font-bold tracking-widest text-xs">UNASSIGNED SINGLES</span>`;
    unEl.onclick = () => renderArticles(null);
    unEl.dataset.folderId = "unassigned";
    foldersContainer.appendChild(unEl);

    // Dynamic Master Folders
    masterSeries.forEach(s => {
        const el = document.createElement('div');
        el.className = `p-3 mb-2 flex flex-col cursor-pointer border transition-colors ${activeFolderId === s.id ? 'bg-matrix-green text-black border-matrix-green' : 'bg-transparent text-matrix-text border-matrix-border hover:border-matrix-green'}`;

        let count = allArticles.filter(a => a.series_id === s.id).length;

        el.innerHTML = `
            <span class="uppercase font-bold tracking-widest text-xs mb-1">${s.title}</span>
            <span class="text-[9px] uppercase tracking-widest ${activeFolderId === s.id ? 'text-black/70' : 'text-matrix-muted'}">${count} Records</span>
        `;
        el.onclick = () => renderArticles(s.id);
        el.dataset.folderId = s.id;

        // Initialize dropzone for each folder to swallow articles
        new Sortable(el, {
            group: 'articles-group',
            onAdd: async function (evt) {
                // evt.items exists if MultiDrag is enabled and multiple items are dragged
                const draggedItems = (evt.items && evt.items.length > 0) ? evt.items : [evt.item];

                for (let item of draggedItems) {
                    const articleId = item.dataset.articleId;
                    if (articleId) {
                        await moveToFolder(articleId, s.id, s.title, true); // true = skipRender
                    }
                }

                // Once all are moved, re-render
                renderFolders();
                renderArticles(activeFolderId);
            }
        });

        foldersContainer.appendChild(el);
    });

    if (foldersSortable) {
        foldersSortable.destroy();
    }

    foldersSortable = new Sortable(foldersContainer, {
        group: 'folders-group',
        animation: 150,
        fallbackTolerance: 3, // Allow a 3px movement before dragging starts (allows taps/scrolling)
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        filter: '[data-folder-id="unassigned"]', // Don't let the unassigned folder be dragged
        onEnd: function (evt) {
            if (btnSaveFolderOrder) {
                btnSaveFolderOrder.classList.remove('hidden');
                btnSaveFolderOrder.classList.add('animate-pulse');
            }
        }
    });
}

function renderArticles(folderId) {
    activeFolderId = folderId;

    // Update Title
    if (folderId === null) {
        activeFolderTitle.innerText = "UNASSIGNED SINGLES";
    } else {
        const f = masterSeries.find(s => s.id === folderId);
        activeFolderTitle.innerText = f ? f.title : "UNKNOWN";
    }

    // Filter
    let filtered = [];
    if (folderId === null) {
        filtered = allArticles.filter(a => !a.series_id);
    } else {
        filtered = allArticles.filter(a => a.series_id === folderId);
    }

    if (matrixSearchQuery) {
        const q = matrixSearchQuery.toLowerCase();
        filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
    }

    articleCount.innerText = `${filtered.length} RECORDS`;

    // Re-highlight left panel
    Array.from(foldersContainer.children).forEach(child => {
        let isMatch = child.dataset.folderId === String(folderId);
        if (child.dataset.folderId === "unassigned" && folderId === null) isMatch = true;

        if (isMatch) {
            child.className = `p-3 mb-2 flex flex-col cursor-pointer border transition-colors bg-matrix-green text-black border-matrix-green`;
        } else {
            child.className = `p-3 mb-2 flex flex-col cursor-pointer border transition-colors bg-transparent text-matrix-muted border-matrix-border hover:border-matrix-green hover:text-white`;
        }
    });

    articlesContainer.innerHTML = '';

    if (filtered.length === 0) {
        articlesContainer.innerHTML = '<div class="text-[10px] text-matrix-green/50 animate-pulse uppercase tracking-[0.2em] p-4 text-center border border-matrix-border/50 bg-matrix-green/5">Zone Empty. No records located.</div>';
        return;
    }

    filtered.forEach((a, idx) => {
        const dateStr = a.post_date ? new Date(a.post_date).toLocaleDateString() : 'UNKNOWN_DATE';
        const el = document.createElement('div');
        el.dataset.articleId = a.id;
        el.className = 'bg-matrix-panel border border-matrix-border p-4 flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:bg-matrix-green/5 transition-colors group';

        el.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-[10px] text-matrix-green/50 tracking-[0.2em] group-hover:text-matrix-green transition-colors">SYS_RECORD // IDX_${a.order_index ?? idx}</span>
                <span class="text-[10px] text-matrix-muted font-bold">${dateStr}</span>
            </div>
            <h3 class="text-sm font-bold tracking-wider">${a.title}</h3>
        `;
        articlesContainer.appendChild(el);
    });

    // Destroy old sortable instance if exists to prevent memory leaks
    if (articlesSortable) {
        articlesSortable.destroy();
    }

    // Initialize Sortable for articles
    articlesSortable = new Sortable(articlesContainer, {
        group: 'articles-group',
        animation: 150,
        multiDrag: true, // Enable MultiDrag
        selectedClass: 'sortable-selected', // Class applied to selected items
        fallbackTolerance: 3,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        onEnd: function (evt) {
            // Only show save button if we reordered within the same folder
            if (evt.to === evt.from) {
                btnSaveOrder.classList.remove('hidden');
                btnSaveOrder.classList.add('animate-pulse');
            }
        }
    });
}

async function moveToFolder(articleId, targetFolderId, targetFolderTitle, skipRender = false) {
    // Optimistic UI Update
    const article = allArticles.find(a => a.id === articleId);
    if (article) {
        article.series_id = targetFolderId;
        article.series = targetFolderTitle;
    }

    // Save to DB
    const { error } = await supabase.from('articles')
        .update({ series_id: targetFolderId, series: targetFolderTitle })
        .eq('id', articleId);

    if (error) {
        alert("Failed to move article: " + error.message);
        if (!skipRender) await loadData(); // Reload from source on fail
    } else {
        if (!skipRender) {
            renderFolders(); // Update counts
            renderArticles(activeFolderId); // Re-render current view to snap article back if dragged incorrectly
        }
    }
}

btnSaveOrder.addEventListener('click', async () => {
    btnSaveOrder.innerText = "[ SAVING... ]";
    btnSaveOrder.classList.remove('animate-pulse');

    const items = Array.from(articlesContainer.children);
    let updates = [];

    items.forEach((item, index) => {
        const id = item.dataset.articleId;
        if (id) {
            updates.push({ id, order_index: index });
        }
    });

    let successCount = 0;
    for (const u of updates) {
        // Individual updates until batch RPC is available
        const { error } = await supabase.from('articles').update({ order_index: u.order_index }).eq('id', u.id);
        if (!error) successCount++;
    }

    // Update local memory
    for (const u of updates) {
        const a = allArticles.find(art => art.id === u.id);
        if (a) a.order_index = u.order_index;
    }

    // Re-sort local memory and re-render
    allArticles.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    renderArticles(activeFolderId);

    btnSaveOrder.innerText = "[ SAVE NEW SORT ORDER ]";
    btnSaveOrder.classList.add('hidden');
});

// Create New Folder Protocol
if (btnNewFolder) {
    btnNewFolder.addEventListener('click', async () => {
        const newFolderName = prompt("ENTER SYSTEM DESIGNATION FOR NEW MASTER FOLDER:");
        if (!newFolderName || newFolderName.trim() === '') return;

        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);

        const { data, error } = await supabase
            .from('series')
            .insert([{ title: newFolderName.trim(), order_index: maxOrder + 1 }])
            .select();

        if (error) {
            alert("SYSTEM ERROR: Failed to forge directory. " + error.message);
        } else {
            // Reload EVERYTHING to ensure state sync
            await loadData();
            if (data && data.length > 0) {
                renderArticles(data[0].id); // Auto-jump into the new empty folder
            }
        }
    });
}

if (btnSaveFolderOrder) {
    btnSaveFolderOrder.addEventListener('click', async () => {
        btnSaveFolderOrder.innerText = "[ SAVING... ]";
        btnSaveFolderOrder.classList.remove('animate-pulse');

        const items = Array.from(foldersContainer.children);
        let updates = [];

        // The first item is Unassigned Singles (index 0 visually), we ignore it for DB updates
        // So we start index mapping at 0 for the actual database series
        let dbIndex = 0;

        items.forEach((item) => {
            const id = item.dataset.folderId;
            if (id && id !== "unassigned") {
                updates.push({ id, order_index: dbIndex });
                dbIndex++;
            }
        });

        let successCount = 0;
        for (const u of updates) {
            const { error } = await supabase.from('series').update({ order_index: u.order_index }).eq('id', u.id);
            if (!error) successCount++;
        }

        for (const u of updates) {
            const s = masterSeries.find(series => series.id === u.id);
            if (s) s.order_index = u.order_index;
        }

        masterSeries.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        renderFolders();

        btnSaveFolderOrder.innerText = "SAVE ORDER";
        btnSaveFolderOrder.classList.add('hidden');
    });
}
// Sync Timeline Logic
const btnSyncTimeline = document.getElementById('btn-sync-timeline');
if (btnSyncTimeline) {
    btnSyncTimeline.addEventListener('click', () => {
        if (!allArticles || allArticles.length === 0) return;

        // Create subset in active folder
        let subset = allArticles.filter(a => activeFolderId === null ? !a.series_id : a.series_id === activeFolderId);
        if (subset.length === 0) return;

        // Sort subset by post_date ascending (oldest to newest)
        subset.sort((a, b) => {
            const dateA = new Date(a.post_date || 0);
            const dateB = new Date(b.post_date || 0);
            return dateA - dateB;
        });

        // Reassign strictly sequential order_index to subset in memory
        subset.forEach((a, idx) => {
            a.order_index = idx;
        });

        // Re-sort global memory based on new order_index and render
        allArticles.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        renderArticles(activeFolderId);

        // Flash UI feedback and enable Save button
        btnSyncTimeline.innerText = "[ SYNCED ]";
        setTimeout(() => { btnSyncTimeline.innerText = "SYNC TIMELINE"; }, 2000);

        btnSaveOrder.classList.remove('hidden');
        btnSaveOrder.classList.add('animate-pulse');
    });
}

// Search Logic
const matrixSearchInput = document.getElementById('matrix-search');
if (matrixSearchInput) {
    matrixSearchInput.addEventListener('input', (e) => {
        matrixSearchQuery = e.target.value;
        renderArticles(activeFolderId);
    });
}

// Boot
window.onload = bootstrap;

import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

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
const btnNewHeading = document.getElementById('btn-new-heading');
const btnSaveFolderOrder = document.getElementById('btn-save-folder-order');

// Sortable Instances
let articlesSortable = null;
let foldersSortable = null;

// ============================================
// CUSTOM PROMPT MODALS
// ============================================

function sovereignPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('sovereign-modal');
        const title = document.getElementById('modal-title');
        const input = document.getElementById('modal-input');
        const btnCancel = document.getElementById('modal-btn-cancel');
        const btnConfirm = document.getElementById('modal-btn-confirm');

        title.innerText = message;
        input.classList.remove('hidden');
        input.value = defaultValue;
        modal.classList.remove('hidden');
        input.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
            input.removeEventListener('keydown', onKeydown);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onConfirm = () => { cleanup(); resolve(input.value); };
        const onKeydown = (e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        input.addEventListener('keydown', onKeydown);
    });
}

function sovereignConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('sovereign-modal');
        const title = document.getElementById('modal-title');
        const input = document.getElementById('modal-input');
        const btnCancel = document.getElementById('modal-btn-cancel');
        const btnConfirm = document.getElementById('modal-btn-confirm');

        title.innerText = message;
        input.classList.add('hidden'); // Hide input for yes/no confirms
        input.value = '';
        modal.classList.remove('hidden');

        const cleanup = () => {
            modal.classList.add('hidden');
            input.classList.remove('hidden'); // reset for future prompts
            btnCancel.removeEventListener('click', onCancel);
            btnConfirm.removeEventListener('click', onConfirm);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onConfirm = () => { cleanup(); resolve(true); };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
    });
}

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

    masterSeries.forEach(s => {
        if (s.title === '[HEADING ONLY]') {
            const cat = s.category_label || 'UNCATEGORIZED';
            const head = document.createElement('div');
            head.className = "cat-heading pt-10 pb-6 border-b border-matrix-border group relative cursor-grab bg-transparent transition-colors";
            head.dataset.folderId = s.id;

            head.innerHTML = `
                <div class="flex items-start justify-between mb-1 w-full">
                    <div class="flex items-start px-4 min-w-0 flex-1">
                        <h3 class="text-base text-matrix-green font-bold tracking-[0.2em] uppercase break-words">${cat}</h3>
                    </div>
                    <div class="flex gap-4 pr-2 opacity-100 z-10 relative">
                        <button class="btn-edit-folder text-sm font-bold text-matrix-green/70 hover:text-matrix-green hover:underline transition-colors">[EDIT]</button>
                        <button class="btn-del-folder text-sm font-bold text-matrix-green/70 hover:text-red-500 hover:underline transition-colors">[DEL]</button>
                    </div>
                </div>
            `;

            // Explicit Event Listeners
            head.querySelector('.btn-edit-folder').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.editFolder(s.id);
            });

            head.querySelector('.btn-del-folder').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.deleteFolder(s.id, true);
            });

            foldersContainer.appendChild(head);
        } else {
            const el = document.createElement('div');
            el.className = `p-3 mb-2 flex flex-col cursor-pointer border transition-colors relative group ${activeFolderId === s.id ? 'bg-matrix-green text-black border-matrix-green' : 'bg-transparent text-matrix-text border-matrix-border hover:border-matrix-green'}`;
            el.dataset.folderId = s.id;

            // Explicit Event Listener for the main folder body
            el.addEventListener('click', () => {
                renderArticles(s.id);
            });

            let count = allArticles.filter(a => a.series_id === s.id).length;

            el.innerHTML = `
                <div class="flex justify-between items-start mb-2 z-10 relative w-full">
                    <div class="flex items-start px-2 min-w-0 flex-1 pr-2">
                        <span class="uppercase font-bold tracking-widest text-lg break-words" style="${activeFolderId === s.id ? 'color: #000;' : ''}">${s.title}</span>
                    </div>
                    <div class="flex gap-4 opacity-100 z-20 relative shrink-0">
                        <button class="btn-edit-folder text-sm font-bold transition-all" style="${activeFolderId === s.id ? 'color: rgba(0,0,0,0.6); text-shadow: 0 0 2px rgba(0,0,0,0.3);' : 'color: rgba(34, 197, 94, 0.7);'}">[EDIT]</button>
                        <button class="btn-del-folder text-sm font-bold transition-all" style="${activeFolderId === s.id ? 'color: rgba(0,0,0,0.6); text-shadow: 0 0 2px rgba(153,27,27,0.3);' : 'color: rgba(34, 197, 94, 0.7);'}">[DEL]</button>
                    </div>
                </div>
                <span class="text-xs uppercase tracking-widest pl-2 pointer-events-none w-full block relative z-10" style="${activeFolderId === s.id ? 'color: rgba(0,0,0,0.7); font-weight: 700;' : 'color: #6b7280;'}">${count} Records</span>
                
                <div class="w-full mt-2 pt-1 border-t border-matrix-border/20 flex flex-col items-center justify-center opacity-30 pointer-events-none relative z-10">
                    <span class="text-[8px] tracking-[0.5em] font-bold">||||</span>
                </div>

                <div class="drag-blocker absolute top-0 left-0 w-full h-[80%] z-0 cursor-pointer" title="Grab folder from the bottom grip zone to drag"></div>
            `;

            // Explicit Event Listeners
            el.querySelector('.btn-edit-folder').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.editFolder(s.id);
            });

            el.querySelector('.btn-del-folder').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.deleteFolder(s.id);
            });

            new Sortable(el, {
                group: 'articles-group',
                onAdd: async function (evt) {
                    const draggedItems = (evt.items && evt.items.length > 0) ? evt.items : [evt.item];
                    for (let item of draggedItems) {
                        const articleId = item.dataset.articleId;
                        if (articleId) await moveToFolder(articleId, s.id, s.title, true);
                    }
                    renderFolders();
                    renderArticles(activeFolderId);
                }
            });
            foldersContainer.appendChild(el);
        }
    });

    if (foldersSortable) {
        foldersSortable.destroy();
    }

    foldersSortable = new Sortable(foldersContainer, {
        group: 'folders-group',
        animation: 150,
        filter: '.drag-blocker',
        preventOnFilter: false, // Let clicks pass through the blocker to activate the folder
        direction: 'vertical',
        invertSwap: true,
        swapThreshold: 0.65,
        emptyInsertThreshold: 20,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        onMove: function (evt) {
            // Manually lock 'Unassigned' instead of using the buggy filter property
            if (evt.dragged.dataset.folderId === "unassigned" || evt.related.dataset.folderId === "unassigned") {
                return false;
            }
        },
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

    // Re-highlight left panel by fully reconstructing the DOM state
    renderFolders();

    articlesContainer.innerHTML = '';

    if (filtered.length === 0) {
        articlesContainer.innerHTML = '<div class="text-[10px] text-matrix-green/50 animate-pulse uppercase tracking-[0.2em] p-4 text-center border border-matrix-border/50 bg-matrix-green/5">Zone Empty. No records located.</div>';
        return;
    }

    filtered.forEach((a, idx) => {
        const dateStr = a.post_date ? new Date(a.post_date).toLocaleDateString() : 'UNKNOWN_DATE';
        const el = document.createElement('div');
        el.dataset.articleId = a.id;
        el.className = 'bg-matrix-panel border border-matrix-border p-4 flex flex-col gap-2 hover:bg-matrix-green/5 transition-colors group relative pl-10'; // Added pl-10 for handle space

        el.innerHTML = `
            <div class="drag-handle absolute left-0 top-0 bottom-0 w-8 border-r border-matrix-border bg-black/20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-matrix-green/20 hover:text-matrix-green transition-colors text-matrix-muted text-xs">
                ⋮⋮
            </div>
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
        handle: '.drag-handle', // <--- THIS is what fixes the finicky touches
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

    // Provide clear success feedback
    btnSaveOrder.innerText = "[ SORT ORDER SAVED ]";
    btnSaveOrder.classList.add('bg-white', 'text-black');
    setTimeout(() => {
        btnSaveOrder.innerText = "[ SAVE NEW SORT ORDER ]";
        btnSaveOrder.classList.remove('bg-white', 'text-black');
        btnSaveOrder.classList.add('hidden');
    }, 2000);
});

// ============================================
// SYSTEM COMMANDS: EDIT & DELETE FOLDERS/HEADINGS
// ============================================

window.editFolder = async (id) => {
    const s = masterSeries.find(series => series.id === id);
    if (!s) return;

    let newVal;
    if (s.title === '[HEADING ONLY]') {
        newVal = await sovereignPrompt("EDIT CATEGORY HEADING DESIGNATION:", s.category_label || '');
        if (!newVal || newVal.trim() === '' || newVal === s.category_label) return;

        const { error } = await supabase.from('series').update({ category_label: newVal.trim() }).eq('id', id);
        if (error) alert("SYSTEM ERROR: Failed to modify heading. " + error.message);
        else loadData(); // Reload UI
    } else {
        newVal = await sovereignPrompt("EDIT MASTER FOLDER DESIGNATION:", s.title);
        if (!newVal || newVal.trim() === '' || newVal === s.title) return;

        const { error } = await supabase.from('series').update({ title: newVal.trim() }).eq('id', id);
        if (error) alert("SYSTEM ERROR: Failed to modify directory. " + error.message);
        else loadData(); // Reload UI
    }
};

window.deleteFolder = async (id, isHeading = false) => {
    const s = masterSeries.find(series => series.id === id);
    if (!s) return;

    // Check if folder contains articles (safety lock)
    let count = allArticles.filter(a => a.series_id === id).length;
    if (count > 0 && !isHeading) {
        alert(`SYSTEM LOCK: Directory contains ${count} records. Empty the directory before deletion.`);
        return;
    }

    const typeStr = isHeading ? "CATEGORY HEADING" : "MASTER FOLDER";
    const nameStr = isHeading ? s.category_label : s.title;

    const isConfirmed = await sovereignConfirm(`CRITICAL WARNING: Are you sure you wish to delete ${typeStr}: [ ${nameStr} ] ?`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('series').delete().eq('id', id);

    if (error) {
        alert("SYSTEM ERROR: Failed to delete structure. " + error.message);
    } else {
        if (activeFolderId === id) activeFolderId = null; // Reset focus if they deleted what they were looking at
        loadData(); // Sync UI
    }
};

// Create New Heading Protocol
if (btnNewHeading) {
    btnNewHeading.addEventListener('click', async () => {
        const catLabel = await sovereignPrompt("ENTER NEW CATEGORY HEADING (e.g. 'CORE DOCTRINE'):");
        if (!catLabel || catLabel.trim() === '') return;

        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);

        // We insert a "ghost" folder where the title is just a placeholder, but the category_label drives the UI heading
        const { data, error } = await supabase
            .from('series')
            .insert([{
                title: '[HEADING ONLY]',
                category_label: catLabel.trim(),
                order_index: maxOrder + 1
            }])
            .select();

        if (error) {
            alert("SYSTEM ERROR: Failed to forge heading. " + error.message);
        } else {
            await loadData();
            setTimeout(() => { foldersContainer.scrollTop = foldersContainer.scrollHeight; }, 100);
        }
    });
}

// Create New Folder Protocol
if (btnNewFolder) {
    btnNewFolder.addEventListener('click', async () => {
        const newFolderName = await sovereignPrompt("ENTER SYSTEM DESIGNATION FOR NEW MASTER FOLDER:");
        if (!newFolderName || newFolderName.trim() === '') return;

        // Auto-inherit the category of the last item in the list, or default to UNCATEGORIZED
        let defaultCat = 'UNCATEGORIZED';
        if (masterSeries.length > 0) {
            const lastSeries = masterSeries[masterSeries.length - 1];
            defaultCat = lastSeries.category_label || 'UNCATEGORIZED';
        }

        const maxOrder = masterSeries.reduce((max, s) => Math.max(max, s.order_index || 0), 0);

        const { data, error } = await supabase
            .from('series')
            .insert([{
                title: newFolderName.trim(),
                category_label: defaultCat, // Inherits the current section's category
                order_index: maxOrder + 1
            }])
            .select();

        if (error) {
            alert("SYSTEM ERROR: Failed to forge directory. " + error.message);
        } else {
            // Reload EVERYTHING to ensure state sync
            await loadData();
            if (data && data.length > 0) {
                renderArticles(data[0].id); // Auto-jump into the new empty folder

                // Ensure the user sees it at the bottom of the list
                setTimeout(() => {
                    foldersContainer.scrollTop = foldersContainer.scrollHeight;
                }, 100);
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
        let currentCategory = 'UNCATEGORIZED'; // Track the latest heading seen in the list

        items.forEach((item) => {
            const id = item.dataset.folderId;
            if (!id || id === "unassigned") return;

            const s = masterSeries.find(series => series.id === id);
            if (!s) return;

            if (s.title === '[HEADING ONLY]') {
                // If we pass a Ghost Folder, we update currentCategory
                currentCategory = s.category_label || 'UNCATEGORIZED';
                updates.push({ id, order_index: dbIndex, category_label: currentCategory });
            } else {
                // Regular folder gets the Category of the Ghost Folder above it
                updates.push({ id, order_index: dbIndex, category_label: currentCategory });
            }
            dbIndex++;
        });

        let successCount = 0;
        for (const u of updates) {
            const { error } = await supabase.from('series').update({
                order_index: u.order_index,
                category_label: u.category_label // Apply the new inherited categorical binding
            }).eq('id', u.id);
            if (!error) successCount++;
        }

        for (const u of updates) {
            const s = masterSeries.find(series => series.id === u.id);
            if (s) {
                s.order_index = u.order_index;
                s.category_label = u.category_label; // Update local memory
            }
        }

        masterSeries.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        renderFolders();

        // Provide clear success feedback
        btnSaveFolderOrder.innerText = "[ SAVED ]";
        btnSaveFolderOrder.classList.add('bg-white', 'text-black');
        setTimeout(() => {
            btnSaveFolderOrder.innerText = "SAVE ORDER";
            btnSaveFolderOrder.classList.remove('bg-white', 'text-black');
            btnSaveFolderOrder.classList.add('hidden');
        }, 2000);
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

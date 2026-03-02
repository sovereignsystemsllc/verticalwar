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

window.editFolder = async function (folderId) {
    const s = masterSeries.find(x => x.id === folderId);
    if (!s) return;

    const newTitle = prompt("EDIT FOLDER DESIGNATION:", s.title);
    if (newTitle === null) return;

    const newCategory = prompt("EDIT CATEGORY LABEL (e.g. 'CORE DOCTRINE'):", s.category_label || '');
    if (newCategory === null) return;

    const { error } = await supabase.from('series')
        .update({
            title: newTitle.trim(),
            category_label: newCategory.trim() || null
        })
        .eq('id', folderId);

    if (error) {
        alert("ERROR: " + error.message);
    } else {
        await loadData();
    }
}

window.deleteFolder = async function (folderId, isHeading = false) {
    const s = masterSeries.find(x => x.id === folderId);
    if (!s) return;

    // Safety check: Does this folder have articles?
    const articleCount = allArticles.filter(a => a.series_id === folderId).length;

    if (articleCount > 0) {
        alert(`ACCESS DENIED: Cannot delete directory. It contains ${articleCount} records. Move or delete the records first.`);
        return;
    }

    const confirmMsg = isHeading ?
        `WARNING: Delete structural heading '${s.category_label}'?` :
        `WARNING: Delete empty master directory '${s.title}'?`;

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase.from('series').delete().eq('id', folderId);

    if (error) {
        alert("ERROR: Failed to delete. " + error.message);
    } else {
        // If we deleted the active folder, reset to unassigned
        if (activeFolderId === folderId) {
            activeFolderId = null;
        }
        await loadData();
    }
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

    // Dynamic Master Folders
    let currentCategory = undefined;

    masterSeries.forEach(s => {
        const cat = s.category_label || 'UNCATEGORIZED';
        if (cat !== currentCategory) {
            const head = document.createElement('div');
            head.className = "cat-heading mt-6 mb-2 border-b border-matrix-border pb-1 pointer-events-none group relative";

            // If this heading is powered by a ghost folder, give it edit/delete controls
            let headingControls = '';
            if (s.title === '[HEADING ONLY]') {
                headingControls = `
                    <div class="absolute right-0 top-0 flex gap-2 pointer-events-auto">
                        <button class="text-[8px] text-matrix-muted hover:text-matrix-green hover:underline transition-colors" onclick="event.stopPropagation(); window.editFolder('${s.id}')">[ EDIT ]</button>
                        <button class="text-[8px] text-matrix-muted hover:text-red-500 hover:underline transition-colors" onclick="event.stopPropagation(); window.deleteFolder('${s.id}', true)">[ DEL ]</button>
                    </div>
                `;
            }

            head.innerHTML = `
                ${headingControls}
                <h3 class="text-[10px] text-matrix-green/50 font-bold tracking-[0.2em] uppercase px-3 pointer-events-auto">${cat}</h3>
            `;
            foldersContainer.appendChild(head);
            currentCategory = cat;
        }

        // If this series entry is JUST a heading placeholder, do not render a folder for it
        if (s.title === '[HEADING ONLY]') return;

        const el = document.createElement('div');
        el.className = `p-3 mb-2 flex flex-col cursor-pointer border transition-colors relative group ${activeFolderId === s.id ? 'bg-matrix-green text-black border-matrix-green' : 'bg-transparent text-matrix-text border-matrix-border hover:border-matrix-green'}`;

        let count = allArticles.filter(a => a.series_id === s.id).length;

        const catHtml = s.category_label ? `<span class="text-[8px] ${activeFolderId === s.id ? 'text-black/70' : 'text-matrix-green/70'} tracking-[0.2em] uppercase mb-1 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]">[ ${s.category_label} ]</span>` : '';

        // Added permanently visible edit/delete controls instead of hover-only
        el.innerHTML = `
            <div class="absolute top-2 right-2 flex flex-col items-end gap-1">
                <button class="text-[8px] ${activeFolderId === s.id ? 'text-black/70 hover:text-black' : 'text-matrix-muted hover:text-matrix-green hover:underline'} transition-colors" onclick="event.stopPropagation(); window.editFolder('${s.id}')">[ EDIT ]</button>
                <button class="text-[8px] ${activeFolderId === s.id ? 'text-black/70 hover:text-red-900' : 'text-matrix-muted hover:text-red-500 hover:underline'} transition-colors" onclick="event.stopPropagation(); window.deleteFolder('${s.id}')">[ DEL ]</button>
            </div>
            ${catHtml}
            <span class="uppercase font-bold tracking-widest text-xs mb-1 pr-12">${s.title}</span>
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
        filter: '[data-folder-id="unassigned"], .cat-heading', // Don't let the unassigned folder or headings be dragged
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
        // Skip heading blocks entirely to prevent them from taking active styling or passing bad IDs
        if (child.classList.contains('cat-heading')) return;

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

// Create New Heading Protocol
if (btnNewHeading) {
    btnNewHeading.addEventListener('click', async () => {
        const catLabel = prompt("ENTER NEW CATEGORY HEADING (e.g. 'CORE DOCTRINE'):");
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
        const newFolderName = prompt("ENTER SYSTEM DESIGNATION FOR NEW MASTER FOLDER:");
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
            // Is it a heading?
            if (item.classList.contains('cat-heading')) {
                const headingText = item.querySelector('h3').innerText;
                currentCategory = headingText;
                return; // Headings aren't folders, we don't save their order here (they are bound to ghost folders currently)
            }

            const id = item.dataset.folderId;
            if (id && id !== "unassigned") {
                // If this is a ghost folder driving a heading, its category IS its purpose.
                // We overwrite its order index. 
                const s = masterSeries.find(series => series.id === id);
                if (s && s.title === '[HEADING ONLY]') {
                    updates.push({ id, order_index: dbIndex, category_label: s.category_label });
                } else {
                    // This is a real folder. Bind it to whatever heading we most recently passed.
                    updates.push({ id, order_index: dbIndex, category_label: currentCategory });
                }
                dbIndex++;
            }
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

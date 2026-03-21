import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');
const assetGrid = document.getElementById('asset-grid');
const emptyState = document.getElementById('empty-state');
const assetCount = document.getElementById('asset-count');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const refreshBtn = document.getElementById('refresh-btn');
const uploadLogWrap = document.getElementById('upload-log-wrap');
const uploadLog = document.getElementById('upload-log');
const uploadProgress = document.getElementById('upload-progress');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

// Pagination & Search Overlays
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const currentPageDisplay = document.getElementById('current-page-display');

const BUCKET = 'article_assets';
const PAGE_SIZE = 24;
let currentPage = 0;
let currentSearch = '';
// currentUser imported from auth.js

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.className = `fixed bottom-8 right-8 z-50 rounded-xl px-6 py-4 border shadow-2xl backdrop-blur-xl text-sm font-semibold text-white pointer-events-none flex items-center gap-3 transition-opacity duration-300 ${isError ? 'bg-red-500/20 border-red-500/30' : 'bg-blue-500/20 border-blue-500/30'} opacity-100`;
    
    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => toast.className = 'fixed bottom-8 right-8 z-50 hidden rounded-xl px-6 py-4 border shadow-2xl backdrop-blur-xl opacity-0 text-sm font-semibold text-white pointer-events-none flex items-center gap-3', 300);
    }, 3000);
}

// ─── UPLOAD LOG ───────────────────────────────────────────────────────────────
function logUpload(filename, statusStr, isError = false) {
    uploadLogWrap.classList.remove('hidden');
    let colorClass = 'text-blue-400';
    let labelBg = 'bg-blue-500/10 border-blue-500/20 text-blue-400';

    if (isError || statusStr === 'ERROR' || statusStr === 'DENIED') {
        colorClass = 'text-red-400';
        labelBg = 'bg-red-500/10 border-red-500/20 text-red-500';
    } else if (statusStr === 'SUCCESS') {
        colorClass = 'text-gray-300';
        labelBg = 'bg-green-500/10 border-green-500/20 text-green-500';
    }

    const li = document.createElement('li');
    li.className = `flex flex-col py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors rounded-lg px-2`;

    li.innerHTML = `<div class="flex justify-between items-start w-full gap-4">
        <span class="font-medium flex items-start gap-2 max-w-[70%] leading-snug ${colorClass}">
            <span class="text-blue-500 shrink-0 select-none font-bold">→</span>
            <span class="break-all tracking-tight">${filename}</span>
        </span>
        <span class="text-[10px] tracking-widest font-bold uppercase shrink-0 px-2.5 py-1 rounded-md border shadow-inner ${labelBg}">
            ${statusStr}
        </span>
    </div>`;

    uploadLog.prepend(li);
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        authStatusTitle.innerText = 'CLEARANCE REJECTED';
        authStatusDetail.innerText = `Role '${currentRole}' lacks Sovereign access.`;
        return;
    }
    authLock.style.opacity = '0';
    authLock.style.transition = 'opacity 0.4s';
    setTimeout(() => { authLock.style.display = 'none'; }, 450);
    loadAssets();
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

// ─── LOAD ASSETS FROM BUCKET ──────────────────────────────────────────────────
async function loadAssets() {
    assetGrid.innerHTML = '';
    emptyState.classList.add('hidden');
    assetCount.textContent = 'LOADING...';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;

    const options = {
        limit: PAGE_SIZE + 1, // Fetch N+1 to check if there is a Next Page pending
        offset: currentPage * PAGE_SIZE,
        sortBy: { column: 'created_at', order: 'desc' }
    };

    if (currentSearch.trim() !== '') {
        options.search = currentSearch.trim();
    }

    const { data: files, error } = await supabase.storage.from(BUCKET).list('', options);

    if (error) {
        showToast('Failed to load bucket: ' + error.message, true);
        assetCount.textContent = 'ERROR';
        return;
    }

    // Filter out any directory placeholder files
    const realFiles = (files || []).filter(f => f.name !== '.emptyFolderPlaceholder');
    
    const hasNextPage = realFiles.length > PAGE_SIZE;
    const pageFiles = realFiles.slice(0, PAGE_SIZE);

    const startItem = (currentPage * PAGE_SIZE) + (pageFiles.length > 0 ? 1 : 0);
    const endItem = (currentPage * PAGE_SIZE) + pageFiles.length;
    assetCount.textContent = `${startItem}-${endItem}`;
    currentPageDisplay.textContent = currentPage + 1;

    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = !hasNextPage;

    if (pageFiles.length === 0) {
        emptyState.classList.remove('hidden');
        if (currentSearch.trim() !== '') {
            emptyState.querySelector('p.text-2xl').textContent = 'No Matches';
            emptyState.querySelector('p.text-sm').textContent = `No artifacts found matching "${currentSearch.trim()}".`;
        } else {
            emptyState.querySelector('p.text-2xl').textContent = 'Vault Empty';
            emptyState.querySelector('p.text-sm').textContent = 'No artifacts found in the storage bucket. Drop files above to populate your gallery.';
        }
        return;
    }

    pageFiles.forEach(file => renderCard(file));
}

// ─── RENDER ONE ASSET CARD ─────────────────────────────────────────────────────
function renderCard(file) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
    const publicUrl = urlData?.publicUrl || '';

    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);

    const card = document.createElement('div');
    card.className = 'bg-[#0a0a0c] border border-white/5 rounded-2xl flex flex-col group relative overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/40 transition-all duration-300';
    card.dataset.name = file.name;

    const previewHtml = isImage
        ? `<img src="${publicUrl}" alt="${file.name}" class="w-full h-40 object-cover bg-[#050505] group-hover:scale-105 transition-transform duration-500" loading="lazy">`
        : `<div class="w-full h-40 flex items-center justify-center bg-[#050505] text-4xl group-hover:scale-105 transition-transform duration-500">📄</div>`;

    const sizeKb = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) + ' KB' : '—';

    card.innerHTML = `
        <div class="overflow-hidden w-full h-40 relative">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent z-10 pointer-events-none opacity-80"></div>
            ${previewHtml}
        </div>
        <div class="p-4 flex-1 flex flex-col gap-1 z-20 -mt-8 relative">
            <p class="text-sm font-semibold text-gray-200 tracking-tight truncate drop-shadow-md" title="${file.name}">${file.name}</p>
            <p class="text-[10px] text-blue-400 font-bold tracking-widest uppercase">${sizeKb}</p>
        </div>
        
        <!-- Actions Overlay -->
        <div class="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm z-30 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button class="btn-copy bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 active:scale-95" data-url="${publicUrl}" title="Copy Link">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
            <button class="btn-delete bg-red-500 hover:bg-red-400 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 active:scale-95" data-name="${file.name}" title="Purge Artifact">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `;

    // Copy URL
    card.querySelector('.btn-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(publicUrl).then(() => showToast('Artifact URL copied!'));
    });

    // Delete file
    card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Permanently purge "${file.name}"?`)) return;
        const { error } = await supabase.storage.from(BUCKET).remove([file.name]);
        if (error) {
            showToast('Purge failed: ' + error.message, true);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                showToast(`Artifact purged.`);
                loadAssets(); // Refresh from backend to reflow pagination
            }, 300);
        }
    });

    assetGrid.appendChild(card);
}

// ─── FILE UPLOAD HANDLER ───────────────────────────────────────────────────────
async function uploadFiles(files) {
    if (!currentUser) { showToast('Sovereign auth required.', true); return; }
    if (!files || files.length === 0) return;

    const total = files.length;
    let done = 0;

    uploadProgress.style.width = '0%';

    for (const file of Array.from(files)) {
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        logUpload(safeName, 'UPLOADING');

        const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
            cacheControl: '3600',
            upsert: true
        });

        done++;
        uploadProgress.style.width = `${(done / total) * 100}%`;

        if (error) {
            logUpload(safeName, 'ERROR', true);
            showToast(`Upload failed: ${error.message}`, true);
        } else {
            logUpload(safeName, 'SUCCESS');
        }
    }

    setTimeout(() => { uploadProgress.style.width = '0%'; }, 1500);
    showToast(`${done} artifact${done !== 1 ? 's' : ''} deployed to vault.`);
    
    // Jump to Page 1, clear search, and dynamically reload the freshest grid
    fileInput.value = '';
    currentSearch = '';
    searchInput.value = '';
    currentPage = 0;
    
    loadAssets();
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
dropZone.addEventListener('click', () => {
    if (!currentUser) return;
    fileInput.click();
});

fileInput.addEventListener('change', (e) => uploadFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (currentUser) dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (!currentUser) { showToast('Sovereign clearance required.', true); return; }
    await uploadFiles(e.dataTransfer.files);
});

refreshBtn.addEventListener('click', () => {
    currentPage = 0;
    loadAssets();
});

// Search Debounce Engine
searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 0; // Reset to page 1 on new search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(loadAssets, 400);
});

// Pagination Navigation
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        loadAssets();
    }
});

nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadAssets();
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

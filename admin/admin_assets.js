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

const BUCKET = 'article_assets';
// currentUser imported from auth.js

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.classList.remove('hidden', 'opacity-0', 'bg-blue-600', 'bg-red-600');
    toast.classList.add(isError ? 'bg-red-600' : 'bg-blue-600');
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// ─── UPLOAD LOG ───────────────────────────────────────────────────────────────
function logUpload(filename, status, isError = false) {
    uploadLogWrap.classList.remove('hidden');
    const li = document.createElement('li');
    li.className = `flex justify-between ${isError ? 'text-red-400' : 'text-blue-300'}`;
    li.innerHTML = `<span>> ${filename}</span><span class="tracking-widest">[${status}]</span>`;
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

    const { data: files, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 500,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
        showToast('Failed to load bucket: ' + error.message, true);
        assetCount.textContent = 'ERROR';
        return;
    }

    // Filter out any directory placeholder files
    const realFiles = (files || []).filter(f => f.name !== '.emptyFolderPlaceholder');

    assetCount.textContent = `${realFiles.length} ARTIFACT${realFiles.length !== 1 ? 'S' : ''} STORED`;

    if (realFiles.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    realFiles.forEach(file => renderCard(file));
}

// ─── RENDER ONE ASSET CARD ─────────────────────────────────────────────────────
function renderCard(file) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
    const publicUrl = urlData?.publicUrl || '';

    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);

    const card = document.createElement('div');
    card.className = 'asset-card rounded-sm group flex flex-col';
    card.dataset.name = file.name;

    const previewHtml = isImage
        ? `<img src="${publicUrl}" alt="${file.name}" class="w-full h-32 object-cover bg-black/40" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><text y=%2250%22 font-size=%2230%22>🖼️</text></svg>'">`
        : `<div class="w-full h-32 flex items-center justify-center bg-black/30 text-4xl">📄</div>`;

    const sizeKb = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) + ' KB' : '—';

    card.innerHTML = `
        ${previewHtml}
        <div class="p-2 flex-1 flex flex-col gap-1">
            <p class="text-[9px] text-white/70 tracking-wider truncate" title="${file.name}">${file.name}</p>
            <p class="text-[8px] text-blue-500/40 tracking-widest uppercase">${sizeKb}</p>
        </div>
        <div class="actions px-2 pb-2 flex gap-1">
            <button class="btn-copy btn-ghost flex-1 text-center" data-url="${publicUrl}">COPY</button>
            <button class="btn-delete btn-red flex-1 text-center" data-name="${file.name}">DEL</button>
        </div>
    `;

    // Copy URL
    card.querySelector('.btn-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(publicUrl).then(() => showToast('URL copied to clipboard!'));
    });

    // Delete file
    card.querySelector('.btn-delete').addEventListener('click', async () => {
        if (!confirm(`Delete "${file.name}" from the vault? This is permanent.`)) return;
        const { error } = await supabase.storage.from(BUCKET).remove([file.name]);
        if (error) {
            showToast('Delete failed: ' + error.message, true);
        } else {
            card.remove();
            showToast(`"${file.name}" has been purged.`);
            const remaining = assetGrid.querySelectorAll('.asset-card').length;
            assetCount.textContent = `${remaining} ARTIFACT${remaining !== 1 ? 'S' : ''} STORED`;
            if (remaining === 0) emptyState.classList.remove('hidden');
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
            // Inject the new card immediately
            const { data: { session } } = await supabase.auth.getSession();
            renderCard({ name: safeName, metadata: { size: file.size } });
            emptyState.classList.add('hidden');
        }
    }

    const total_stored = assetGrid.querySelectorAll('.asset-card').length;
    assetCount.textContent = `${total_stored} ARTIFACT${total_stored !== 1 ? 'S' : ''} STORED`;

    setTimeout(() => { uploadProgress.style.width = '0%'; }, 1500);
    showToast(`${done} file${done !== 1 ? 's' : ''} uploaded to vault.`);
    // Reset input
    fileInput.value = '';
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
browseBtn.addEventListener('click', () => {
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
    if (!currentUser) { showToast('Sovereign auth required.', true); return; }
    await uploadFiles(e.dataTransfer.files);
});

refreshBtn.addEventListener('click', loadAssets);

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

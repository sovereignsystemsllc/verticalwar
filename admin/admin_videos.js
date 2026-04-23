import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';
import { trackAction } from '../src/telemetry.js';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');

const videoListContainer = document.getElementById('video-list');
const searchInput = document.getElementById('search-input');
const filterCat = document.getElementById('filter-cat');

const editorEmpty = document.getElementById('editor-empty');
const editorForm = document.getElementById('editor-form');
const editorFooter = document.getElementById('editor-footer');
const btnCreateNew = document.getElementById('btn-create-new');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');

// Form fields
const fId = document.getElementById('video-id');
const fTitle = document.getElementById('video-title');
const fCat = document.getElementById('video-cat');
const fYtId = document.getElementById('video-ytid');
const fFeatured = document.getElementById('video-featured');
const fDesc = document.getElementById('video-desc');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

let allVideos = [];
let currentMode = 'NONE'; // 'CREATE', 'EDIT', 'NONE'

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.className = `fixed bottom-8 right-8 z-50 rounded-xl px-6 py-4 border shadow-2xl backdrop-blur-xl text-sm font-semibold text-white pointer-events-none flex items-center gap-3 transition-opacity duration-300 ${isError ? 'bg-red-500/20 border-red-500/30 text-red-100' : 'bg-rose-500/20 border-rose-500/30 text-rose-100'} opacity-100`;
    
    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => toast.className = 'fixed bottom-8 right-8 z-50 hidden rounded-xl px-6 py-4 border shadow-2xl backdrop-blur-xl opacity-0 text-sm font-semibold text-white pointer-events-none flex items-center gap-3', 300);
    }, 3000);
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        authStatusTitle.innerText = 'CLEARANCE REJECTED';
        authStatusDetail.innerText = `Role '${currentRole}' lacks Sovereign access.`;
        return;
    }
    authLock.style.opacity = '0';
    authLock.style.transition = 'opacity 0.4s';
    setTimeout(() => { authLock.style.display = 'none'; }, 450);
    loadVideos();
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

// ─── LOAD VIDEOS ──────────────────────────────────────────────────────────────
async function loadVideos() {
    videoListContainer.innerHTML = '<div class="text-center p-8 text-gray-500 text-sm animate-pulse">Syncing Transmissions...</div>';
    
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        showToast('Error loading videos: ' + error.message, true);
        videoListContainer.innerHTML = '<div class="text-center p-8 text-red-500 text-sm">Error syncing database.</div>';
        return;
    }

    allVideos = data || [];
    renderList();
}

function renderList() {
    const q = searchInput.value.toLowerCase();
    const c = filterCat.value;

    const filtered = allVideos.filter(video => {
        if (q && !video.title.toLowerCase().includes(q)) return false;
        if (c && video.category !== c) return false;
        return true;
    });

    videoListContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        videoListContainer.innerHTML = '<div class="text-center p-8 text-gray-500 text-sm">No transmissions match current filters.</div>';
        return;
    }

    filtered.forEach(video => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-rose-500/30 cursor-pointer transition-all ${fId.value === video.id ? 'active-video' : ''}`;
        div.dataset.id = video.id;
        
        let colorClass = 'text-gray-400';
        if(video.category === 'MONOLOGUE') colorClass = 'text-rose-400';
        if(video.category === 'TUTORIAL') colorClass = 'text-blue-400';
        if(video.category === 'DOCUMENTARY') colorClass = 'text-purple-400';
        if(video.category === 'TRANSMISSION') colorClass = 'text-amber-400';

        div.innerHTML = `
            <div class="font-bold text-gray-200 tracking-wide">${video.title} ${video.is_featured ? '<span class="text-rose-500 text-xs ml-1">★</span>' : ''}</div>
            <div class="flex gap-2 mt-1">
                <span class="text-[9px] uppercase tracking-widest font-bold ${colorClass}">${video.category}</span>
                <span class="text-[9px] uppercase tracking-widest text-gray-500">${new Date(video.created_at).toLocaleDateString()}</span>
            </div>
        `;

        div.addEventListener('click', () => loadVideoIntoEditor(video));
        videoListContainer.appendChild(div);
    });
}

// ─── EDITOR LOGIC ─────────────────────────────────────────────────────────────
function loadVideoIntoEditor(video) {
    currentMode = 'EDIT';
    editorEmpty.classList.add('hidden');
    editorForm.classList.remove('hidden');
    editorFooter.classList.remove('hidden');
    editorFooter.classList.add('flex');
    btnDelete.style.display = 'block';

    fId.value = video.id;
    fTitle.value = video.title || '';
    fCat.value = video.category || 'TRANSMISSION';
    fYtId.value = video.youtube_id || '';
    fFeatured.checked = !!video.is_featured;
    fDesc.value = video.content || '';

    renderList(); // updates active state
}

function initNewVideo() {
    currentMode = 'CREATE';
    editorEmpty.classList.add('hidden');
    editorForm.classList.remove('hidden');
    editorFooter.classList.remove('hidden');
    editorFooter.classList.add('flex');
    btnDelete.style.display = 'none'; // Don't show delete for new

    fId.value = '';
    fTitle.value = '';
    fCat.value = 'TRANSMISSION';
    fYtId.value = '';
    fFeatured.checked = false;
    fDesc.value = '';

    renderList(); // clears active state
}

// ─── SAVE / DELETE ────────────────────────────────────────────────────────────
btnSave.addEventListener('click', async () => {
    if (!fTitle.value || !fYtId.value || !fDesc.value) {
        showToast('Title, YouTube ID, and Description are required.', true);
        return;
    }

    const payload = {
        title: fTitle.value.trim(),
        category: fCat.value,
        youtube_id: fYtId.value.trim(),
        is_featured: fFeatured.checked,
        content: fDesc.value.trim(),
    };

    btnSave.textContent = 'SAVING...';
    btnSave.disabled = true;

    try {
        if (currentMode === 'EDIT' && fId.value) {
            // Update
            const { error } = await supabase.from('videos').update(payload).eq('id', fId.value);
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase.from('videos').insert([payload]);
            if (error) throw error;
        }

        showToast('Transmission saved successfully.');
        trackAction(
            currentMode === 'EDIT' ? 'video_updated' : 'video_created',
            { title: payload.title, cat: payload.category }
        );
        
        currentMode = 'EDIT';
        await loadVideos();
        // Set the active id based on title since we don't have the inserted ID readily without returning it
        const savedVideo = allVideos.find(v => v.title === payload.title);
        if (savedVideo) {
            fId.value = savedVideo.id;
            loadVideoIntoEditor(savedVideo);
        }
        
    } catch (e) {
        showToast('Error saving: ' + e.message, true);
    } finally {
        btnSave.textContent = 'Save Transmission';
        btnSave.disabled = false;
    }
});

btnDelete.addEventListener('click', async () => {
    if (!fId.value) return;
    if (!confirm(`Permanently delete transmission "${fTitle.value}"?`)) return;

    btnDelete.textContent = '...';
    btnDelete.disabled = true;

    const { error } = await supabase.from('videos').delete().eq('id', fId.value);
    
    if (error) {
        showToast('Error deleting: ' + error.message, true);
        btnDelete.textContent = 'Delete';
        btnDelete.disabled = false;
    } else {
        showToast('Transmission deleted.');
        trackAction('video_deleted', { video_id: fId.value, title: fTitle.value });
        editorForm.classList.add('hidden');
        editorFooter.classList.add('hidden');
        editorFooter.classList.remove('flex');
        editorEmpty.classList.remove('hidden');
        fId.value = '';
        btnDelete.textContent = 'Delete';
        btnDelete.disabled = false;
        await loadVideos();
    }
});

// ─── LISTENERS ────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderList);
filterCat.addEventListener('change', renderList);
btnCreateNew.addEventListener('click', initNewVideo);

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';
import { trackAction } from '../src/telemetry.js';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');

const termListContainer = document.getElementById('term-list');
const searchInput = document.getElementById('search-input');
const filterCat = document.getElementById('filter-cat');
const filterType = document.getElementById('filter-type');

const editorEmpty = document.getElementById('editor-empty');
const editorForm = document.getElementById('editor-form');
const editorFooter = document.getElementById('editor-footer');
const btnCreateNew = document.getElementById('btn-create-new');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');

// Form fields
const fOriginalId = document.getElementById('original-id');
const fId = document.getElementById('term-id');
const fTitle = document.getElementById('term-title');
const fCat = document.getElementById('term-cat');
const fType = document.getElementById('term-type');
const fImg = document.getElementById('term-img');
const fDef = document.getElementById('term-def');
const fLink = document.getElementById('term-link');
const fPersona = document.getElementById('term-persona');
const fColor = document.getElementById('term-color');
const fUnauthText = document.getElementById('term-unauth-text');

// Image upload
const imageDropzone = document.getElementById('image-dropzone');
const imagePreview = document.getElementById('image-preview');
const fileInput = document.getElementById('file-input');
const uploadProgress = document.getElementById('upload-progress');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

let allTerms = [];
let currentMode = 'NONE'; // 'CREATE', 'EDIT', 'NONE'

const BUCKET = 'article_assets';

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
    loadTerms();
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

// ─── LOAD TERMS ───────────────────────────────────────────────────────────────
async function loadTerms() {
    termListContainer.innerHTML = '<div class="text-center p-8 text-gray-500 text-sm animate-pulse">Syncing Lexicon...</div>';
    
    const { data, error } = await supabase
        .from('lexicon_terms')
        .select('*')
        .order('title', { ascending: true });

    if (error) {
        showToast('Error loading lexicon: ' + error.message, true);
        termListContainer.innerHTML = '<div class="text-center p-8 text-red-500 text-sm">Error syncing database.</div>';
        return;
    }

    allTerms = data || [];
    renderList();
}

function renderList() {
    const q = searchInput.value.toLowerCase();
    const c = filterCat.value;
    const t = filterType.value;

    const filtered = allTerms.filter(term => {
        if (q && !term.title.toLowerCase().includes(q) && !term.id.toLowerCase().includes(q)) return false;
        if (c && term.cat !== c) return false;
        if (t && term.type !== t) return false;
        return true;
    });

    termListContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        termListContainer.innerHTML = '<div class="text-center p-8 text-gray-500 text-sm">No terms match current filters.</div>';
        return;
    }

    filtered.forEach(term => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-rose-500/30 cursor-pointer transition-all ${fOriginalId.value === term.id ? 'active-term' : ''}`;
        div.dataset.id = term.id;
        
        let colorClass = 'text-gray-400';
        if(term.cat === 'PLATFORM') colorClass = 'text-rose-400';
        if(term.cat === 'PANTHEON') colorClass = 'text-purple-400';
        if(term.cat === 'ECONOMY') colorClass = 'text-amber-400';

        div.innerHTML = `
            <div class="font-bold text-gray-200 tracking-wide">${term.title}</div>
            <div class="flex gap-2 mt-1">
                <span class="text-[9px] uppercase tracking-widest font-bold ${colorClass}">${term.cat}</span>
                <span class="text-[9px] uppercase tracking-widest text-gray-500">${term.type}</span>
            </div>
        `;

        div.addEventListener('click', () => loadTermIntoEditor(term));
        termListContainer.appendChild(div);
    });
}

// ─── EDITOR LOGIC ─────────────────────────────────────────────────────────────
function loadTermIntoEditor(term) {
    currentMode = 'EDIT';
    editorEmpty.classList.add('hidden');
    editorForm.classList.remove('hidden');
    editorFooter.classList.remove('hidden');
    editorFooter.classList.add('flex');
    btnDelete.style.display = 'block';

    fOriginalId.value = term.id;
    fId.value = term.id;
    fTitle.value = term.title || '';
    fCat.value = term.cat || 'PLATFORM';
    fType.value = term.type || 'TRANSLATION';
    fImg.value = term.img || '';
    fDef.value = term.def || '';
    fLink.value = term.link || '';
    fPersona.value = term.unauthorized_persona || '';
    fColor.value = term.unauthorized_color || '';
    fUnauthText.value = term.unauthorized_text || '';

    updateImagePreview(term.img);
    renderList(); // updates active state
}

function initNewTerm() {
    currentMode = 'CREATE';
    editorEmpty.classList.add('hidden');
    editorForm.classList.remove('hidden');
    editorFooter.classList.remove('hidden');
    editorFooter.classList.add('flex');
    btnDelete.style.display = 'none'; // Don't show delete for new

    fOriginalId.value = '';
    fId.value = '';
    fTitle.value = '';
    fCat.value = 'PLATFORM';
    fType.value = 'TRANSLATION';
    fImg.value = '';
    fDef.value = '';
    fLink.value = '';
    fPersona.value = '';
    fColor.value = '';
    fUnauthText.value = '';

    updateImagePreview('');
    renderList(); // clears active state
}

function updateImagePreview(path) {
    if (path) {
        // If it starts with http, it's absolute. If it starts with /, it's relative.
        imagePreview.src = path;
        imagePreview.classList.remove('hidden');
    } else {
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
    }
}

fImg.addEventListener('input', () => updateImagePreview(fImg.value));

// ─── SAVE / DELETE ────────────────────────────────────────────────────────────
btnSave.addEventListener('click', async () => {
    if (!fId.value || !fTitle.value || !fDef.value) {
        showToast('ID, Title, and Definition are required.', true);
        return;
    }

    const payload = {
        id: fId.value.trim(),
        title: fTitle.value.trim(),
        cat: fCat.value,
        type: fType.value,
        img: fImg.value.trim() || null,
        def: fDef.value.trim(),
        link: fLink.value.trim() || null,
        unauthorized_persona: fPersona.value.trim() || null,
        unauthorized_color: fColor.value.trim() || null,
        unauthorized_text: fUnauthText.value.trim() || null
    };

    btnSave.textContent = 'SAVING...';
    btnSave.disabled = true;

    try {
        if (currentMode === 'EDIT' && fOriginalId.value && fOriginalId.value !== payload.id) {
            // ID changed, need to insert new and delete old
            const { error: insertErr } = await supabase.from('lexicon_terms').insert([payload]);
            if (insertErr) throw insertErr;
            const { error: delErr } = await supabase.from('lexicon_terms').delete().eq('id', fOriginalId.value);
            if (delErr) throw delErr;
        } else {
            // Upsert
            const { error } = await supabase.from('lexicon_terms').upsert([payload]);
            if (error) throw error;
        }

        showToast('Term saved successfully.');
        trackAction(
            currentMode === 'EDIT' ? 'lexicon_term_updated' : 'lexicon_term_created',
            { term_id: payload.id, cat: payload.cat }
        );
        fOriginalId.value = payload.id; // Update original ID
        currentMode = 'EDIT';
        btnDelete.style.display = 'block';
        await loadTerms();
    } catch (e) {
        showToast('Error saving: ' + e.message, true);
    } finally {
        btnSave.textContent = 'Save Term';
        btnSave.disabled = false;
    }
});

btnDelete.addEventListener('click', async () => {
    if (!fOriginalId.value) return;
    if (!confirm(`Permanently delete term "${fTitle.value}"?`)) return;

    btnDelete.textContent = '...';
    btnDelete.disabled = true;

    const { error } = await supabase.from('lexicon_terms').delete().eq('id', fOriginalId.value);
    
    if (error) {
        showToast('Error deleting: ' + error.message, true);
        btnDelete.textContent = 'Delete';
        btnDelete.disabled = false;
    } else {
        showToast('Term deleted.');
        trackAction('lexicon_term_deleted', { term_id: fOriginalId.value, title: fTitle.value });
        editorForm.classList.add('hidden');
        editorFooter.classList.add('hidden');
        editorFooter.classList.remove('flex');
        editorEmpty.classList.remove('hidden');
        fOriginalId.value = '';
        btnDelete.textContent = 'Delete';
        btnDelete.disabled = false;
        await loadTerms();
    }
});

// ─── IMAGE UPLOAD (STORAGE) ───────────────────────────────────────────────────
imageDropzone.addEventListener('click', () => {
    if (!currentUser) return;
    fileInput.click();
});

imageDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (currentUser) imageDropzone.classList.add('dragover');
});

imageDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    imageDropzone.classList.remove('dragover');
});

imageDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    imageDropzone.classList.remove('dragover');
    if (!currentUser) return;
    if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) uploadFile(e.target.files[0]);
});

async function uploadFile(file) {
    if (!currentUser) return;
    const safeName = 'lexicon/' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    uploadProgress.style.width = '50%';
    
    const { data, error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
        cacheControl: '3600',
        upsert: true
    });

    if (error) {
        showToast('Upload failed: ' + error.message, true);
        uploadProgress.style.width = '0%';
        return;
    }

    uploadProgress.style.width = '100%';
    setTimeout(() => { uploadProgress.style.width = '0%'; }, 1000);
    showToast('Image uploaded successfully.');

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(safeName);
    fImg.value = urlData.publicUrl;
    updateImagePreview(urlData.publicUrl);
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderList);
filterCat.addEventListener('change', renderList);
filterType.addEventListener('change', renderList);
btnCreateNew.addEventListener('click', initNewTerm);

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');
const slidesList = document.getElementById('slides-list');
const emptyState = document.getElementById('empty-state');
const slideCount = document.getElementById('slide-count');
const btnAddSlide = document.getElementById('btn-add-slide');
const editModal = document.getElementById('edit-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const modalError = document.getElementById('modal-error');
const modalSlideId = document.getElementById('modal-slide-id');
const modalOrder = document.getElementById('modal-order');
const modalTitleInput = document.getElementById('modal-title-input');
const modalBody = document.getElementById('modal-body');
const modalImage = document.getElementById('modal-image');
const modalLinkUrl = document.getElementById('modal-link-url');
const modalLinkLabel = document.getElementById('modal-link-label');
const previewTrack = document.getElementById('preview-track');
const previewDots = document.getElementById('preview-dots');
const btnPickAsset = document.getElementById('btn-pick-asset');
const assetPicker = document.getElementById('asset-picker');

const BUCKET = 'article_assets';
// currentUser imported from auth.js
let slides = [];
let previewIndex = 0;
let previewTimer = null;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        authStatusTitle.innerText = 'CLEARANCE REJECTED';
        authStatusDetail.innerText = `Role '${currentRole}' is not SOVEREIGN.`;
        return;
    }
    authLock.style.opacity = '0';
    authLock.style.transition = 'opacity 0.4s';
    setTimeout(() => { authLock.style.display = 'none'; }, 450);
    loadSlides();
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

// ─── LOAD & RENDER ────────────────────────────────────────────────────────────
async function loadSlides() {
    const { data, error } = await supabase
        .from('splash_slides')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) { console.error(error); return; }
    slides = data || [];
    renderList();
    renderPreview();
}

function renderList() {
    slideCount.textContent = `${slides.length} SLIDE${slides.length !== 1 ? 'S' : ''}`;
    slidesList.innerHTML = '';

    if (slides.length === 0) { emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    slides.forEach((slide, idx) => {
        const card = document.createElement('div');
        card.className = 'border border-matrix-border bg-matrix-panel/40 p-4 flex flex-col md:flex-row md:items-center gap-4 group hover:border-matrix-green/40 transition-colors';
        card.innerHTML = `
            <div class="flex items-center gap-4 shrink-0">
                <span class="text-[10px] text-matrix-muted tracking-widest"># ${String(idx + 1).padStart(2, '0')}</span>
                ${slide.image_url ? `<img src="${slide.image_url}" class="w-12 h-12 object-cover border border-matrix-border" alt="">` : '<div class="w-12 h-12 border border-matrix-border/30 flex items-center justify-center text-matrix-muted text-xs">IMG</div>'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-white font-bold uppercase tracking-widest truncate">${slide.title}</p>
                <p class="text-[10px] text-matrix-muted tracking-wider mt-1 truncate">${slide.body || '—'}</p>
                ${slide.link_url ? `<p class="text-[9px] text-matrix-green/60 mt-1 truncate">${slide.link_url}</p>` : ''}
            </div>
            <div class="flex gap-2 shrink-0">
                <button class="btn-edit text-[9px] font-bold tracking-widest uppercase border border-matrix-border text-matrix-muted hover:text-matrix-green hover:border-matrix-green px-3 py-1 transition-colors" data-id="${slide.id}">EDIT</button>
                <button class="btn-delete text-[9px] font-bold tracking-widest uppercase border border-red-500/30 text-red-500/60 hover:text-red-500 hover:border-red-500 px-3 py-1 transition-colors" data-id="${slide.id}">DEL</button>
            </div>
        `;
        card.querySelector('.btn-edit').addEventListener('click', () => openModal(slide));
        card.querySelector('.btn-delete').addEventListener('click', () => deleteSlide(slide.id));
        slidesList.appendChild(card);
    });
}

function renderPreview() {
    if (previewTimer) clearInterval(previewTimer);
    if (!previewTrack) return;

    if (slides.length === 0) {
        previewTrack.innerHTML = `<div class="min-w-full p-6 flex items-center justify-center min-h-[160px]"><p class="text-matrix-muted text-xs uppercase tracking-widest">NO SLIDES</p></div>`;
        previewDots.innerHTML = '';
        return;
    }

    previewTrack.innerHTML = slides.map(slide => {
        const imgHtml = slide.image_url ? `<img src="${slide.image_url}" class="w-full max-h-32 object-cover mb-4 border border-matrix-border/20" alt="">` : '';
        const bodyHtml = slide.body ? slide.body.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('') : '';
        const linkHtml = slide.link_url
            ? `<a href="${slide.link_url}" target="_blank" class="inline-block mt-4 text-[9px] text-matrix-green/70 border border-matrix-border px-4 py-1 uppercase tracking-widest">${slide.link_label || '[ LINK ]'}</a>`
            : '';
        return `<div class="min-w-full p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
            ${imgHtml}
            <h3 class="text-sm text-white font-bold tracking-widest uppercase mb-2">${slide.title}</h3>
            <div class="text-[10px] text-white/60 font-mono space-y-1 max-w-md">${bodyHtml}</div>
            ${linkHtml}
        </div>`;
    }).join('');

    previewDots.innerHTML = slides.map((_, i) =>
        `<button class="preview-dot w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-matrix-green' : 'bg-matrix-border'}" data-i="${i}"></button>`
    ).join('');

    previewDots.querySelectorAll('.preview-dot').forEach(d => {
        d.addEventListener('click', () => goPreview(parseInt(d.dataset.i)));
    });

    goPreview(0);
    if (slides.length > 1) {
        previewTimer = setInterval(() => goPreview((previewIndex + 1) % slides.length), 4000);
    }
}

function goPreview(idx) {
    previewIndex = idx;
    previewTrack.style.transform = `translateX(-${idx * 100}%)`;
    previewDots.querySelectorAll('.preview-dot').forEach((d, i) => {
        d.classList.toggle('bg-matrix-green', i === idx);
        d.classList.toggle('bg-matrix-border', i !== idx);
    });
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(slide = null) {
    modalError.classList.add('hidden');
    modalSlideId.value = slide?.id || '';
    modalOrder.value = slide?.order_index ?? slides.length;
    modalTitleInput.value = slide?.title || '';
    modalBody.value = slide?.body || '';
    modalImage.value = slide?.image_url || '';
    modalLinkUrl.value = slide?.link_url || '';
    modalLinkLabel.value = slide?.link_label || '';
    modalTitle.textContent = slide ? 'EDIT SLIDE' : 'ADD SLIDE';
    assetPicker.classList.add('hidden');
    editModal.classList.remove('hidden');
}

function closeModal() {
    editModal.classList.add('hidden');
}

async function saveSlide() {
    const title = modalTitleInput.value.trim();
    if (!title) {
        modalError.textContent = 'Title is required.';
        modalError.classList.remove('hidden');
        return;
    }

    const payload = {
        order_index: parseInt(modalOrder.value) || 0,
        title,
        body: modalBody.value.trim() || null,
        image_url: modalImage.value.trim() || null,
        link_url: modalLinkUrl.value.trim() || null,
        link_label: modalLinkLabel.value.trim() || null,
    };

    const id = modalSlideId.value;
    let error;

    if (id) {
        ({ error } = await supabase.from('splash_slides').update(payload).eq('id', id));
    } else {
        ({ error } = await supabase.from('splash_slides').insert([payload]));
    }

    if (error) {
        modalError.textContent = error.message;
        modalError.classList.remove('hidden');
        return;
    }

    closeModal();
    await loadSlides();
}

async function deleteSlide(id) {
    if (!confirm('Delete this slide? This is permanent.')) return;
    const { error } = await supabase.from('splash_slides').delete().eq('id', id);
    if (!error) await loadSlides();
}

// ─── ASSET PICKER ─────────────────────────────────────────────────────────────
async function loadAssetPicker() {
    assetPicker.innerHTML = '<p class="text-[9px] text-matrix-muted col-span-4 uppercase tracking-widest animate-pulse">Loading...</p>';
    assetPicker.classList.remove('hidden');

    const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 200 });
    if (error || !files) { assetPicker.innerHTML = '<p class="text-red-500 text-[9px] col-span-4">Failed to load assets.</p>'; return; }

    const images = files.filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name));
    if (images.length === 0) { assetPicker.innerHTML = '<p class="text-matrix-muted text-[9px] col-span-4 uppercase">No images in bucket.</p>'; return; }

    assetPicker.innerHTML = images.map(f => {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
        return `<button class="asset-pick-btn border border-matrix-border hover:border-matrix-green transition-colors p-0.5" data-url="${publicUrl}" title="${f.name}">
            <img src="${publicUrl}" class="w-full h-12 object-cover" loading="lazy" alt="${f.name}">
        </button>`;
    }).join('');

    assetPicker.querySelectorAll('.asset-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modalImage.value = btn.dataset.url;
            assetPicker.classList.add('hidden');
        });
    });
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
btnAddSlide.addEventListener('click', () => openModal());
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalSave.addEventListener('click', saveSlide);
btnPickAsset.addEventListener('click', () => {
    if (assetPicker.classList.contains('hidden')) {
        loadAssetPicker();
    } else {
        assetPicker.classList.add('hidden');
    }
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

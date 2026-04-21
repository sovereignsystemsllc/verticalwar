import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');
const blocksList = document.getElementById('blocks-list');
const emptyState = document.getElementById('empty-state');
const blockCount = document.getElementById('block-count');
const btnAddBlock = document.getElementById('btn-add-block');
const btnSaveOrder = document.getElementById('btn-save-order');

const editModal = document.getElementById('edit-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const modalError = document.getElementById('modal-error');

const modalBlockId = document.getElementById('modal-block-id');
const modalBlockType = document.getElementById('modal-block-type');
const modalContentId = document.getElementById('modal-content-id');
const modalOrder = document.getElementById('modal-order');
const fieldContentId = document.getElementById('field-content-id');
const fieldCustomHtml = document.getElementById('field-custom-html');
const modalCustomHtml = document.getElementById('modal-custom-html');

let blocks = [];
let titleDict = {};
let sortableInstance = null;
let orderChanged = false;

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
    loadBlocks();
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

// ─── LOAD & RENDER ────────────────────────────────────────────────────────────
async function loadBlocks() {
    const [
      { data: bData, error: bErr },
      { data: aData },
      { data: sData }
    ] = await Promise.all([
      supabase.from('homepage_blocks').select('*').order('order_index', { ascending: true }),
      supabase.from('articles').select('id, title').order('created_at', { ascending: false }),
      supabase.from('series').select('id, title').order('order_index', { ascending: true })
    ]);

    if (bErr) { 
        if (bErr.code !== "42P01") console.error(bErr); 
        return; 
    }

    titleDict = {};
    const sgArticles = document.getElementById('sg-articles');
    const sgSeries = document.getElementById('sg-series');
    
    if (sgArticles) sgArticles.innerHTML = '';
    if (sgSeries) sgSeries.innerHTML = '';

    if (aData) {
        aData.forEach(a => {
            titleDict[a.id] = a.title;
            if (sgArticles) {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = a.title || 'Untitled Article';
                sgArticles.appendChild(opt);
            }
        });
    }
    
    if (sData) {
        sData.forEach(s => {
            titleDict[s.id] = s.title;
            if (sgSeries) {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.title || 'Untitled Series';
                sgSeries.appendChild(opt);
            }
        });
    }

    blocks = bData || [];
    renderList();
    orderChanged = false;
    btnSaveOrder.classList.add('hidden');
}

function renderList() {
    blockCount.textContent = `${blocks.length} BLOCK${blocks.length !== 1 ? 'S' : ''}`;
    blocksList.innerHTML = '';

    if (blocks.length === 0) { 
        emptyState.classList.remove('hidden'); 
        return; 
    }
    emptyState.classList.add('hidden');

    blocks.forEach((block, idx) => {
        const card = document.createElement('div');
        card.className = 'border border-matrix-border bg-matrix-panel/40 p-4 flex items-center gap-4 group hover:border-matrix-green/40 transition-colors cursor-move block-item';
        card.dataset.id = block.id;
        
        let typeLabel = '';
        let colorClass = '';
        let displayTitle = '';

        if (block.block_type === 'SPLASH_CAROUSEL') {
            typeLabel = 'SPLASH CAROUSEL';
            colorClass = 'text-[#a78bfa] border-[#a78bfa]/30';
            displayTitle = 'ROOT / CAROUSEL';
        } else if (block.block_type === 'FEATURED_FOLDER') {
            typeLabel = 'FEATURED FOLDER';
            colorClass = 'text-matrix-green border-matrix-green/30';
            displayTitle = block.content_id ? (titleDict[block.content_id] || block.content_id) : 'UNKNOWN FOLDER';
        } else if (block.block_type === 'PINNED_ARTICLE') {
            typeLabel = 'PINNED ARTICLE';
            colorClass = 'text-[#22d3ee] border-[#22d3ee]/30';
            displayTitle = block.content_id ? (titleDict[block.content_id] || block.content_id) : 'UNKNOWN ARTICLE';
        } else if (block.block_type === 'CUSTOM_LINK') {
            typeLabel = 'CUSTOM LINK';
            colorClass = 'text-[#e879f9] border-[#e879f9]/30';
            try {
                const data = JSON.parse(block.custom_html || '{}');
                displayTitle = `${data.title || 'UNTITLED LINK'} → ${data.url || ''}`;
            } catch (e) {
                displayTitle = 'INVALID LINK DATA';
            }
        } else if (block.block_type === 'CUSTOM_HTML') {
            typeLabel = 'CUSTOM HTML';
            colorClass = 'text-[#f59e0b] border-[#f59e0b]/30';
            const rawLength = block.custom_html ? block.custom_html.length : 0;
            displayTitle = `CUSTOM CODE/TEXT [${rawLength} chars]`;
        }

document.getElementById('modal-block-type').addEventListener('change', (e) => {
    const v = e.target.value;
    document.getElementById('field-content-id').classList.toggle('hidden', v !== 'FEATURED_FOLDER' && v !== 'PINNED_ARTICLE');
    document.getElementById('field-custom-html').classList.toggle('hidden', v !== 'CUSTOM_HTML');
    document.getElementById('field-custom-link').classList.toggle('hidden', v !== 'CUSTOM_LINK');
});

        card.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold border ${colorClass} px-2 py-0.5 tracking-widest uppercase">${typeLabel}</span>
                    <span class="text-xs text-white font-bold tracking-wider truncate uppercase">${displayTitle}</span>
                </div>
            </div>
            <div class="flex gap-2 shrink-0">
                <button class="btn-edit text-[9px] font-bold tracking-widest uppercase border border-matrix-border text-matrix-muted hover:text-matrix-green hover:border-matrix-green px-4 py-2 transition-colors">EDIT</button>
                <button class="btn-delete text-[9px] font-bold tracking-widest uppercase border border-red-500/30 text-red-500/60 hover:text-red-500 hover:border-red-500 px-4 py-2 transition-colors">DEL</button>
            </div>
        `;
        
        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(block);
        });
        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBlock(block.id);
        });
        
        blocksList.appendChild(card);
    });

    initSortable();
}

function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(blocksList, {
        animation: 150,
        ghostClass: 'opacity-50',
        handle: '.block-item',
        onEnd: () => {
            orderChanged = true;
            btnSaveOrder.classList.remove('hidden');
            btnSaveOrder.classList.add('animate-pulse');
        }
    });
}

async function saveOrder() {
    const items = Array.from(blocksList.querySelectorAll('.block-item'));
    const updates = items.map((el, index) => ({
        id: el.dataset.id,
        order_index: index,
    }));

    btnSaveOrder.textContent = "SAVING...";
    btnSaveOrder.disabled = true;

    const results = await Promise.all(updates.map(update => 
        supabase.from('homepage_blocks').update({ order_index: update.order_index }).eq('id', update.id)
    ));
    
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
        console.error("Errors saving homepage order:", errors);
        alert("Failed to save order. Ensure you have the SOVEREIGN role and check console.");
    }

    btnSaveOrder.textContent = "SAVE ORDER";
    btnSaveOrder.disabled = false;
    btnSaveOrder.classList.add('hidden');
    orderChanged = false;
    await loadBlocks();
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(block = null) {
    modalError.classList.add('hidden');
    modalBlockId.value = block?.id || '';
    modalOrder.value = block?.order_index ?? blocks.length;
    modalBlockType.value = block?.block_type || 'SPLASH_CAROUSEL';
    modalContentId.value = block?.content_id || '';
    modalCustomHtml.value = block?.custom_html || '';
    
    // Clear custom link fields
    document.getElementById('modal-link-title').value = '';
    document.getElementById('modal-link-url').value = '';
    
    if (modalBlockType.value === 'CUSTOM_LINK') {
        try {
            const data = JSON.parse(block?.custom_html || '{}');
            document.getElementById('modal-link-title').value = data.title || '';
            document.getElementById('modal-link-url').value = data.url || '';
        } catch (e) {}
    }
    
    toggleContentIdField();
    
    modalTitle.textContent = block ? 'EDIT BLOCK' : 'ADD BLOCK';
    editModal.classList.remove('hidden');
}

function closeModal() {
    editModal.classList.add('hidden');
}

function toggleContentIdField() {
    fieldContentId.classList.add('hidden');
    fieldCustomHtml.classList.add('hidden');
    document.getElementById('field-custom-link').classList.add('hidden');
    
    if (modalBlockType.value === 'FEATURED_FOLDER' || modalBlockType.value === 'PINNED_ARTICLE') {
        fieldContentId.classList.remove('hidden');
    } else if (modalBlockType.value === 'CUSTOM_HTML') {
        fieldCustomHtml.classList.remove('hidden');
    } else if (modalBlockType.value === 'CUSTOM_LINK') {
        document.getElementById('field-custom-link').classList.remove('hidden');
    }
}

modalBlockType.addEventListener('change', toggleContentIdField);

async function saveBlock() {
    const block_type = modalBlockType.value;
    const content_id = modalContentId.value.trim();
    let custom_html = modalCustomHtml.value;

    if ((block_type === 'FEATURED_FOLDER' || block_type === 'PINNED_ARTICLE') && !content_id) {
        modalError.textContent = 'Content ID is required for Folders and Articles.';
        modalError.classList.remove('hidden');
        return;
    }
    
    if (block_type === 'CUSTOM_LINK') {
        const title = document.getElementById('modal-link-title').value.trim();
        const url = document.getElementById('modal-link-url').value.trim();
        if (!title || !url) {
            modalError.textContent = 'Display Title and URL are required for Custom Link.';
            modalError.classList.remove('hidden');
            return;
        }
        custom_html = JSON.stringify({ title, url });
    }

    const payload = {
        order_index: parseInt(modalOrder.value) || 0,
        block_type,
        content_id: (block_type === 'FEATURED_FOLDER' || block_type === 'PINNED_ARTICLE') ? content_id : null,
        custom_html: (block_type === 'CUSTOM_HTML' || block_type === 'CUSTOM_LINK') ? custom_html : null
    };

    const id = modalBlockId.value;
    let error;

    if (id) {
        ({ error } = await supabase.from('homepage_blocks').update(payload).eq('id', id));
    } else {
        ({ error } = await supabase.from('homepage_blocks').insert([payload]));
    }

    if (error) {
        modalError.textContent = error.message;
        modalError.classList.remove('hidden');
        return;
    }

    closeModal();
    await loadBlocks();
}

async function deleteBlock(id) {
    if (!confirm('Delete this block from the homepage?')) return;
    const { error } = await supabase.from('homepage_blocks').delete().eq('id', id);
    if (!error) await loadBlocks();
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
btnAddBlock.addEventListener('click', () => openModal());
btnSaveOrder.addEventListener('click', saveOrder);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
if (modalSave) modalSave.addEventListener('click', saveBlock);
modalSave.addEventListener('click', saveBlock);

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);

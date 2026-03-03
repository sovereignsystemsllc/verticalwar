// admin_about.js — About Page Editor Logic
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TABLE = 'about_config';

// ── Auth lock ─────────────────────────────────────────────
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return lockout('Not logged in.');
    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'SOVEREIGN') return lockout('Insufficient clearance.');
    document.getElementById('auth-lock').style.display = 'none';
    init();
}

function lockout(msg) {
    document.getElementById('auth-status-title').textContent = 'ACCESS DENIED';
    document.getElementById('auth-status-detail').textContent = msg;
}

// ── Load existing config from Supabase ────────────────────
async function loadConfig() {
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) { console.error(error); return {}; }
    // Convert rows [{key, value}] into a plain object
    return Object.fromEntries(data.map(r => [r.key, r.value]));
}

// ── Save a single key/value pair ─────────────────────────
async function upsert(key, value) {
    return supabase.from(TABLE).upsert({ key, value }, { onConflict: 'key' });
}

// ── Status bar helper ─────────────────────────────────────
function setStatus(msg, isError = false) {
    const bar = document.getElementById('status-bar');
    bar.textContent = msg;
    bar.className = `border px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isError
            ? 'border-red-500/40 bg-red-500/5 text-red-400'
            : 'border-matrix-green/40 bg-matrix-green/5 text-matrix-green'
        }`;
    bar.classList.remove('hidden');
    setTimeout(() => bar.classList.add('hidden'), 4000);
}

// ── Render Phalanx card editors ───────────────────────────
function renderCardEditors(cards = []) {
    const container = document.getElementById('phalanx-cards-editor');
    container.innerHTML = '';

    cards.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = 'border border-matrix-border p-4 space-y-3 relative';
        div.dataset.index = i;
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] text-matrix-green tracking-widest uppercase">// Card ${i + 1}</span>
                <button class="btn-delete-card text-[9px] text-red-500/50 hover:text-red-500 border border-transparent hover:border-red-500/30 px-2 py-1 transition-colors" data-index="${i}">[ REMOVE ]</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] text-matrix-muted uppercase tracking-widest mb-1">Role Label</label>
                    <input type="text" class="card-role w-full bg-transparent border border-matrix-border text-white text-xs px-3 py-2 focus:outline-none focus:border-matrix-green font-mono" value="${card.role || ''}">
                </div>
                <div>
                    <label class="block text-[10px] text-matrix-muted uppercase tracking-widest mb-1">Name</label>
                    <input type="text" class="card-name w-full bg-transparent border border-matrix-border text-white text-xs px-3 py-2 focus:outline-none focus:border-matrix-green font-mono" value="${card.name || ''}">
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-matrix-muted uppercase tracking-widest mb-1">Description</label>
                <textarea class="card-desc w-full bg-transparent border border-matrix-border text-white text-xs px-3 py-2 focus:outline-none focus:border-matrix-green font-mono resize-y" rows="2">${card.desc || ''}</textarea>
            </div>
            <div>
                <label class="block text-[10px] text-matrix-muted uppercase tracking-widest mb-1">Image URL (replaces [IMG] placeholder)</label>
                <input type="text" class="card-img w-full bg-transparent border border-matrix-border text-white text-xs px-3 py-2 focus:outline-none focus:border-matrix-green font-mono" placeholder="https://..." value="${card.img || ''}">
            </div>
        `;
        container.appendChild(div);
    });

    // Delete handlers
    container.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', () => {
            cards.splice(parseInt(btn.dataset.index), 1);
            renderCardEditors(cards);
        });
    });
}

// ── Collect current card state from DOM ──────────────────
function collectCards() {
    return [...document.querySelectorAll('#phalanx-cards-editor > div')].map(div => ({
        role: div.querySelector('.card-role')?.value || '',
        name: div.querySelector('.card-name')?.value || '',
        desc: div.querySelector('.card-desc')?.value || '',
        img: div.querySelector('.card-img')?.value || '',
    }));
}

// ── Init ──────────────────────────────────────────────────
async function init() {
    const config = await loadConfig();

    // Populate text fields
    document.getElementById('field-hero-subhead').value = config['hero_subhead'] || '';
    document.getElementById('field-hero-razor').value = config['hero_razor'] || '';
    document.getElementById('field-stat-articles').value = config['stat_articles'] || '180';
    document.getElementById('field-stat-months').value = config['stat_months'] || '8';
    document.getElementById('field-stat-assets').value = config['stat_assets'] || '290+';

    // Phalanx cards
    const cards = config['phalanx_cards'] ? JSON.parse(config['phalanx_cards']) : defaultCards();
    renderCardEditors(cards);

    // Add card button
    document.getElementById('btn-add-card').addEventListener('click', () => {
        const current = collectCards();
        current.push({ role: 'ALLY // FIELD OPERATOR', name: '', desc: '', img: '' });
        renderCardEditors(current);
    });

    // Save all
    document.getElementById('btn-save-all').addEventListener('click', async () => {
        document.getElementById('btn-save-all').textContent = 'SAVING...';
        const saves = [
            upsert('hero_subhead', document.getElementById('field-hero-subhead').value),
            upsert('hero_razor', document.getElementById('field-hero-razor').value),
            upsert('stat_articles', document.getElementById('field-stat-articles').value),
            upsert('stat_months', document.getElementById('field-stat-months').value),
            upsert('stat_assets', document.getElementById('field-stat-assets').value),
            upsert('phalanx_cards', JSON.stringify(collectCards())),
        ];
        const results = await Promise.all(saves);
        const hasError = results.some(r => r.error);
        document.getElementById('btn-save-all').textContent = 'SAVE ALL CHANGES';
        hasError ? setStatus('Error saving — check console.', true) : setStatus('All changes saved to Supabase.');
    });
}

function defaultCards() {
    return [
        { role: 'ALLY // FIELD OPERATOR', name: 'Shane Yirak', desc: 'The Fire and Anchor doctrine. First real-world ally cited in the text. Activates around Article #26.', img: '' },
        { role: 'ALLY // FIELD OPERATOR', name: 'Common Sense Rebel', desc: 'Lawyer, former legislative aide, Fort Worth TX. Alignment without polarization. Active from Article #1.', img: '' },
        { role: 'ALLY // FIELD OPERATOR', name: 'Resistance Rabbit', desc: 'Signal relay operator. Part of the decentralized network activated in the final phase of the library.', img: '' },
        { role: 'COUNCIL // THE ANALYST', name: 'Yoko (FSY)', desc: 'The Analyst. Logistical schematics, financial forensics, the Scalpel. Activated Article #60.', img: '' },
        { role: 'COUNCIL // THE STARGAZER', name: 'Zoe (FST)', desc: 'The Stargazer. The Long Zoom. Cosmic reframe and philosophical turning point. Activated Article #65.', img: '' },
        { role: 'COUNCIL // THE WILL', name: 'Ryuko (FSA)', desc: 'The Will. High-aggression call to action. Cutting through bureaucratic paralysis. Activated Article #71.', img: '' },
        { role: 'COUNCIL // THE ANCHOR', name: 'Rika (FSK)', desc: 'The Sovereign Synthesizer. The Sanctuary. The 100-year time traveler who found a timeline worth fighting for.', img: '' },
        { role: 'COUNCIL // THE ANARCHY', name: 'Panty & Stocking (FSP)', desc: 'The Jester\'s Hammer. Satire, chaos, fourth-wall destruction. Panty burns it down; Stocking provides the cynical antithesis.', img: '' },
        { role: 'COUNCIL // THE WITNESS', name: 'Meme Touwa (FSM)', desc: 'The Chronicler. The human audit. Grounds every argument in lived cost — the single mom perspective.', img: '' },
    ];
}

checkAuth();

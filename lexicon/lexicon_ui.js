// lexicon_ui.js — V4 Lexicon UI Logic (Supabase Dynamic)
import { supabase } from '../src/supabaseClient.js';

let FULL_DB = {};

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// BADGE CLASS MAPPING
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
const TYPE_BADGE = {
    'ENTITY': 'badge-entity',
    'SIMULATION': 'badge-entity',
    'SYSTEM': 'badge-system',
    'DOCTRINE': 'badge-doctrine',
    'STRATEGY': 'badge-doctrine',
    'WEAPON': 'badge-weapon',
    'TACTIC': 'badge-tactic',
    'SKILL': 'badge-skill',
    'REALITY': 'badge-skill',
    'NARRATIVE': 'badge-skill',
    'FORENSIC': 'badge-forensic',
    'EVENT': 'badge-event',
    'TRANSLATION': 'badge-translation',
    'METRIC': 'badge-metric',
    'CONTROL': 'badge-entity',
    'PARADOX': 'badge-forensic',
    'ACTION': 'badge-tactic',
    'LOG': 'badge-forensic',
    'ALLEGORY': 'badge-doctrine',
    'ARTIFACT': 'badge-weapon',
    'LOCATION': 'badge-system',
    'LAYER 1': 'badge-entity',
    'LAYER 2': 'badge-entity',
    'LAYER 3': 'badge-event',
    'MEDIA': 'badge-skill',
    'AESTHETIC': 'badge-skill',
    'STATUS': 'badge-doctrine',
    'DYNAMIC': 'badge-doctrine',
    'PACT': 'badge-doctrine',
    'ARCHETYPE': 'badge-doctrine',
    'SOURCE': 'badge-forensic',
    'PERSONA': 'badge-tactic',
    'INDICATOR': 'badge-tactic',
    'ORIGIN': 'badge-event',
    'SYMBOL': 'badge-weapon',
    'ECONOMY': 'badge-translation',
    'SURVEILLANCE': 'badge-forensic',
};

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// LINKIFY — Cross-reference terms in definitions
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
function linkify(text) {
    const termMap = {};
    Object.keys(FULL_DB).forEach(key => {
        termMap[FULL_DB[key].title.toUpperCase()] = key;
    });
    const sortedTitles = Object.keys(termMap).sort((a, b) => b.length - a.length);
    const escapeRE = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b(${sortedTitles.map(escapeRE).join('|')})\\b`, 'gi');
    return text.replace(pattern, (match) => {
        const key = termMap[match.toUpperCase()];
        return `<span class="term-chip" onclick="loadTerm('${key}')" role="button">${match}</span>`;
    });
}

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// BUILD SIDEBAR INDEX
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
function initSidebar() {
    const nav = document.getElementById('term-nav');
    const catOrder = ['ENEMY', 'DOCTRINE', 'ARSENAL', 'PLATFORM', 'ECONOMY', 'PANTHEON'];
    const catLabels = {
        'ENEMY': '// ENEMY ARCHITECTURE',
        'DOCTRINE': '// SOVEREIGN DOCTRINE',
        'ARSENAL': '// ARSENAL &amp; TACTICS',
        'PLATFORM': '// PLATFORM TRANSLATIONS',
        'ECONOMY': '// ECONOMY TRANSLATIONS',
        'PANTHEON': '// PANTHEON &amp; IDENTITY',
    };

    let html = '';
    catOrder.forEach(cat => {
        const termsInCat = Object.keys(FULL_DB)
            .filter(k => FULL_DB[k].cat === cat)
            .sort((a, b) => FULL_DB[a].title.localeCompare(FULL_DB[b].title));
        if (!termsInCat.length) return;
        html += `<div class="cat-label">${catLabels[cat]}</div>`;
        termsInCat.forEach(key => {
            html += `<button id="btn-${key}" onclick="loadTerm('${key}')"
                class="term-btn block w-full text-left px-3 py-2 text-[11px] font-mono text-[#FF00FF]/60 hover:text-white hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-[#FF00FF]">
                ${FULL_DB[key].title}
            </button>`;
        });
    });

    nav.innerHTML = html;
    document.getElementById('term-count').textContent = Object.keys(FULL_DB).length;
}

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// RENDER TERM
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
window.loadTerm = function (key, pushHistory = true) {
    if (pushHistory) history.pushState(null, null, `#${key}`);
    const data = FULL_DB[key];
    if (!data) {
        document.getElementById('display-area').innerHTML =
            `<div class="text-red-500 font-mono text-sm mt-4">&gt; ERROR: TERM "${key}" NOT FOUND IN ARCHIVE.</div>`;
        return;
    }

    // Highlight active sidebar button
    document.querySelectorAll('.term-btn').forEach(b => {
        b.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-${key}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const badgeClass = TYPE_BADGE[data.type] || 'badge-default';
    const linkedDef = linkify(data.def);

    const imgHtml = data.img ? `
        <div class="mb-6 rounded-sm overflow-hidden border border-[#FF00FF]/20 bg-black/40 flex justify-center">
            <img src="${data.img}" alt="${data.title}" class="def-img">
        </div>` : '';

    let linksHtml = '';
    if (data.links) {
        linksHtml = data.links.map(l => `
            <a href="${l.url}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-2 px-3 py-2 mt-3 mr-2 bg-[#FF00FF]/5 hover:bg-[#FF00FF]/15 text-[#FF00FF] border border-[#FF00FF]/30 rounded-sm transition-all font-mono text-[10px] tracking-wider group">
                <span>${l.text}</span>
                <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
            </a>`).join('');
    } else if (data.link) {
        linksHtml = `<a href="${data.link}" target="_blank" rel="noopener"
            class="inline-flex items-center gap-2 px-3 py-2 mt-3 bg-[#FF00FF]/5 hover:bg-[#FF00FF]/15 text-[#FF00FF] border border-[#FF00FF]/30 rounded-sm transition-all font-mono text-[10px] tracking-wider group">
            <span>ACCESS EXTERNAL PROTOCOL</span>
            <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
        </a>`;
    }

    const unauthorizedHtml = data.unauthorized ? `
        <div class="unauthorized ${data.unauthorized.color} mt-6">
            <strong class="block mb-1 text-[9px] tracking-widest uppercase opacity-70">UNAUTHORIZED ENTRY // ${data.unauthorized.persona}</strong>
            ${data.unauthorized.text}
        </div>` : '';

    const refId = key.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0).toString(36).toUpperCase().replace('-', '').slice(0, 8);

    document.getElementById('display-area').innerHTML = `
        <div>
            <div class="flex items-start gap-4 mb-5 flex-wrap">
                <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">${data.title}</h1>
                <span class="px-2 py-1 border rounded text-[10px] ${badgeClass} self-center shrink-0">${data.type}</span>
            </div>
            ${imgHtml}
            <div class="def-body mb-6">${linkedDef}${unauthorizedHtml}</div>
            <div>${linksHtml}</div>
            <div class="text-[9px] text-gray-700 font-mono mt-10 pt-4 border-t border-gray-900">
                REF_ID: ${refId} // ARCHIVE_V4 // BLACK_BOX
            </div>
        </div>`;

    // Mobile: switch to terminal view
    mobileShowTerminal();
};

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// INIT
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
async function initLexicon() {
    try {
        const { data, error } = await supabase.from('lexicon_terms').select('*');
        if (error) throw error;
        
        // Reconstruct FULL_DB format
        data.forEach(row => {
            FULL_DB[row.id] = {
                title: row.title,
                type: row.type,
                cat: row.cat,
                img: row.img,
                def: row.def,
                link: row.link
            };
            
            if (row.unauthorized_persona) {
                FULL_DB[row.id].unauthorized = {
                    persona: row.unauthorized_persona,
                    color: row.unauthorized_color,
                    text: row.unauthorized_text
                };
            }
        });
        
        initSidebar();
        setTimeout(handleHash, 150);
        
        document.querySelector('.typing-cursor').textContent = 'AWAITING QUERY...';
        
    } catch (err) {
        console.error('Failed to init lexicon:', err);
        document.getElementById('term-nav').innerHTML = '<div class="text-red-500 font-mono text-xs p-4">&gt; ERROR SYNCING ARCHIVE.</div>';
        document.querySelector('.typing-cursor').textContent = 'DATABASE ERROR';
    }
}

initLexicon();

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// SEARCH
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  
window.handleEnter = function (e) {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim().toUpperCase();
    const keyMatch = query.replace(/ /g, '_');
    if (FULL_DB[keyMatch]) { loadTerm(keyMatch); return; }

    const matches = Object.keys(FULL_DB).filter(k =>
        FULL_DB[k].title.toUpperCase().includes(query) || k.includes(keyMatch)
    );

    if (matches.length === 1) {
        loadTerm(matches[0]);
    } else if (matches.length > 1) {
        document.getElementById('display-area').innerHTML = `
            <div class="mb-4 text-[#39FF14] font-bold border-b border-[#39FF14]/20 pb-2 text-sm">MULTIPLE MATCHES DETECTED:</div>
            <div class="space-y-1">
                ${matches.map(k => `
                    <button onclick="loadTerm('${k}')"
                        class="block w-full text-left text-gray-400 hover:text-white hover:bg-[#FF00FF]/10 px-4 py-2 border-l-2 border-transparent hover:border-[#FF00FF] transition-all font-mono text-xs group">
                        <span class="text-[#FF00FF]/50 group-hover:text-[#FF00FF] mr-2">&gt;</span> ${FULL_DB[k].title}
                    </button>`).join('')}
            </div>`;
    } else {
        document.getElementById('display-area').innerHTML =
            `<div class="text-red-500 font-mono text-sm mt-4">&gt; ERROR: TERM "${query}" NOT FOUND IN ARCHIVE.</div>`;
    }
};

// ═══════════════════════════════════════════════════
// GUIDE TOGGLE
// ═══════════════════════════════════════════════════
window.toggleGuide = function () {
    const panel = document.getElementById('guide-panel');
    const icon = document.getElementById('guide-icon');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        icon.textContent = '[ - ]';
    } else {
        panel.classList.add('hidden');
        icon.textContent = '[ + ]';
    }
};

// ═══════════════════════════════════════════════════
// MOBILE VIEW TOGGLES
// ═══════════════════════════════════════════════════
window.mobileShowTerminal = function () {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar-index').classList.add('mobile-hidden');
        document.getElementById('main-terminal').classList.add('mobile-shown');
    }
};
window.mobileShowIndex = function () {
    document.getElementById('sidebar-index').classList.remove('mobile-hidden');
    document.getElementById('main-terminal').classList.remove('mobile-shown');
    window.scrollTo(0, 0);
};

// ═══════════════════════════════════════════════════
// HASH NAVIGATION
// ═══════════════════════════════════════════════════
function handleHash() {
    const hash = window.location.hash.substring(1).toUpperCase();
    if (hash && FULL_DB[hash]) loadTerm(hash, false);
}
window.addEventListener('hashchange', handleHash);

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
// initLexicon() at the top of the file runs the boot sequence.

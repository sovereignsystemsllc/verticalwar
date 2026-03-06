// admin_receipts.js — Receipt Pack Publisher Suite

import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

let activePack = null;

// ── AUTH GUARD (canonical — matches every other admin tool) ───────────────────
function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') { window.location.replace('/'); return; }
    const lock = document.getElementById('auth-lock');
    if (lock) lock.style.display = 'none';
    loadPacks();
}

// ── SHA256 ─────────────────────────────────────────────────────────────────────
async function computeSHA256(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── TOAST ──────────────────────────────────────────────────────────────────────
function toast(msg, color = '#3b82f6') {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    t.style.background = color;
    m.textContent = msg;
    t.classList.remove('hidden');
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000);
}

// ── PACKS ─────────────────────────────────────────────────────────────────────
async function loadPacks() {
    const { data, error } = await supabase
        .from('receipt_packs')
        .select('*')
        .order('created_at', { ascending: false });

    const list = document.getElementById('pack-list');
    if (error || !data?.length) {
        list.innerHTML = `<p class="text-white/30 text-xs italic px-2 py-4">No packs yet. Create one →</p>`;
        return;
    }

    list.innerHTML = data.map(p => `
        <button onclick="selectPack('${p.slug}')"
            class="pack-item w-full text-left px-3 py-3 border border-blue-500/10 hover:border-blue-500/50 hover:bg-blue-500/05 transition-all group"
            data-slug="${p.slug}">
            <p class="text-xs font-bold text-white tracking-wider group-hover:text-blue-400 transition-colors">${p.slug}</p>
            <p class="text-[10px] text-white/30 tracking-widest mt-0.5">${p.episode_label || p.title}</p>
        </button>
    `).join('');
}

window.selectPack = async function (slug) {
    // Highlight active
    document.querySelectorAll('.pack-item').forEach(el => el.classList.remove('border-blue-500/60', 'bg-blue-500/05'));
    const btn = document.querySelector(`[data-slug="${slug}"]`);
    if (btn) { btn.classList.add('border-blue-500/60', 'bg-blue-500/05'); }

    const { data: pack, error: packErr } = await supabase
        .from('receipt_packs')
        .select('*')
        .eq('slug', slug)
        .single();

    if (packErr || !pack) { toast('Pack not found.', '#ef4444'); return; }

    const { data: files } = await supabase
        .from('receipt_files')
        .select('*')
        .eq('pack_id', pack.id)
        .order('is_master_archive', { ascending: false })
        .order('sort_order');

    activePack = { ...pack, files: files || [] };
    renderPackDetail(activePack);
};

function renderPackDetail(pack) {
    const panel = document.getElementById('pack-detail');
    const masterFile = pack.files.find(f => f.is_master_archive);
    const regularFiles = pack.files.filter(f => !f.is_master_archive);

    panel.innerHTML = `
        <div class="border-b border-blue-500/20 pb-4 mb-6 flex items-start justify-between gap-4">
            <div>
                <p class="text-[10px] text-blue-400/60 tracking-widest mb-1">${pack.episode_label || ''}</p>
                <h2 class="text-xl font-bold text-white tracking-wider">${pack.title}</h2>
                <p class="text-[10px] text-white/30 mt-1">/${pack.slug} &nbsp;•&nbsp; ${pack.version} &nbsp;•&nbsp; Updated: ${pack.last_updated}</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="generatePageTemplate('${pack.slug}')" class="btn-ghost">[ GENERATE PAGE ]</button>
                <a href="/receipts/pack/${pack.slug}/" target="_blank" class="btn-ghost inline-block">[ PREVIEW ↗ ]</a>
            </div>
        </div>

        <p class="text-white/40 text-xs leading-relaxed mb-8 max-w-2xl">${pack.description || ''}</p>

        <!-- MASTER ARCHIVE -->
        <div class="mb-8">
            <h3 class="text-[10px] text-blue-400 tracking-widest uppercase mb-3 border-b border-blue-500/15 pb-2">Master Archive</h3>
            ${masterFile ? `
            <div class="flex items-center justify-between border border-blue-500/15 bg-blue-500/03 p-3 text-xs">
                <div>
                    <span class="text-white/60 font-bold">${masterFile.filename}</span>
                    <span class="text-white/25 ml-3">${masterFile.size_kb} KB</span>
                </div>
                <button onclick="deleteFile('${masterFile.id}', '${pack.slug}/${masterFile.filename}')" class="btn-red">[ REMOVE ]</button>
            </div>
            ` : `<p class="text-white/20 text-xs italic">No master archive. Upload a .zip file.</p>`}
        </div>

        <!-- FILE LIST -->
        <div class="mb-8">
            <h3 class="text-[10px] text-blue-400 tracking-widest uppercase mb-3 border-b border-blue-500/15 pb-2">
                Source Documents (${regularFiles.length})
            </h3>
            <div class="space-y-2" id="file-list-inner">
                ${regularFiles.length === 0 ? `<p class="text-white/20 text-xs italic">No files yet. Upload PDFs below.</p>` :
            regularFiles.map(f => `
                    <div class="flex items-center justify-between border border-blue-500/10 p-3 hover:border-blue-500/30 transition-colors">
                        <div class="min-w-0 mr-4">
                            <p class="text-xs font-bold text-white truncate">${f.title}</p>
                            <p class="text-[9px] text-white/25 mt-0.5 truncate font-mono">${f.sha256?.slice(0, 32)}...</p>
                        </div>
                        <div class="flex items-center gap-3 shrink-0">
                            <span class="text-[10px] text-white/30">${f.size_kb} KB</span>
                            <button onclick="deleteFile('${f.id}', '${pack.slug}/${f.filename}')" class="btn-red">[ ✕ ]</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- UPLOAD ZONE -->
        <div>
            <h3 class="text-[10px] text-blue-400 tracking-widest uppercase mb-3 border-b border-blue-500/15 pb-2">Upload Files</h3>
            <div id="drop-zone"
                class="border border-dashed border-blue-500/30 bg-blue-500/03 p-8 text-center hover:border-blue-500/60 hover:bg-blue-500/05 transition-all cursor-pointer"
                ondragover="event.preventDefault(); this.classList.add('border-blue-500/80')"
                ondragleave="this.classList.remove('border-blue-500/80')"
                ondrop="handleDrop(event)">
                <p class="text-2xl mb-2">📄</p>
                <p class="text-xs font-bold text-white/60 tracking-widest uppercase mb-1">DROP PDF / ZIP FILES HERE</p>
                <p class="text-[10px] text-white/25 mb-4">SHA-256 computed automatically in browser</p>
                <input type="file" id="file-input" multiple accept=".pdf,.zip" class="hidden" onchange="handleFileInput(this.files)">
                <button onclick="document.getElementById('file-input').click()" class="btn-ghost">[ OR BROWSE ]</button>
            </div>
            <div id="upload-log" class="mt-3 space-y-1 text-[10px] font-mono"></div>
        </div>
    `;

    document.getElementById('detail-panel').classList.remove('hidden');
    document.getElementById('create-panel').classList.add('hidden');
}

// ── FILE UPLOAD ────────────────────────────────────────────────────────────────
window.handleDrop = async function (event) {
    event.preventDefault();
    document.getElementById('drop-zone').classList.remove('border-blue-500/80');
    const files = Array.from(event.dataTransfer.files);
    for (const f of files) await uploadFile(f);
};

window.handleFileInput = async function (files) {
    for (const f of Array.from(files)) await uploadFile(f);
};

async function uploadFile(file) {
    if (!activePack) { toast('Select a pack first.', '#ef4444'); return; }
    const log = document.getElementById('upload-log');
    const entry = document.createElement('div');
    entry.className = 'text-blue-400/60';
    entry.textContent = `[ PROCESSING ] ${file.name}...`;
    log.appendChild(entry);

    try {
        // 1. Compute SHA256
        entry.textContent = `[ SHA256 ] Computing hash for ${file.name}...`;
        const sha256 = await computeSHA256(file);

        // 2. Upload to Supabase Storage
        const storagePath = `${activePack.slug}/${file.name}`;
        entry.textContent = `[ UPLOAD ] ${file.name} → receipts/${storagePath}`;
        const { error: uploadErr } = await supabase.storage
            .from('receipts')
            .upload(storagePath, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        // 3. Determine file type and master archive flag
        const ext = file.name.split('.').pop().toLowerCase();
        const fileType = ext === 'zip' ? 'ZIP' : 'PDF';
        const isMaster = ext === 'zip';
        const title = file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\bv\d+\.\d+\b/gi, '')
            .replace(/module-vi?/gi, '')
            .trim()
            .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        const sizeKb = Math.round((file.size / 1024) * 100) / 100;

        // 4. Insert into receipt_files
        const maxOrder = activePack.files.reduce((m, f) => Math.max(m, f.sort_order || 0), 0);
        const { error: insertErr } = await supabase.from('receipt_files').insert({
            pack_id: activePack.id,
            title,
            filename: file.name,
            file_type: fileType,
            size_kb: sizeKb,
            sha256,
            storage_path: storagePath,
            sort_order: isMaster ? 0 : maxOrder + 1,
            is_master_archive: isMaster
        });
        if (insertErr) throw insertErr;

        entry.className = 'text-green-400';
        entry.textContent = `[ ✓ ] ${file.name} — ${sizeKb} KB — sha256: ${sha256.slice(0, 16)}...`;

        // Refresh pack detail
        await selectPack(activePack.slug);

    } catch (err) {
        entry.className = 'text-red-400';
        entry.textContent = `[ ERROR ] ${file.name}: ${err.message}`;
        console.error(err);
    }
}

// ── DELETE FILE ────────────────────────────────────────────────────────────────
window.deleteFile = async function (fileId, storagePath) {
    if (!confirm(`Delete ${storagePath}?`)) return;
    await supabase.storage.from('receipts').remove([storagePath]);
    await supabase.from('receipt_files').delete().eq('id', fileId);
    toast('File removed.');
    await selectPack(activePack.slug);
};

// ── CREATE PACK ────────────────────────────────────────────────────────────────
window.showCreatePanel = function () {
    document.getElementById('create-panel').classList.remove('hidden');
    document.getElementById('detail-panel').classList.add('hidden');
};

window.createPack = async function () {
    const slug = document.getElementById('new-slug').value.trim();
    const title = document.getElementById('new-title').value.trim();
    const episode = document.getElementById('new-episode').value.trim();
    const desc = document.getElementById('new-desc').value.trim();
    const version = document.getElementById('new-version').value.trim() || 'v1.0';

    if (!slug || !title) { toast('Slug and title required.', '#ef4444'); return; }

    const { error } = await supabase.from('receipt_packs').insert({
        slug, title, episode_label: episode, description: desc, version
    });

    if (error) { toast(error.message, '#ef4444'); return; }
    toast(`Pack "${slug}" created!`);
    await loadPacks();
    await selectPack(slug);
};

// ── GENERATE PAGE TEMPLATE ─────────────────────────────────────────────────────
window.generatePageTemplate = function (slug) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Pack // ${slug} — Vertical War</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    body { background:#05010a; color:#d1d5db; font-family:'JetBrains Mono',monospace; padding-left:256px; }
    @media(max-width:1023px){body{padding-left:0}}
    .scanline-overlay{position:fixed;inset:0;pointer-events:none;z-index:9999;background:linear-gradient(0deg,rgba(0,0,0,0) 0%,rgba(167,139,250,0.02) 50%,rgba(0,0,0,0) 100%);animation:scanline 10s linear infinite}
    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    .receipt-row{border:1px solid rgba(167,139,250,0.12);background:rgba(167,139,250,0.02);transition:all 0.2s}
    .receipt-row:hover{border-color:rgba(167,139,250,0.35);background:rgba(167,139,250,0.05)}
    .master-btn{display:flex;justify-content:space-between;align-items:center;width:100%;border:1px solid rgba(167,139,250,0.4);color:#a78bfa;padding:1rem 1.5rem;font-family:'JetBrains Mono',monospace;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;text-decoration:none;background:rgba(167,139,250,0.04);transition:all 0.2s}
    .master-btn:hover{background:rgba(167,139,250,0.12);border-color:rgba(167,139,250,0.8);color:#fff}
    .type-badge{font-size:9px;letter-spacing:.15em;padding:2px 6px;border:1px solid rgba(167,139,250,0.3);color:rgba(167,139,250,0.7);background:rgba(167,139,250,0.05)}
    .hash-text{font-size:9px;color:rgba(167,139,250,0.25);letter-spacing:.05em;word-break:break-all;transition:color 0.2s}
    .hash-text:hover{color:rgba(167,139,250,0.6)}
    .section-label{font-family:'JetBrains Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(167,139,250,0.5)}
  </style>
</head>
<body class="min-h-screen antialiased">
  <div class="scanline-overlay"></div>
  <nav class="fixed top-0 left-64 right-0 z-50 h-14 border-b border-[#a78bfa]/20 bg-[#05010a]/90 backdrop-blur-sm px-6 flex items-center justify-between lg:left-64 left-0">
    <div class="flex items-center gap-3 font-mono text-[10px] text-[#a78bfa]/40 tracking-widest">
      <a href="/" class="hover:text-[#a78bfa] transition-colors">THE CODEX</a>
      <span>/</span><span class="text-[#a78bfa]/60">receipts</span>
      <span>/</span><span class="text-white/70">${slug}</span>
    </div>
    <span id="pack-version" class="font-mono text-[9px] text-[#a78bfa]/30 tracking-widest border border-[#a78bfa]/15 px-2 py-1">VERSION: --</span>
  </nav>
  <main class="pt-14 px-6 lg:px-10 max-w-5xl mx-auto py-12">
    <section class="pt-12 pb-10 border-b border-[#a78bfa]/15 mb-12">
      <p class="section-label mb-4">Receipt Pack // Evidence Archive</p>
      <h1 class="font-mono font-bold text-3xl md:text-5xl text-white tracking-tight mb-4 leading-[1.1]" id="pack-title">LOADING...</h1>
      <p class="font-mono text-[10px] text-[#a78bfa]/40 tracking-widest mb-6" id="pack-episode"></p>
      <p class="font-mono text-xs text-white/50 max-w-2xl leading-relaxed" id="pack-desc"></p>
    </section>
    <section class="mb-12">
      <p class="section-label mb-4">Master Archive</p>
      <div id="master-container"><div class="animate-pulse text-[#a78bfa]/40 text-xs">[ QUERYING... ]</div></div>
    </section>
    <section>
      <p class="section-label mb-6">Source Documents</p>
      <div id="file-list" class="space-y-3"><div class="animate-pulse text-[#a78bfa]/40 text-xs">[ LOADING... ]</div></div>
    </section>
  </main>
  <script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    const sb = createClient('https://zazzwdaexhkeusfjdphv.supabase.co','sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg');
    const SLUG = '${slug}';
    const STORAGE = 'https://zazzwdaexhkeusfjdphv.supabase.co/storage/v1/object/public/receipts';
    const { data: pack } = await sb.from('receipt_packs').select('*,receipt_files(*)').eq('slug',SLUG).single();
    if (pack) {
      document.getElementById('pack-title').textContent = pack.title.toUpperCase() + '.';
      document.getElementById('pack-episode').textContent = (pack.episode_label||'') + ' // Updated: ' + (pack.last_updated||'');
      document.getElementById('pack-version').textContent = 'VERSION: ' + (pack.version||'');
      document.getElementById('pack-desc').textContent = pack.description||'';
      const files = pack.receipt_files || [];
      const master = files.find(f => f.is_master_archive);
      const regular = files.filter(f => !f.is_master_archive).sort((a,b) => a.sort_order - b.sort_order);
      if (master) document.getElementById('master-container').innerHTML = \`<a href="\${STORAGE}/\${master.storage_path||SLUG+'/'+master.filename}" download class="master-btn group"><span class="font-bold tracking-wider">⬇ DOWNLOAD MASTER ARCHIVE</span><span class="text-white/40">\${master.size_kb} KB</span></a><div class="mt-2 hash-text pl-1"><span class="text-[#a78bfa]/30">sha256: </span>\${master.sha256}</div>\`;
      const fl = document.getElementById('file-list');
      fl.innerHTML = regular.length ? regular.map(f => \`<div class="receipt-row p-4"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2"><div class="flex items-center gap-3"><span class="type-badge shrink-0">\${f.file_type}</span><a href="\${STORAGE}/\${f.storage_path||SLUG+'/'+f.filename}" target="_blank" class="text-[#a78bfa] hover:text-white font-mono font-bold text-sm">\${f.title}</a></div><span class="font-mono text-xs text-white/30 shrink-0">\${f.size_kb} KB</span></div><div class="hash-text"><span class="text-[#a78bfa]/25">sha256: </span>\${f.sha256}</div></div>\`).join('') : '<p class="text-white/20 text-xs">No files yet.</p>';
    }
  <\/script>
  <script type="module" src="/src/sidebar.js"><\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}_index.html`;
    a.click();
    toast(`Template downloaded: ${slug}_index.html`);
};

// ── INIT ──────────────────────────────────────────────────────────────────────
async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

document.addEventListener('DOMContentLoaded', bootstrap);

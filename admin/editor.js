import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// Terminal Logging utility
const terminal = document.getElementById('statusTerminal');
const logContent = document.getElementById('logContent');
let hideTerminalTimer;

function logTerminal(message, type = 'INFO') {
    terminal.classList.remove('hidden', 'opacity-0');
    terminal.classList.add('opacity-80');

    const entry = document.createElement('div');
    entry.className = `mb-1 ${type === 'ERROR' ? 'text-red-500' : 'text-[#00ff41]'}`;
    entry.textContent = `[${type}] ${message}`;
    logContent.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
    console.log(`[${type}] ${message}`);

    clearTimeout(hideTerminalTimer);
    hideTerminalTimer = setTimeout(() => {
        terminal.classList.remove('opacity-80');
        terminal.classList.add('opacity-0');
        setTimeout(() => terminal.classList.add('hidden'), 500);
    }, 4000);
}

let quill;
let currentArticleId = null;

// Show thumbnail preview in the editor UI
function setThumbnailPreview(url) {
    const preview = document.getElementById('thumbnail-preview');
    const wrap = document.getElementById('thumbnail-preview-wrap');
    if (preview && wrap && url) {
        preview.src = url;
        wrap.classList.remove('hidden');
    }
}

// Auth handled by auth.js — see bootstrap() below

// Initialize Quill and custom image handler
function initForge() {
    quill = new Quill('#quill-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // Custom Image Handler for direct Supabase Uploads
    quill.getModule('toolbar').addHandler('image', () => {
        document.getElementById('imageUploadInput').click();
    });

    document.getElementById('imageUploadInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        logTerminal(`Uploading image: ${file.name}...`);

        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${crypto.randomUUID()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('article_assets')
            .upload(fileName, file, { upsert: true });

        if (error) {
            logTerminal(`Upload failed: ${error.message}`, 'ERROR');
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('article_assets')
            .getPublicUrl(fileName);

        const url = publicUrlData.publicUrl;

        // Insert picture into the editor
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url);
        logTerminal(`Image securely forged: ${url}`);

        // Clear input
        e.target.value = '';
    });

    // Thumbnail Upload Handler
    document.getElementById('btn-upload-thumbnail').addEventListener('click', () => {
        document.getElementById('thumbnailUploadInput').click();
    });

    document.getElementById('thumbnailUploadInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        logTerminal(`Uploading thumbnail: ${file.name}...`);
        document.getElementById('thumbnail-filename').textContent = 'Uploading...';

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `thumbnails/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
            .from('article_assets')
            .upload(fileName, file, { upsert: true });

        if (error) {
            logTerminal(`Thumbnail upload failed: ${error.message}`, 'ERROR');
            document.getElementById('thumbnail-filename').textContent = 'Upload failed.';
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('article_assets')
            .getPublicUrl(fileName);

        const url = publicUrlData.publicUrl;
        document.getElementById('iptThumbnail').value = url;
        setThumbnailPreview(url);
        document.getElementById('thumbnail-filename').textContent = file.name;
        logTerminal(`Thumbnail forged: ${url}`);
        e.target.value = '';
    });
}

// ============================================================
// VIDEO EMBED UTILITIES
// ============================================================

/**
 * Converts any supported watch-page URL into an embeddable URL.
 * Supports: YouTube (watch, shorts, youtu.be), Rumble
 * Returns null if the URL is unrecognized.
 */
function resolveEmbedUrl(url) {
    if (!url) return null;
    try {
        const u = new URL(url);

        // YouTube: youtube.com/watch?v=ID or youtube.com/shorts/ID
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v') || u.pathname.split('/').pop();
            if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        }

        // YouTube short-link: youtu.be/ID
        if (u.hostname === 'youtu.be') {
            const id = u.pathname.replace('/', '');
            if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        }

        // Rumble: rumble.com/vXXXXX-title.html → embed/vXXXXX/
        if (u.hostname.includes('rumble.com')) {
            const match = u.pathname.match(/\/(v[a-z0-9]+)/i);
            if (match) return `https://rumble.com/embed/${match[1]}/`;
        }
    } catch (_) { /* invalid URL — ignore */ }
    return null;
}

/** Show green confirmation label in editor when URL resolves */
function showVideoPreview(url) {
    const label = document.getElementById('videoPreviewLabel');
    if (!label) return;
    if (resolveEmbedUrl(url)) {
        label.classList.remove('hidden');
    } else {
        label.classList.add('hidden');
    }
}

// Load Article Data
async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    currentArticleId = params.get('id');

    if (!currentArticleId) {
        logTerminal('No target UUID provided. Initializing empty Forge for new payload.');
        return;
    }

    logTerminal(`Loading record: ${currentArticleId}`);

    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', currentArticleId)
        .single();

    if (error || !data) {
        logTerminal('Failed to load database record.', 'ERROR');
        return;
    }

    // Populate the UI
    document.getElementById('iptTitle').value = data.title || '';
    document.getElementById('iptSubtitle').value = data.subtitle || '';
    document.getElementById('iptSlug').value = data.slug || '';
    document.getElementById('iptThumbnail').value = data.thumbnail_url || '';
    if (data.thumbnail_url) setThumbnailPreview(data.thumbnail_url);

    const videoEl = document.getElementById('iptVideoUrl');
    if (videoEl) {
        videoEl.value = data.video_url || '';
        if (data.video_url) showVideoPreview(data.video_url);
    }

    if (data.post_date) {
        // Format for datetime-local (YYYY-MM-DDThh:mm)
        const dateObj = new Date(data.post_date);
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
        document.getElementById('iptDate').value = localISOTime;
    }

    document.getElementById('selAudience').value = data.audience || 'everyone';
    document.getElementById('selStatus').value = data.status || 'draft';

    // Populate Quill using the direct HTML node
    quill.clipboard.dangerouslyPasteHTML(data.content_html || '');

    logTerminal('Payload loaded into Forge.');
}

// Slug generator helper
function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Save Article Data
async function saveArticle() {
    logTerminal(currentArticleId ? 'Commencing database overwrite...' : 'Commencing new database injection...');
    const btnSave = document.getElementById('btnSave');
    btnSave.textContent = 'SAVING...';
    btnSave.disabled = true;

    const title = document.getElementById('iptTitle').value.trim();
    let slug = document.getElementById('iptSlug').value.trim();

    if (!slug && title) {
        slug = generateSlug(title);
        document.getElementById('iptSlug').value = slug;
    }

    const subtitle = document.getElementById('iptSubtitle').value.trim();
    const thumbnail_url = document.getElementById('iptThumbnail').value.trim();
    const dateInput = document.getElementById('iptDate').value;
    const post_date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();
    const audience = document.getElementById('selAudience').value;
    const status = document.getElementById('selStatus').value;

    // Extract root HTML from Quill
    const content_html = quill.root.innerHTML;

    const video_url = (document.getElementById('iptVideoUrl')?.value || '').trim() || null;

    const payload = {
        title,
        subtitle,
        slug,
        thumbnail_url,
        post_date,
        audience,
        status,
        content_html,
        video_url,
    };

    let dbResponse;
    if (currentArticleId) {
        // OVERWRITE EXISTING
        dbResponse = await supabase
            .from('articles')
            .update(payload)
            .eq('id', currentArticleId);
    } else {
        // CREATE NEW
        dbResponse = await supabase
            .from('articles')
            .insert([payload])
            .select();

        // Update URL to active state ID so further saves overwrite rather than duplicate
        if (dbResponse.data && dbResponse.data.length > 0) {
            currentArticleId = dbResponse.data[0].id;
            window.history.replaceState({}, '', `/admin/editor.html?id=${currentArticleId}`);
        }
    }

    if (dbResponse.error) {
        logTerminal(`${currentArticleId ? 'Overwrite' : 'Injection'} Failed: ${dbResponse.error.message}`, 'ERROR');
        btnSave.textContent = 'SAVE FAILED';
        btnSave.classList.add('bg-red-500', 'text-white');
        setTimeout(() => {
            btnSave.textContent = 'Save Changes';
            btnSave.classList.remove('bg-red-500', 'text-white');
            btnSave.disabled = false;
        }, 3000);
    } else {
        logTerminal(`${currentArticleId ? 'Overwrite' : 'Injection'} Successful. Record Secured.`);
        btnSave.textContent = 'SAVED';
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.classList.remove('hidden');

        setTimeout(() => {
            btnSave.textContent = 'Save Changes';
            btnSave.disabled = false;
            saveStatus.classList.add('hidden');
        }, 2000);
    }
}

// Delete Article
async function deleteArticle() {
    if (!currentArticleId) return;
    if (!confirm("OBLITERATE THIS RECORD? This is permanent.")) return;

    logTerminal('Executing Obliteration Protocol...');
    const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', currentArticleId);

    if (error) {
        logTerminal(`Obliteration Failed: ${error.message}`, 'ERROR');
    } else {
        logTerminal('Record Obliterated. Rerouting to Curation...');
        setTimeout(() => {
            window.location.replace('/admin/curate.html');
        }, 1000);
    }
}

// Boot Sequence — unified through auth.js
async function bootstrap() {
    setAuthChangeCallback(async () => {
        if (currentRole !== 'SOVEREIGN') {
            logTerminal('Insufficient clearance. Redirecting...', 'ERROR');
            setTimeout(() => window.location.replace('/'), 1500);
            return;
        }
        logTerminal('Clearance granted. The Forge is Online.');
        initForge();
        await loadArticle();

        document.getElementById('btnSave').addEventListener('click', saveArticle);
        document.getElementById('btnDelete').addEventListener('click', deleteArticle);

        // Auto-generate slug dynamically if empty
        document.getElementById('iptTitle').addEventListener('blur', (e) => {
            const slugInput = document.getElementById('iptSlug');
            if (!slugInput.value && e.target.value) {
                slugInput.value = generateSlug(e.target.value);
            }
        });

        // Video URL live feedback
        const videoEl = document.getElementById('iptVideoUrl');
        if (videoEl) {
            videoEl.addEventListener('input', () => showVideoPreview(videoEl.value.trim()));
        }
    });
    await initAuth();
}

document.addEventListener('DOMContentLoaded', bootstrap);

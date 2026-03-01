import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (V4 Vite Env Variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Terminal Logging utility
const terminal = document.getElementById('statusTerminal');
const logContent = document.getElementById('logContent');

function logTerminal(message, type = 'INFO') {
    terminal.classList.remove('hidden');
    const entry = document.createElement('div');
    entry.className = `mb-1 ${type === 'ERROR' ? 'text-red-500' : 'text-[#00ff41]'}`;
    entry.textContent = `[${type}] ${message}`;
    logContent.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
    console.log(`[${type}] ${message}`);
}

let quill;
let currentArticleId = null;

// The Sovereign Lock
async function verifyAccess() {
    logTerminal('Verifying Sovereign clearance...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        logTerminal('No session found. Archiving.', 'ERROR');
        window.location.replace('/login.html');
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'Sovereign') {
        logTerminal('Insufficient clearance.', 'ERROR');
        window.location.replace('/login.html');
        return null;
    }

    logTerminal('Clearance granted. The Forge is Online.');
    return session.user;
}

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

    const payload = {
        title,
        subtitle,
        slug,
        thumbnail_url,
        post_date,
        audience,
        status,
        content_html
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

// Boot Sequence
document.addEventListener('DOMContentLoaded', async () => {
    const user = await verifyAccess();
    if (user) {
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
    }
});

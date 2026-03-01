import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Vite pulls these values securely from the hidden .env file at compile time
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const logList = document.getElementById('log-list');
const queueCount = document.getElementById('queue-count');
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');

let currentUser = null;

function logMessage(filename, message, statusStr) {
    if (logList.innerHTML.includes('AWAITING BATCH DROP')) {
        logList.innerHTML = '';
    }

    let colorClass = 'text-term-green/80';
    if (statusStr === 'ERROR' || statusStr === 'DENIED') colorClass = 'text-red-500';
    if (statusStr === 'PROCESSING') colorClass = 'text-yellow-500';

    const li = document.createElement('li');
    li.className = `flex flex-col py-1 border-b border-term-green/10 last:border-0 ${colorClass}`;

    let htmlContent = `<div class="flex justify-between w-full"><span><span class="text-term-green mr-2">></span>${filename}</span> <span class="tracking-[0.2em]">[${statusStr}]</span></div>`;

    if (message && message !== 'POSTED TO VAULT') {
        htmlContent += `<span class="text-[10px] opacity-70 ml-4 mt-1">> ${message}</span>`;
    }

    li.innerHTML = htmlContent;
    logList.prepend(li);
}

async function verifyAccess() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            authStatusTitle.innerText = "ACCESS DENIED";
            authStatusDetail.innerText = "No active Supabase session detected.";
            logMessage('SECURITY', 'No valid login found.', 'DENIED');
            return;
        }

        currentUser = session.user;
        authStatusDetail.innerText = "Verifying Role...";

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        if (profileError || !profile || profile.role !== 'Sovereign') {
            logMessage('SECURITY', `Role '${profile?.role || 'Unknown'}' authorized. Sovereign required.`, 'DENIED');
            authStatusTitle.innerText = "CLEARANCE REJECTED";
            authStatusDetail.innerText = "Account lacks Sovereign-level access.";
            return;
        }

        // Silent unlock
        authLock.style.opacity = '0';
        setTimeout(() => { authLock.style.display = 'none'; }, 500);

    } catch (err) {
        logMessage('SYSTEM', err.message, 'ERROR');
        authStatusTitle.innerText = "SYSTEM ERROR";
        authStatusDetail.innerText = err.message;
    }
}

document.addEventListener('DOMContentLoaded', verifyAccess);

browseBtn.addEventListener('click', () => {
    if (!currentUser) return;
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    if (!currentUser) {
        alert("Sovereign authorization required to process batches.");
        return;
    }
    const files = Array.from(e.target.files).filter(f => f.name.endsWith('.html'));
    await processBatchedFiles(files);
    e.target.value = '';
});

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

    if (!currentUser) {
        alert("Sovereign authorization required to process batches.");
        return;
    }

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.html'));
    await processBatchedFiles(files);
});

async function processBatchedFiles(files) {
    if (files.length === 0) {
        logMessage('SYSTEM', 'No valid HTML files detected in the payload.', 'ERROR');
        return;
    }

    queueCount.innerText = `${files.length} FILES DETECTED`;
    logMessage(`BATCH CONTROLLER`, `Commencing parse of ${files.length} records.`, 'PROCESSING');

    for (let i = 0; i < files.length; i++) {
        await parseAndCommit(files[i]);
    }

    logMessage('BATCH CONTROLLER', 'All queued files processed.', 'SUCCESS');
}

async function parseAndCommit(file) {
    try {
        const textContent = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');

        let slugBase = file.name.replace('.html', '');
        const slugParts = slugBase.split('.');
        if (slugParts.length > 1 && !isNaN(slugParts[0])) {
            slugBase = slugParts.slice(1).join('-');
        }

        // Substack exports often don't have titles in the HTML body because they are unwrapped fragments.
        // We strictly look for h1.post-title. If we just look for 'h1', we accidentally steal section headers!
        const titleEl = doc.querySelector('h1.post-title');
        let title = '';
        if (titleEl) {
            title = titleEl.innerText.trim();
        } else {
            // Fallback: Title-case the slug (e.g., 'the-living-storybook' -> 'The Living Storybook')
            title = slugBase.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        const subtitleEl = doc.querySelector('h3.subtitle');
        const subtitle = subtitleEl ? subtitleEl.innerText.trim() : null;

        const dateEl = doc.querySelector('.post-date');
        let postDate = null;
        if (dateEl && dateEl.getAttribute('title')) {
            postDate = new Date(dateEl.getAttribute('title')).toISOString();
        }

        // --- THE V4 REFINED PARSER (LEARNED FROM V3) ---
        // 1. In V3, text was in .available-content or .body.markup. 
        // In recent exports, Substack just dumps raw HTML into the file. We fall back to doc.body.
        let bodyEl = doc.querySelector('.available-content') || doc.querySelector('.body.markup') || doc.body;

        if (!bodyEl || bodyEl.innerHTML.trim() === '') {
            logMessage(title, 'HTML body empty or unreadable.', 'ERROR');
            return;
        }

        // --- SUBSTACK TRASH TARGETING ---
        // Precisely removing the elements V3 identified as UI bloat
        const trashSelectors = [
            '.subscription-widget-wrap',
            '.share-dialog',
            '.button-wrapper',
            '.subscription-widget-wrap-editor' // Found in V4 testing
        ];

        trashSelectors.forEach(selector => {
            const trashElements = bodyEl.querySelectorAll(selector);
            trashElements.forEach(trash => trash.remove());
        });

        // --- IMAGE HANDLING (V4 DOCTRINE) ---
        // Substack blocks hotlinking and wraps images in <picture><source srcset="...">
        // Modern browsers will prioritize the <source> tag over our rewritten <img> src.
        // We must brutally destroy the <picture> wrapper and extract the bare <img>.

        const pictures = Array.from(bodyEl.querySelectorAll('picture'));
        pictures.forEach(pic => {
            const innerImg = pic.querySelector('img');
            if (innerImg) {
                pic.parentNode.insertBefore(innerImg, pic); // Move img out of the picture tag
            }
            pic.remove(); // Destroy the <picture> and its <source> tags
        });

        const images = Array.from(bodyEl.querySelectorAll('img'));
        const { data: { session } } = await supabase.auth.getSession();

        const proxyPromises = images.map(async (img, idx) => {

            // Annihilate any lingering Substack responsive attributes
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
            img.removeAttribute('data-attrs');

            img.classList.add('v4-article-image');

            const imgUrl = img.getAttribute('src');
            if (imgUrl && imgUrl.startsWith('http')) {
                try {
                    // Extract extension from Substack's CDN string, default to jpg
                    let ext = 'jpg';
                    if (imgUrl.includes('f_webp')) {
                        ext = 'webp';
                    } else if (imgUrl.includes('.')) {
                        const potentialExt = imgUrl.split('.').pop().split('?')[0].toLowerCase();
                        if (['png', 'gif', 'jpeg', 'jpg', 'webp'].includes(potentialExt)) {
                            ext = potentialExt;
                        }
                    }

                    const newFilename = `${slugBase}_img_${idx}.${ext}`;

                    // 1. Invoke the Server-Side Edge Proxy to bypass Browser CORS
                    const { data: proxyData, error: proxyError } = await supabase.functions.invoke('image-proxy', {
                        body: { imageUrl: imgUrl, fileName: newFilename },
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        }
                    });

                    // 2. Handle Proxy Failure States
                    if (proxyError) {
                        logMessage('PROXY FATAL', `Edge Execution Panic: ${proxyError.message}`, 'ERROR');
                        return;
                    }
                    if (proxyData?.error) {
                        logMessage('PROXY REJECT', `Edge payload rejected: ${proxyData.error}`, 'ERROR');
                        return;
                    }
                    if (!proxyData?.success || !proxyData?.publicUrl) {
                        logMessage('PROXY INVALID', `Payload missing success/publicUrl structure. Data: ${JSON.stringify(proxyData)}`, 'ERROR');
                        return;
                    }

                    // 3. Swap the HTML link to point to our secure public bucket
                    img.setAttribute('src', proxyData.publicUrl);
                    img.style.border = "3px solid #00ff41";
                    logMessage('PROXY SWAP', `Successfully routed image ${idx + 1} to bucket.`, 'SUCCESS');

                } catch (err) {
                    logMessage('PROXY EXCEPTION', `Image ${idx + 1} processing failed: ${err.message}`, 'ERROR');
                }
            }
        });

        await Promise.all(proxyPromises);

        console.log("=========== CRITICAL DEBUG PRE-DB DUMP ===========");
        const finalImages = Array.from(bodyEl.querySelectorAll('img'));
        finalImages.forEach((img, i) => console.log(`Image ${i} SRC in DOM:`, img.getAttribute('src')));
        console.log("==================================================");

        // FORCE A HARD SERIALIZATION
        // innerHTML sometimes caches the initial load state on large detached DOM fragments.
        // We use XMLSerializer to forcefully print the exact current state of the parsed node tree.
        const serializer = new XMLSerializer();
        const rawContentString = serializer.serializeToString(bodyEl);

        // Strip the wrapping <body> tags added by the DOMParser since we just want the inner string
        const contentHtml = rawContentString.replace(/^<body[^>]*>/i, '').replace(/<\/body>$/i, '').trim();

        if (contentHtml.length === 0) {
            logMessage(title, 'Parsed content HTML was totally empty after cleaning.', 'ERROR');
            return;
        }

        let slug = slugBase;

        const { error } = await supabase
            .from('articles')
            .insert([{
                title: title,
                subtitle: subtitle,
                content_html: contentHtml,
                slug: slug,
                post_date: postDate,
                status: 'draft',
                audience: 'everyone',
                author_id: currentUser.id
            }]);

        if (error) {
            logMessage(title.substring(0, 30) + '...', error.message, 'ERROR');
        } else {
            logMessage(title.substring(0, 30) + '...', 'POSTED TO VAULT', 'SUCCESS');
        }

    } catch (err) {
        logMessage(file.name, `Parse Exception: ${err.message}`, 'ERROR');
    }
}

import { supabase } from '../src/supabaseClient.js';
import { initAuth, currentUser, currentRole, setAuthChangeCallback } from '../src/auth.js';

const csvDropZone = document.getElementById('csv-drop-zone');
const csvFileInput = document.getElementById('csv-file-input');
const ledgerStatusDot = document.getElementById('ledger-status-dot');
const ledgerStatusText = document.getElementById('ledger-status-text');

const htmlDropZone = document.getElementById('html-drop-zone');
const htmlFileInput = document.getElementById('html-file-input');
const browseBtn = document.getElementById('browse-btn');

const logList = document.getElementById('log-list');
const queueCount = document.getElementById('queue-count');
const authLock = document.getElementById('auth-lock');
const authStatusTitle = document.getElementById('auth-status-title');
const authStatusDetail = document.getElementById('auth-status-detail');

// currentUser is imported from auth.js

function logMessage(filename, message, statusStr) {
    if (logList.innerHTML.includes('AWAITING BATCH DROP') || logList.innerHTML.includes('System initialized. Awaiting user interaction.')) {
        logList.innerHTML = '';
    }

    let colorClass = 'text-purple-400';
    let labelBg = 'bg-purple-500/10 border-purple-500/20 text-purple-400';

    if (statusStr === 'ERROR' || statusStr === 'DENIED' || statusStr === 'PROXY EXCEPTION') {
        colorClass = 'text-red-400';
        labelBg = 'bg-red-500/10 border-red-500/20 text-red-500';
    } else if (statusStr === 'PROCESSING') {
        colorClass = 'text-blue-400';
        labelBg = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    } else if (statusStr === 'SUCCESS' || statusStr === 'PROXY SWAP') {
        colorClass = 'text-gray-300';
        labelBg = 'bg-green-500/10 border-green-500/20 text-green-500';
    }

    const li = document.createElement('li');
    li.className = `flex flex-col py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors rounded-lg px-2`;

    let htmlContent = `<div class="flex justify-between items-start w-full gap-4">
        <span class="font-medium flex items-start gap-2 max-w-[70%] leading-snug text-gray-300">
            <span class="text-purple-500 shrink-0 select-none font-bold">→</span>
            <span class="break-all tracking-tight">${filename}</span>
        </span>
        <span class="text-[10px] tracking-widest font-bold uppercase shrink-0 px-2.5 py-1 rounded-md border shadow-inner ${labelBg}">
            ${statusStr}
        </span>
    </div>`;

    if (message && message !== 'POSTED TO VAULT') {
        htmlContent += `<span class="text-xs text-gray-500 mt-2 block leading-relaxed border-l-2 border-white/10 ml-[3px] pl-4 py-0.5">${message}</span>`;
    }

    li.innerHTML = htmlContent;
    logList.prepend(li);
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        authStatusTitle.innerText = "CLEARANCE REJECTED";
        authStatusDetail.innerText = "Account lacks Sovereign-level access.";
        logMessage('SECURITY', `Role '${currentRole}' denied. SOVEREIGN required.`, 'DENIED');
        return;
    }
    // Unlock the upload UI
    authLock.style.opacity = '0';
    setTimeout(() => { authLock.style.display = 'none'; }, 500);
}

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

document.addEventListener('DOMContentLoaded', bootstrap);

function parseCSVRow(text) {
    const results = [];
    let row = [];
    let inQuotes = false;
    let val = '';
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];
        if (c === '"' && inQuotes && next === '"') {
            val += '"';
            i++;
        } else if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            row.push(val);
            val = '';
        } else if ((c === '\n' || c === '\r') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++;
            }
            row.push(val);
            results.push(row);
            row = [];
            val = '';
        } else {
            val += c;
        }
    }
    if (val !== '' || row.length > 0) {
        row.push(val);
        results.push(row);
    }
    return results;
}

let globalLedgerMap = null;

async function handleCsvFile(file) {
    if (!currentUser) {
        alert("Sovereign authorization required to process batches.");
        return;
    }
    logMessage('SYSTEM', `Detected posts.csv. Loading offline metadata...`, 'PROCESSING');
    try {
        const text = await file.text();
        const rows = parseCSVRow(text);
        globalLedgerMap = {};
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 9) continue;
            // post_id: row[0], post_date: row[1], title: row[7], subtitle: row[8]
            globalLedgerMap[row[0]] = {
                postDate: row[1],
                title: row[7],
                subtitle: row[8]
            };
        }
        logMessage('SYSTEM', `Ledger saved to session memory. Mapped ${Object.keys(globalLedgerMap).length} records.`, 'SUCCESS');
        
        if (ledgerStatusDot && ledgerStatusText) {
            ledgerStatusDot.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]';
            ledgerStatusText.innerText = 'Mapped Live';
            ledgerStatusText.classList.replace('text-gray-400', 'text-green-400');
        }
    } catch(err) {
        logMessage('SYSTEM', `Failed to parse posts.csv: ${err.message}`, 'ERROR');
        if (ledgerStatusDot && ledgerStatusText) {
            ledgerStatusDot.className = 'w-2 h-2 rounded-full bg-red-500';
            ledgerStatusText.innerText = 'Failed';
            ledgerStatusText.classList.replace('text-gray-400', 'text-red-400');
        }
    }
}

async function handleHtmlFiles(fileList) {
    if (!currentUser) {
        alert("Sovereign authorization required to process batches.");
        return;
    }
    const htmlFiles = Array.from(fileList).filter(f => f.name.endsWith('.html'));
    
    if (globalLedgerMap && htmlFiles.length > 0) {
        logMessage('SYSTEM', `Using saved ledger data (${Object.keys(globalLedgerMap).length} records) to map metadata.`, 'SUCCESS');
    } else if (!globalLedgerMap && htmlFiles.length > 0) {
        logMessage('SYSTEM', `No ledger found in memory. Falling back to HTML scraping.`, 'PROCESSING');
    }
    
    if (htmlFiles.length > 0) {
        await processBatchedFiles(htmlFiles, globalLedgerMap);
    }
}

// ==========================================
// CSV LEDGER EVENT LISTENERS
// ==========================================
csvDropZone.addEventListener('click', () => {
    if (!currentUser) return;
    csvFileInput.click();
});

csvFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        await handleCsvFile(e.target.files[0]);
    }
    e.target.value = '';
});

csvDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (currentUser) csvDropZone.classList.add('dragover');
});

csvDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    csvDropZone.classList.remove('dragover');
});

csvDropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    csvDropZone.classList.remove('dragover');
    if (!currentUser) return;
    const file = Array.from(e.dataTransfer.files).find(f => f.name.toLowerCase().endsWith('.csv'));
    if (file) await handleCsvFile(file);
});

// ==========================================
// HTML BATCH PAYLOAD EVENT LISTENERS
// ==========================================
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    htmlFileInput.click();
});

htmlDropZone.addEventListener('click', () => {
    if (!currentUser) return;
    htmlFileInput.click();
});

htmlFileInput.addEventListener('change', async (e) => {
    await handleHtmlFiles(e.target.files);
    e.target.value = '';
});

htmlDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (currentUser) htmlDropZone.classList.add('dragover');
});

htmlDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    htmlDropZone.classList.remove('dragover');
});

htmlDropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    htmlDropZone.classList.remove('dragover');
    if (!currentUser) return;
    await handleHtmlFiles(e.dataTransfer.files);
});

async function processBatchedFiles(files, metadataMap) {
    if (files.length === 0) {
        logMessage('SYSTEM', 'No valid HTML files detected in the payload.', 'ERROR');
        return;
    }

    queueCount.innerText = `${files.length} FILES DETECTED`;
    logMessage(`BATCH CONTROLLER`, `Commencing parse of ${files.length} records.`, 'PROCESSING');

    for (let i = 0; i < files.length; i++) {
        await parseAndCommit(files[i], metadataMap);
    }

    logMessage('BATCH CONTROLLER', 'All queued files processed.', 'SUCCESS');
}

async function parseAndCommit(file, metadataMap) {
    try {
        const textContent = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');

        let slugBase = file.name.replace('.html', '');
        const slugParts = slugBase.split('.');
        if (slugParts.length > 1 && !isNaN(slugParts[0])) {
            slugBase = slugParts.slice(1).join('-');
        }

        // ==========================================
        // LEDGER LOOKUP OR FALLBACK
        // ==========================================
        let title = '';
        let subtitle = null;
        let postDate = null;
        
        // Exact filename without .html matches the post_id in Substack posts.csv
        const lookupId = file.name.replace('.html', '');

        if (metadataMap && metadataMap[lookupId]) {
            const meta = metadataMap[lookupId];
            title = meta.title || '';
            subtitle = meta.subtitle || null;
            if (meta.postDate) {
                postDate = new Date(meta.postDate).toISOString();
            }
        } 

        // If no CSV mapping provided or slug not found, use HTML fallbacks
        if (!title) {
            const titleRegex = /(?:"|&quot;)title(?:"|&quot;)\s*:\s*(?:"|&quot;)(.*?)(?:"|&quot;)/;
            const titleMatch = textContent.match(titleRegex);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
                title = title.split(' - ')[0].split(' | ')[0].trim();
            } else {
                const titleEl = doc.querySelector('h1.post-title') || doc.querySelector('title');
                if (titleEl && (titleEl.textContent || '').trim() !== '') {
                    title = (titleEl.textContent || '').split(' - ')[0].split(' | ')[0].trim();
                } else {
                    title = slugBase.split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
            }
        }

        if (subtitle === null && (!metadataMap || !metadataMap[lookupId])) {
            const subtitleRegex = /(?:"|&quot;)subtitle(?:"|&quot;)\s*:\s*(?:"|&quot;)(.*?)(?:"|&quot;)/;
            const subtitleMatch = textContent.match(subtitleRegex);
            if (subtitleMatch && subtitleMatch[1]) {
                subtitle = subtitleMatch[1].replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16))).trim();
            } else {
                const subtitleEl = doc.querySelector('h3.subtitle') || doc.querySelector('h2.subtitle');
                subtitle = subtitleEl ? (subtitleEl.textContent || '').trim() : null;
            }
        }

        if (!postDate) {
            const postDateRegex = /(?:"|&quot;)post_date(?:"|&quot;)\s*:\s*(?:"|&quot;)(\d{4}-\d{2}-\d{2})(?:T|["']|&quot;)/;
            const dtRegex = /datetime=["'](\d{4}-\d{2}-\d{2})/;
            const pdMatch = textContent.match(postDateRegex);
            if (pdMatch) {
                postDate = new Date(pdMatch[1]).toISOString();
            } else {
                const dtMatch = textContent.match(dtRegex);
                if (dtMatch) {
                    postDate = new Date(dtMatch[1]).toISOString();
                }
            }
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

            // Find any wrapping link and obliterate it
            const parentLink = img.closest('a');
            if (parentLink) {
                parentLink.parentNode.insertBefore(img, parentLink);
                parentLink.remove();
            }

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
                    logMessage('PROXY SWAP', `Successfully routed image ${idx + 1} to bucket.`, 'SUCCESS');

                } catch (err) {
                    logMessage('PROXY EXCEPTION', `Image ${idx + 1} processing failed: ${err.message}`, 'ERROR');
                }
            }
        });

        await Promise.all(proxyPromises);

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

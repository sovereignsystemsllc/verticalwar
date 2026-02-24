
console.log('/// SIGNAL TOWER FEED V4 LOADED ///');
// CONFIG - USING GLOBAL SUPABASE CLIENT (MATCHING VERIFY_NOTIFICATIONS.HTML)
const SUPABASE_URL = 'https://zazzwdaexhkeusfjdphv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg';

// DOM ELEMENTS
// DOM ELEMENTS
// Moved inside fetchSignals to ensure DOM is ready

// FUNCTION: FETCH SIGNALS
async function fetchSignals() {
    // DOM ELEMENTS - Select inside function to ensure DOM is ready
    const signalFeed = document.getElementById('signal-feed') || document.getElementById('signal-feed-widget');

    if (!signalFeed) {
        console.error('/// SIGNAL TOWER: CONTAINER NOT FOUND (Checked #signal-feed and #signal-feed-widget) ///');
        return;
    }

    try {
        console.log('/// SIGNAL TOWER: INITIATING FEED (V2 CLIENT) ///');

        // Use global window.supabase if available (injected via CDN)
        if (!window.supabase) {
            throw new Error('Supabase client library not loaded (window.supabase is undefined).');
        }

        const { createClient } = window.supabase;
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data, error } = await supabase
            .from('signals')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        console.log('/// SIGNAL TOWER: DATA RECEIVED ///', data);
        renderSignals(data, signalFeed);

    } catch (error) {
        console.error('/// SIGNAL TOWER: CRITICAL ERROR ///', error);
        signalFeed.innerHTML = `<div class="signal-item error">
            <div class="signal-header">
                <span class="signal-frequency">ERROR::INIT_FAIL</span>
                <span class="signal-timestamp">NOW</span>
            </div>
            <div class="signal-body">
                SIGNAL LOST... CHECK CONSOLE LOGS.<br>
                ${error.message || JSON.stringify(error)}
            </div>
        </div>`;
    }
}

// FUNCTION: RENDER SIGNALS WITH CIPHER LOCK
function renderSignals(signals, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!signals || signals.length === 0) {
        container.innerHTML = `<div class="signal-item">
            <div class="signal-body">NO SIGNALS DETECTED... LISTENING...</div>
        </div>`;
        return;
    }

    signals.forEach(signal => {
        const date = new Date(signal.created_at).toLocaleString('en-US', {
            hour12: false,
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isLocked = !!signal.cipher;
        const signalId = signal.id;

        const signalElement = document.createElement('div');
        signalElement.className = 'signal-item border-b border-zinc-800 pb-4 mb-4 last:border-0';

        let contentHtml = '';

        if (isLocked) {
            // LOCKED STATE
            contentHtml = `
                <div id="lock-${signalId}">
                    <div class="text-terminal-red font-bold tracking-widest mb-2">[ ENCRYPTED SIGNAL ]</div>
                    <div class="text-zinc-600 text-[10px] mb-2">SECURE CIPHER REQUIRED</div>
                    <div class="flex gap-2">
                        <input type="text" id="input-${signalId}" placeholder="ENTER KEY..." 
                            class="bg-black border border-zinc-700 text-white px-2 py-1 text-xs outline-none focus:border-terminal-red uppercase w-32">
                        <button onclick="unlockSignal('${signalId}', '${signal.cipher}')" 
                            class="bg-zinc-800 hover:bg-terminal-red text-white px-3 py-1 text-xs border border-zinc-700">
                            DECRYPT
                        </button>
                    </div>
                    <div id="error-${signalId}" class="text-terminal-red text-[10px] mt-2 hidden">INVALID CIPHER</div>
                </div>
                <div id="content-${signalId}" class="signal-content hidden mt-2 animate-pulse text-terminal-green">
                    ${signal.content}
                </div>
            `;
        } else {
            // UNLOCKED STATE
            contentHtml = `<div class="signal-content">${signal.content}</div>`;
        }

        signalElement.innerHTML = `
            <div class="signal-header flex justify-between text-[10px] text-zinc-500 mb-1 font-mono">
                <span class="signal-frequency text-command-red">${signal.frequency || 'FREQ-UNK'}</span>
                <span class="signal-timestamp">${date}</span>
                <span class="signal-source">${signal.source || 'UNK'}</span>
            </div>
            <div class="signal-body font-mono text-xs">
                <div class="signal-title font-bold text-white mb-1">${signal.title || 'ENCRYPTED SIGNAL'}</div>
                ${contentHtml}
            </div>
        `;
        container.appendChild(signalElement);
    });
}

// GLOBAL UNLOCK FUNCTION
window.unlockSignal = function (id, correctCipher) {
    const input = document.getElementById(`input-${id}`);
    const lockPanel = document.getElementById(`lock-${id}`);
    const contentPanel = document.getElementById(`content-${id}`);
    const errorMsg = document.getElementById(`error-${id}`);

    if (input.value.trim() === correctCipher) {
        // SUCCESS
        lockPanel.innerHTML = '<div class="text-green-500 text-[10px] tracking-widest">[ DECRYPTION SUCCESSFUL ]</div>';
        setTimeout(() => {
            lockPanel.classList.add('hidden');
            contentPanel.classList.remove('hidden');
        }, 1000);
    } else {
        // FAIL
        errorMsg.classList.remove('hidden');
        input.classList.add('border-red-500');
        setTimeout(() => {
            errorMsg.classList.add('hidden');
            input.classList.remove('border-red-500');
        }, 2000);
    }
}

// INIT
document.addEventListener('DOMContentLoaded', fetchSignals);

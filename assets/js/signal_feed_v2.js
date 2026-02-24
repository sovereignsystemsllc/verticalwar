
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

// FUNCTION: RENDER SIGNALS
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

        const signalElement = document.createElement('div');
        signalElement.className = 'signal-item';
        signalElement.innerHTML = `
            <div class="signal-header">
                <span class="signal-frequency">${signal.frequency || 'UNK'}</span>
                <span class="signal-timestamp">${date}</span>
                <span class="signal-source">${signal.source || 'UNKNOWN'}</span>
            </div>
            <div class="signal-body">
                <div class="signal-title">${signal.title || 'ENCRYPTED SIGNAL'}</div>
                <div class="signal-content">${signal.content}</div>
                ${signal.cipher ? `<div class="signal-cipher">Cipher Key: ${signal.cipher}</div>` : ''}
            </div>
            <a href="/terminal/receipt-protocol/index.html?view=signal" class="signal-action">Analyze Signal >></a>
        `;
        container.appendChild(signalElement);
    });
}

// INIT
document.addEventListener('DOMContentLoaded', fetchSignals);


// CONFIG - USING GLOBAL SUPABASE CLIENT
const SUPABASE_URL = 'https://zazzwdaexhkeusfjdphv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg';

// DOM ELEMENTS
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const form = document.getElementById('transmitter-form');
const signalIdInput = document.getElementById('signal-id');
const titleInput = document.getElementById('signal-title');
const sourceInput = document.getElementById('signal-source');
const contentInput = document.getElementById('signal-content');
const cipherInput = document.getElementById('signal-cipher');

const broadcastBtn = document.getElementById('broadcast-btn');
const cancelBtn = document.getElementById('cancel-btn');
const statusDisplay = document.getElementById('status-display');
const historyTableBody = document.getElementById('history-table-body');

// INIT CLIENT
let supabase;

// FUNCTION: INIT
async function init() {
    try {
        if (!window.supabase) {
            throw new Error('Supabase client library not loaded.');
        }
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('/// TRANSMITTER V3: SECURE MODE ONLINE ///');

        // Check Session
        await checkAuth();

        // Event Listeners
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        if (form) form.addEventListener('submit', handleBroadcast);
        if (cancelBtn) cancelBtn.addEventListener('click', resetForm);

    } catch (error) {
        console.error('/// TRANSMITTER: INIT ERROR ///', error);
        updateStatus('SYSTEM ERROR: ' + error.message, 'error');
    }
}

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Logged In
        loginOverlay.classList.add('hidden');
        fetchHistory();
    } else {
        // Logged Out
        loginOverlay.classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const status = document.getElementById('login-status');

    status.innerText = "AUTHENTICATING...";

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        status.innerText = "ACCESS DENIED: " + error.message;
        status.classList.add('animate-pulse');
        return;
    }

    status.innerText = "ACCESS GRANTED.";
    setTimeout(() => {
        loginOverlay.classList.add('hidden');
        fetchHistory();
    }, 500);
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// ==========================================
// CRUD LOGIC
// ==========================================

async function fetchHistory() {
    historyTableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-zinc-600 animate-pulse">SCANNING LOGS...</td></tr>';

    const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('FETCH ERROR:', error);
        historyTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-terminal-red">ERROR: ${error.message}</td></tr>`;
        return;
    }

    renderHistory(data);
}

function renderHistory(signals) {
    if (!signals || signals.length === 0) {
        historyTableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-zinc-600">NO SIGNALS DETECTED.</td></tr>';
        return;
    }

    historyTableBody.innerHTML = signals.map(signal => {
        const date = new Date(signal.created_at).toLocaleString('en-US', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <tr class="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                <td class="py-3 font-mono text-zinc-500">${date}</td>
                <td class="py-3 font-bold text-white">${signal.title || 'UNKNOWN'}</td>
                <td class="py-3 font-mono text-terminal-green">${signal.cipher || 'OPEN'}</td>
                <td class="py-3 text-right">
                    <button onclick="editSignal('${signal.id}')" class="text-xs text-zinc-500 hover:text-white mr-3 underline">[EDIT]</button>
                    <button onclick="deleteSignal('${signal.id}')" class="text-xs text-terminal-red hover:text-white underline">[DEL]</button>
                </td>
            </tr>
        `;
    }).join('');
}

// EXPOSE TO WINDOW FOR HTML BUTTONS
window.editSignal = async function (id) {
    const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        alert("Load Error: " + error.message);
        return;
    }

    // Populate Form
    signalIdInput.value = data.id;
    titleInput.value = data.title || '';
    contentInput.value = data.content || '';
    cipherInput.value = data.cipher || '';
    if (sourceInput) sourceInput.value = data.source || 'Cmd_Override';

    // UI State
    broadcastBtn.textContent = "UPDATE SIGNAL";
    broadcastBtn.classList.add('bg-zinc-800', 'border-white');
    cancelBtn.classList.remove('hidden');

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.deleteSignal = async function (id) {
    if (!confirm("WARNING: PERMANENTLY DELETE SIGNAL?")) return;

    const { error } = await supabase
        .from('signals')
        .delete()
        .eq('id', id);

    if (error) {
        alert("DELETE DETECTED ILLEGAL ACTION: " + error.message);
    } else {
        fetchHistory();
    }
}

// ==========================================
// BROADCAST / UPDATE LOGIC
// ==========================================

async function handleBroadcast(e) {
    e.preventDefault();

    const id = signalIdInput.value;
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const cipher = cipherInput.value.trim();
    const source = sourceInput ? sourceInput.value.trim() : 'Cmd_Override';

    if (!content) {
        updateStatus('ERROR: CONTENT REQUIRED', 'error');
        return;
    }

    updateStatus('TRANSMITTING...', 'info');
    broadcastBtn.disabled = true;

    const payload = {
        title: title || 'ENCRYPTED SIGNAL',
        content: content,
        cipher: cipher || null,
        source: source
    };

    let result;

    if (id) {
        // UPDATE MODE
        result = await supabase.from('signals').update(payload).eq('id', id);
    } else {
        // CREATE MODE
        result = await supabase.from('signals').insert([payload]);
    }

    const { data, error } = result;

    if (error) {
        updateStatus('TX FAILED: ' + error.message, 'error');
        console.error('TX ERROR:', error);
    } else {
        updateStatus('TRANSMISSION SUCCESS', 'success');
        resetForm();
        fetchHistory();
    }

    broadcastBtn.disabled = false;
}

function resetForm() {
    form.reset();
    signalIdInput.value = '';
    broadcastBtn.textContent = "BROADCAST SIGNAL";
    broadcastBtn.classList.remove('bg-zinc-800', 'border-white');
    cancelBtn.classList.add('hidden');
}

function updateStatus(msg, type = 'info') {
    statusDisplay.textContent = `> ${msg}`;
    if (type === 'error') statusDisplay.className = "text-center text-xs text-terminal-red mt-2 h-4 animate-pulse";
    else if (type === 'success') statusDisplay.className = "text-center text-xs text-terminal-green mt-2 h-4";
    else statusDisplay.className = "text-center text-xs text-zinc-500 mt-2 h-4";
}

// START
document.addEventListener('DOMContentLoaded', init);

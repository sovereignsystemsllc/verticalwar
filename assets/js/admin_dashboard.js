
// =============================================================================
// ADMIN DASHBOARD CONTROLLER // V3.1 (MOBILE FIX)
// INTEGRATES: Signals, Tickets, Users, Broadcast
// =============================================================================

const SUPABASE_URL = 'https://zazzwdaexhkeusfjdphv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg';

// --- DOM ELEMENTS ---
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Signal Forms
const form = document.getElementById('transmitter-form');
const signalIdInput = document.getElementById('signal-id');
const titleInput = document.getElementById('signal-title');
const sourceInput = document.getElementById('signal-source');
const contentInput = document.getElementById('signal-content');
const cipherInput = document.getElementById('signal-cipher');
const broadcastBtn = document.getElementById('broadcast-btn');
const cancelBtn = document.getElementById('cancel-btn');
const statusDisplay = document.getElementById('status-display');

// Feeds (Replaced Tables)
const historyFeed = document.getElementById('history-feed');
const ticketFeed = document.getElementById('ticket-feed');
const userFeed = document.getElementById('user-feed');

// Broadcast
const blastInput = document.getElementById('blast-message');
const blastBtn = document.getElementById('blast-btn');
const blastStatus = document.getElementById('blast-status');

// Counters/Pagination
let userPage = 0;
const USERS_PER_PAGE = 5;

// INIT
let supabase;

async function init() {
    try {
        if (!window.supabase) throw new Error('Supabase Client Missing');
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('/// ADMIN CONSOLE v3.1 ONLINE ///');

        await checkAuth();

        // Listeners
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        // Signal Tools
        if (form) form.addEventListener('submit', handleSignalSubmit);
        if (cancelBtn) cancelBtn.addEventListener('click', resetSignalForm);

        // Blast Tool
        if (blastBtn) blastBtn.addEventListener('click', handleGlobalBlast);

        // Load More Users
        const loadMoreUsersBtn = document.getElementById('load-more-users');
        if (loadMoreUsersBtn) loadMoreUsersBtn.addEventListener('click', () => fetchUsers(true));

    } catch (e) {
        console.error("INIT FATAL:", e);
        alert("SYSTEM FAILURE: " + e.message);
    }
}

// --- AUTH (RBAC) ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // CHECK ROLE
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error || !profile || profile.role !== 'Sovereign') {
            console.warn("ACCESS DENIED: Role is", profile?.role);
            logoutBtn.click();
            return;
        }

        console.log("ACCESS GRANTED: SOVEREIGN DETECTED");
        loginOverlay.classList.add('hidden');
        loadAllData();
    } else {
        loginOverlay.classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const status = document.getElementById('login-status');
    status.innerText = "VERIFYING...";

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        status.innerText = "DENIED: " + error.message;
        return;
    }
    status.innerText = "GRANTED";
    window.location.reload();
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

function loadAllData() {
    fetchHistory(); // Signals
    fetchTickets(); // Feedback
    fetchUsers();   // Profiles
}

// --- 1. SIGNAL TRANSMITTER (Original) ---
async function fetchHistory() {
    if (!historyFeed) return;
    historyFeed.innerHTML = '<div class="text-center py-4 animate-pulse text-zinc-600 text-xs">SCANNING...</div>';
    const { data, error } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) return console.error(error);

    if (!data.length) {
        historyFeed.innerHTML = '<div class="text-center py-4 text-zinc-500 text-xs">NO SIGNALS</div>';
        return;
    }

    historyFeed.innerHTML = data.map(s => `
        <div class="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 last:border-0">
            <div class="flex flex-col">
                <span class="text-[10px] text-zinc-500 font-mono">${new Date(s.created_at).toLocaleDateString()}</span>
                <span class="text-xs font-bold text-white">${s.title}</span>
                <span class="text-[10px] font-mono text-terminal-green">${s.cipher || 'OPEN'}</span>
            </div>
            <button onclick="editSignal('${s.id}')" class="text-xs text-zinc-400 hover:text-white underline p-2">[EDIT]</button>
        </div>
    `).join('');
}

async function handleSignalSubmit(e) {
    e.preventDefault();
    const id = signalIdInput.value;
    const payload = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        cipher: cipherInput.value.trim(),
        source: sourceInput.value.trim() || 'Cmd_Override'
    };

    if (!payload.content) return alert("CONTENT REQUIRED");

    let error;
    if (id) {
        ({ error } = await supabase.from('signals').update(payload).eq('id', id));
    } else {
        ({ error } = await supabase.from('signals').insert([payload]));
    }

    if (error) alert("TX ERROR: " + error.message);
    else {
        resetSignalForm();
        fetchHistory();
    }
}

window.editSignal = async function (id) {
    const { data } = await supabase.from('signals').select('*').eq('id', id).single();
    if (data) {
        signalIdInput.value = data.id;
        titleInput.value = data.title;
        contentInput.value = data.content;
        cipherInput.value = data.cipher;
        sourceInput.value = data.source;
        broadcastBtn.innerText = "UPDATE SIGNAL";
        cancelBtn.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetSignalForm() {
    form.reset();
    signalIdInput.value = '';
    broadcastBtn.innerText = "BROADCAST SIGNAL";
    cancelBtn.classList.add('hidden');
}

// --- 2. TICKET VIEWER (Responsive Card Grid) ---
async function fetchTickets() {
    if (!ticketFeed) return;
    ticketFeed.innerHTML = '<div class="text-center py-4 animate-pulse text-xs text-zinc-600">FETCHING CLASSIFIED INTEL...</div>';
    const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(20);

    if (error) {
        ticketFeed.innerHTML = `<div class="text-center text-red-500 py-4 text-xs">ACCESS DENIED (RLS?)</div>`;
        return;
    }

    if (!data.length) {
        ticketFeed.innerHTML = '<div class="text-center py-4 text-zinc-500 text-xs">NO TICKETS FOUND.</div>';
        return;
    }

    ticketFeed.innerHTML = data.map(t => {
        const canReplyInternal = !!t.user_id;
        const email = t.metadata?.email || t.email;
        const canReplyEmail = !!email;

        let replyBtn = '';
        if (canReplyInternal) {
            replyBtn = `<button onclick="replyTicket('${t.user_id}', '${t.id}')" class="text-xs text-terminal-green hover:text-white mr-2 border border-terminal-green px-2 py-1">[REPLY]</button>`;
        } else if (canReplyEmail) {
            replyBtn = `<a href="mailto:${email}?subject=Ref: Signal ${t.id}" class="text-xs text-blue-400 hover:text-white mr-2 border border-blue-400 px-2 py-1 decoration-none">[EMAIL]</a>`;
        } else {
            replyBtn = `<span class="text-[10px] text-zinc-600 mr-2 border border-zinc-800 px-2 py-1">[ANON]</span>`;
        }

        return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors items-start">
            <!-- TIME -->
            <div class="col-span-1 md:col-span-2">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold mr-2">TIME:</span>
                <span class="text-zinc-500 font-mono text-xs">${new Date(t.created_at).toLocaleDateString()} ${new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <!-- TYPE -->
            <div class="col-span-1 md:col-span-2">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold mr-2">TYPE:</span>
                <span class="text-white text-xs font-bold uppercase bg-zinc-800 px-1 rounded">${t.type || 'BUG'}</span>
            </div>
            <!-- PAYLOAD -->
            <div class="col-span-1 md:col-span-6">
                <p class="text-zinc-300 text-sm whitespace-pre-wrap">${t.message}</p>
                ${email ? `<div class="text-[10px] text-zinc-500 mt-1">CONTACT: ${email}</div>` : ''}
            </div>
            <!-- ACTIONS -->
            <div class="col-span-1 md:col-span-2 text-left md:text-right mt-2 md:mt-0 flex md:justify-end gap-2">
                ${replyBtn}
                <button onclick="deleteTicket('${t.id}')" class="text-xs text-terminal-red hover:text-white border border-terminal-red px-2 py-1">[DEL]</button>
            </div>
        </div>
    `}).join('');
}

window.deleteTicket = async function (id) {
    if (!confirm("Delete this ticket?")) return;
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchTickets();
}

window.replyTicket = async function (userId, ticketId) {
    const msg = prompt("ENTER REPLY MESSAGE:\n(Will appear in user's secure inbox)");
    if (!msg) return;

    const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'admin_reply',
        message: `RE: Ticket ${ticketId} // ${msg}`,
        actor_id: (await supabase.auth.getUser()).data.user.id
    });

    if (error) alert("REPLY FAILED: " + error.message);
    else alert("REPLY SENT.");
}

// --- 3. USER VIEWER (Responsive Card Grid) ---
async function fetchUsers(append = false) {
    if (!userFeed) return;
    if (!append) {
        userPage = 0;
        userFeed.innerHTML = '<div class="text-center py-4 animate-pulse text-xs text-zinc-600">LOCATING OPERATIVES...</div>';
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(userPage * USERS_PER_PAGE, (userPage + 1) * USERS_PER_PAGE - 1);

    if (error) {
        if (!append) userFeed.innerHTML = `<div class="text-center text-red-500 py-4 text-xs">ACCESS DENIED</div>`;
        return;
    }

    const html = data.map(u => `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors items-center">
             <!-- JOINED -->
            <div class="col-span-1 md:col-span-2 flex items-center">
                 <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold w-16">JOINED:</span>
                <span class="text-zinc-500 font-mono text-xs">${new Date(u.created_at).toLocaleDateString()}</span>
            </div>
             <!-- USER -->
            <div class="col-span-1 md:col-span-3 flex items-center">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold w-16">USER:</span>
                <span class="text-white text-xs font-mono font-bold">${u.username || 'UNKNOWN'}</span>
            </div>
             <!-- EMAIL -->
            <div class="col-span-1 md:col-span-3 flex items-center overflow-hidden">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold w-16">EMAIL:</span>
                <span class="text-zinc-400 text-xs truncate" title="${u.email}">${u.email || 'HIDDEN'}</span>
            </div>
             <!-- UUID -->
            <div class="col-span-1 md:col-span-2 flex items-center">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold w-16">UUID:</span>
                <span class="text-zinc-600 text-xs font-mono">${u.id.substring(0, 8)}...</span>
            </div>
             <!-- RANK -->
            <div class="col-span-1 md:col-span-2 flex items-center md:justify-end">
                <span class="md:hidden text-[10px] text-zinc-600 uppercase font-bold w-16">RANK:</span>
                <span class="text-terminal-green text-xs font-mono bg-green-900/10 px-1 rounded">${u.role || 'OBSERVER'}</span>
            </div>
        </div>
    `).join('');

    if (!append) userFeed.innerHTML = html;
    else userFeed.insertAdjacentHTML('beforeend', html);

    if (data.length < USERS_PER_PAGE) {
        document.getElementById('load-more-users').classList.add('hidden');
    } else {
        document.getElementById('load-more-users').classList.remove('hidden');
    }

    userPage++;
}

// --- 4. GLOBAL BLAST (RESTORED) ---
async function handleGlobalBlast() {
    const msg = blastInput.value.trim();
    if (!msg) return alert("TYPE A MESSAGE, OPERATOR.");
    if (!confirm(`WARNING: BROADCASTING TO ALL USERS:\n\n"${msg}"\n\nProceed?`)) return;

    blastBtn.disabled = true;
    blastStatus.innerText = "TRANSMITTING...";

    // Call RPC
    const { data, error } = await supabase.rpc('admin_broadcast', {
        message_content: msg,
        signal_type: 'system_alert'
    });

    if (error) {
        blastStatus.innerText = "FAILURE: " + error.message;
        blastStatus.classList.add('text-red-500');
    } else {
        blastStatus.innerText = `SUCCESS. SENT TO ${data.recipients} TARGETS.`;
        blastStatus.classList.add('text-green-500');
        blastInput.value = '';
    }

    setTimeout(() => {
        blastBtn.disabled = false;
        if (!error) blastStatus.innerText = "READY";
        blastStatus.classList.remove('text-red-500', 'text-green-500');
    }, 5000);
}

// START
document.addEventListener('DOMContentLoaded', init);

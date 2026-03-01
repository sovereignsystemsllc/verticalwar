import { supabase } from './supabaseClient.js';

export let currentUser = null;
export let currentRole = 'GUEST';

// DOM Elements
const loginModal = document.getElementById('login-modal');
const btnToggleLogin = document.getElementById('btn-toggle-login');
const btnCloseLogin = document.getElementById('btn-close-login');
const btnSubmitLogin = document.getElementById('btn-submit-login');
const emailInput = document.getElementById('login-email');
const passInput = document.getElementById('login-password');
const errorMsg = document.getElementById('login-error');

// Event defined in main.js, this just calls it
let onAuthChangeCallback = null;

export function setAuthChangeCallback(cb) {
    onAuthChangeCallback = cb;
}

export async function initAuth() {
    // 1. Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await handleSessionData(session.user);
    } else {
        updateAuthUI();
    }

    // 2. Listen to changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await handleSessionData(session.user);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            currentRole = 'GUEST';
            updateAuthUI();
            if (onAuthChangeCallback) onAuthChangeCallback();
        }
    });

    // 3. Bind UI (Only if UI exists on the page)
    // Use document event delegation to catch clicks on any login toggle button,
    // including those injected later by sidebar.js (#btn-sidebar-login)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#btn-toggle-login, #btn-sidebar-login');
        if (!toggleBtn) return;

        if (currentUser) {
            supabase.auth.signOut();
        } else {
            if (loginModal) {
                loginModal.classList.remove('hidden');
                errorMsg.classList.add('hidden');
            }
        }
    });

    if (loginModal) {
        btnCloseLogin.addEventListener('click', () => {
            loginModal.classList.add('hidden');
        });

        btnSubmitLogin.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passInput.value;
            if (!email || !password) return;

            btnSubmitLogin.innerText = "AUTHENTICATING...";
            errorMsg.classList.add('hidden');

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                loginModal.classList.add('hidden');
                emailInput.value = '';
                passInput.value = '';
            } catch (e) {
                errorMsg.innerText = "ERROR: " + e.message;
                errorMsg.classList.remove('hidden');
            } finally {
                btnSubmitLogin.innerText = "INITIATE OVERRIDE";
            }
        });
    }
}

async function handleSessionData(user) {
    currentUser = user;
    currentRole = 'USER'; // Default authenticated role

    // Check profiles table for Operator status
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            currentRole = data.role;
        }
    } catch (e) { /* ignore, default to USER */ }

    // Hard fallback: If it's Ethan's known email, force Sovereign to prevent lockouts during bootstrapping
    if (user.email === 'ethan@verticalwar.com') {
        currentRole = 'SOVEREIGN';
    }

    updateAuthUI();
    if (onAuthChangeCallback) onAuthChangeCallback();
}

function updateAuthUI() {
    const btnSidebarLogin = document.getElementById('btn-sidebar-login');
    const toggleBtns = [];
    if (btnToggleLogin) toggleBtns.push(btnToggleLogin);
    if (btnSidebarLogin) toggleBtns.push(btnSidebarLogin);

    if (toggleBtns.length === 0) return; // Silent return if not on main page

    toggleBtns.forEach(btn => {
        if (currentUser) {
            if (currentRole === 'SOVEREIGN') {
                btn.innerHTML = '<span class="text-yellow-500">[ LOGOUT SOVEREIGN ]</span>';
            } else if (currentRole === 'OPERATOR') {
                btn.innerHTML = '<span class="text-red-500">[ LOGOUT OPERATOR ]</span>';
            } else {
                btn.innerHTML = `[ LOGOUT ]`;
            }
        } else {
            btn.innerHTML = `[ LOGIN ]`;
        }
    });
}

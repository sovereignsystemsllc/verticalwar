import { supabase } from './supabaseClient.js';

export let currentUser = null;
export let currentRole = 'GUEST';

// Event defined in main.js, this just calls it
let onAuthChangeCallback = null;

export function setAuthChangeCallback(cb) {
    onAuthChangeCallback = cb;
}

export async function initAuth() {
    // DOM Elements — resolved here so importing auth.js on any page is safe
    const loginModal = document.getElementById('login-modal');
    const btnToggleLogin = document.getElementById('btn-toggle-login');
    const btnCloseLogin = document.getElementById('btn-close-login');
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error');

    // 1. Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await handleSessionData(session.user);
    } else {
        updateAuthUI();
        if (onAuthChangeCallback) onAuthChangeCallback();
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

    // 3. Bind UI
    // Register button — opens modal directly on register tab
    document.addEventListener('click', (e) => {
        const regBtn = e.target.closest('#btn-sidebar-register');
        if (regBtn) {
            const m = document.getElementById('login-modal');
            if (m) { m.classList.remove('hidden'); _modalSetMode('register'); }
            return;
        }
    });

    // Delegation catches clicks on sidebar #btn-toggle-login and any injected variant
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#btn-toggle-login, #btn-sidebar-login');
        if (!toggleBtn) return;

        if (currentUser) {
            supabase.auth.signOut();
        } else {
            // Re-resolve modal since sidebar.js may have injected it after this ran
            const m = document.getElementById('login-modal');
            if (m) {
                m.classList.remove('hidden');
                // Reset to login mode whenever opening
                _modalSetMode('login');
            }
        }
    });

    if (loginModal) {
        // Close on X or backdrop click
        if (btnCloseLogin) btnCloseLogin.addEventListener('click', () => loginModal.classList.add('hidden'));
        loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.add('hidden'); });

        // ── TAB SWITCHING ─────────────────────────────────────────────────────
        const tabLogin = document.getElementById('modal-tab-login');
        const tabRegister = document.getElementById('modal-tab-register');
        if (tabLogin) tabLogin.addEventListener('click', () => _modalSetMode('login'));
        if (tabRegister) tabRegister.addEventListener('click', () => _modalSetMode('register'));

        const btnBackToLogin = document.getElementById('modal-back-to-login');
        if (btnBackToLogin) btnBackToLogin.addEventListener('click', () => _modalSetMode('login'));

        // ── SUBMIT ────────────────────────────────────────────────────────────
        if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', async () => {
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';
            if (!email || !password) return;

            const isRegister = btnSubmitLogin.dataset.mode === 'register';

            if (errorMsg) { errorMsg.textContent = ''; errorMsg.classList.add('hidden'); }
            btnSubmitLogin.textContent = isRegister ? 'REGISTERING...' : 'AUTHENTICATING...';
            btnSubmitLogin.disabled = true;

            try {
                if (isRegister) {
                    const confirmInput = document.getElementById('modal-confirm-password');
                    const displayInput = document.getElementById('modal-display-name');
                    const confirm = confirmInput ? confirmInput.value : '';
                    const name = displayInput ? displayInput.value.trim() : '';

                    if (password !== confirm) throw new Error('Passwords do not match.');
                    if (password.length < 8) throw new Error('Password must be at least 8 characters.');

                    const { error } = await supabase.auth.signUp({
                        email, password,
                        options: { data: { display_name: name || null } }
                    });
                    if (error) throw error;

                    // Show success screen
                    const formWrap = document.getElementById('modal-form-wrap');
                    const successEl = document.getElementById('modal-success');
                    const tabs = loginModal.querySelector('.flex.mb-5');
                    if (formWrap) formWrap.classList.add('hidden');
                    if (successEl) successEl.classList.remove('hidden');
                    if (tabs) tabs.classList.add('hidden');

                } else {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    loginModal.classList.add('hidden');
                    if (emailInput) emailInput.value = '';
                    if (passInput) passInput.value = '';
                }
            } catch (err) {
                if (errorMsg) {
                    errorMsg.textContent = 'ERROR: ' + err.message;
                    errorMsg.classList.remove('hidden');
                }
            } finally {
                btnSubmitLogin.textContent = isRegister ? 'CREATE ACCOUNT' : 'INITIATE OVERRIDE';
                btnSubmitLogin.disabled = false;
            }
        });
    }
}

// ── MODAL MODE HELPER ─────────────────────────────────────────────────────────
function _modalSetMode(mode) {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;

    const tabLogin = document.getElementById('modal-tab-login');
    const tabRegister = document.getElementById('modal-tab-register');
    const fieldName = document.getElementById('modal-field-name');
    const fieldConfirm = document.getElementById('modal-field-confirm');
    const submitBtn = document.getElementById('btn-submit-login');
    const formWrap = document.getElementById('modal-form-wrap');
    const successEl = document.getElementById('modal-success');
    const tabs = loginModal.querySelector('.flex.mb-5');
    const errorMsg = document.getElementById('login-error');
    const passLabel = document.getElementById('modal-pass-label');

    const ACTIVE = 'border-b-2 border-[#a78bfa] text-[#a78bfa]';
    const INACTIVE = 'border-b-2 border-transparent text-[#a78bfa]/40 hover:text-[#a78bfa]/70';

    const isReg = mode === 'register';

    if (tabLogin) tabLogin.className = `flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase transition-all font-mono ${isReg ? INACTIVE : ACTIVE}`;
    if (tabRegister) tabRegister.className = `flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase transition-all font-mono ${isReg ? ACTIVE : INACTIVE}`;

    if (fieldName) fieldName.classList.toggle('hidden', !isReg);
    if (fieldConfirm) fieldConfirm.classList.toggle('hidden', !isReg);
    if (passLabel) passLabel.textContent = isReg ? 'Password' : 'Decryption Key';
    if (submitBtn) {
        submitBtn.textContent = isReg ? 'CREATE ACCOUNT' : 'INITIATE OVERRIDE';
        submitBtn.dataset.mode = mode;
    }

    // Reset success/form visibility
    if (formWrap) formWrap.classList.remove('hidden');
    if (successEl) successEl.classList.add('hidden');
    if (tabs) tabs.classList.remove('hidden');
    if (errorMsg) { errorMsg.textContent = ''; errorMsg.classList.add('hidden'); }
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
    // querySelectorAll catches ALL elements with this ID (nav + sidebar both use btn-toggle-login)
    const toggleBtns = [
        ...document.querySelectorAll('#btn-toggle-login'),
        ...document.querySelectorAll('#btn-sidebar-login'),
    ].filter(Boolean);

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

    // Show profile link when logged in
    document.querySelectorAll('#sidebar-profile-link').forEach(el => {
        el.classList.toggle('hidden', !currentUser);
    });

    // Hide register button when logged in
    document.querySelectorAll('#btn-sidebar-register').forEach(el => {
        el.classList.toggle('hidden', !!currentUser);
    });
}


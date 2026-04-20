import { supabase } from './supabaseClient.js';

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const gateForm = document.getElementById('gate-form');
const gateError = document.getElementById('gate-error');
const gateSuccess = document.getElementById('gate-success');
const submitBtn = document.getElementById('gate-submit');
const emailInput = document.getElementById('gate-email');
const passwordInput = document.getElementById('gate-password');
const confirmInput = document.getElementById('gate-confirm-password');
const displayName = document.getElementById('display-name');
const fieldDisplayName = document.getElementById('field-display-name');
const fieldConfirmPassword = document.getElementById('field-confirm-password');
const btnBackToLogin = document.getElementById('btn-back-to-login');

// ── STATE ─────────────────────────────────────────────────────────────────────
let mode = 'login'; // 'login' | 'register'
let isSubmitting = false; // hard gate to prevent double-submit

// ── MODE SWITCH ───────────────────────────────────────────────────────────────
function setMode(m) {
    mode = m;
    clearError();

    const isRegister = m === 'register';

    // Tab styles
    const ACTIVE = 'border-b-2 border-[#a78bfa] text-[#a78bfa]';
    const INACTIVE = 'border-b-2 border-transparent text-[#a78bfa]/40 hover:text-[#a78bfa]/70';
    tabLogin.className = `flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase transition-all ${isRegister ? INACTIVE : ACTIVE}`;
    tabRegister.className = `flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase transition-all ${isRegister ? ACTIVE : INACTIVE}`;

    // Show/hide register-only fields
    fieldDisplayName.classList.toggle('hidden', !isRegister);
    fieldConfirmPassword.classList.toggle('hidden', !isRegister);

    // Update submit label + autocomplete hint
    submitBtn.textContent = isRegister ? 'CREATE ACCOUNT' : 'INITIATE OVERRIDE';
    passwordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');

    // Reset success screen
    gateSuccess.classList.add('hidden');
    gateForm.classList.remove('hidden');
}

tabLogin.addEventListener('click', () => setMode('login'));
tabRegister.addEventListener('click', () => setMode('register'));
btnBackToLogin?.addEventListener('click', () => setMode('login'));

// ── ERROR HELPERS ─────────────────────────────────────────────────────────────
function showError(msg) {
    gateError.textContent = msg;
    gateError.classList.remove('hidden');
}
function clearError() {
    gateError.textContent = '';
    gateError.classList.add('hidden');
}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // hard gate: block any concurrent call
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? 'AUTHENTICATING...' : 'REGISTERING...';

    try {
        if (mode === 'login') {
            // ── LOGIN ─────────────────────────────────────────────────────────
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.replace('/');

        } else {
            // ── REGISTER ──────────────────────────────────────────────────────
            const confirm = confirmInput.value;
            const name = displayName.value.trim();

            if (password !== confirm) {
                throw new Error('Passwords do not match.');
            }
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters.');
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: name || null }
                }
            });
            if (error) throw error;

            // Profile row is inserted by DB trigger (handle_new_user).
            // Show confirmation screen — button stays disabled permanently on success.
            const upsellBtn = document.getElementById('gate-upsell-btn');
            if (upsellBtn) {
                upsellBtn.href = `https://buy.stripe.com/8x2aEX6sn4uUap89qj7Zu04?prefilled_email=${encodeURIComponent(email)}`;
            }

            gateForm.classList.add('hidden');
            gateSuccess.classList.remove('hidden');
            return; // do NOT reset isSubmitting on success
        }

    } catch (err) {
        showError(err.message);
        // Only re-enable on error so the user can try again
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? 'INITIATE OVERRIDE' : 'CREATE ACCOUNT';
    }
});

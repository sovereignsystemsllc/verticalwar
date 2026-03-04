import { supabase } from './supabaseClient.js';

// SOVEREIGN GATE — Standalone login page handler
// Used as a shareable /login URL. On success, redirects to the Codex.

const form = document.getElementById('loginForm');
const errorDiv = document.getElementById('loginError');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.classList.add('hidden');
        errorDiv.innerText = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerText = 'AUTHENTICATING...';

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // On success, send them to the Codex
            window.location.replace('/');
        } catch (err) {
            errorDiv.innerText = 'ACCESS DENIED: ' + err.message;
            errorDiv.classList.remove('hidden');
            if (submitBtn) submitBtn.innerText = 'Initialize Decryption';
        }
    });
}

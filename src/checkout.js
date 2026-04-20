import { supabase } from './supabaseClient.js';

// The Checkout Bridge (Intercepts raw Stripe links and forces registration or attaches email)
document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (!link) return;

    // Synchronously intercept the click to prevent immediate navigation
    e.preventDefault();

    // Check auth status
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // ── UNREGISTERED = FORCE REGISTRATION ──
        const modal = document.getElementById('login-modal');
        if (modal) {
            // Highly-converting: pop the modal inline if available
            modal.classList.remove('hidden');
            const tabRegister = document.getElementById('modal-tab-register');
            if (tabRegister) tabRegister.click();
        } else {
            // Fallback for pages without sidebar/modal
            window.location.href = '/login.html';
        }
    } else {
        // ── REGISTERED = PROCEED WITH INTENT ──
        const email = session.user.email;
        let finalUrl = link.href;
        
        // Auto-hook the Stripe checkout to their established Supabase email
        if (!finalUrl.includes('prefilled_email=')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `prefilled_email=${encodeURIComponent(email)}`;
        }
        
        // Use proper window target to respect the original link if they had target="_blank"
        if (link.target === '_blank') {
            window.open(finalUrl, '_blank');
        } else {
            window.location.href = finalUrl;
        }
    }
});

import { supabase } from './supabaseClient.js';

// ── GUEST NUDGE ───────────────────────────────────────────────────────────────
// Soft bottom nudge for non-authenticated visitors.
// Dismissed state lives in sessionStorage (returns each new browser session).
// Auto-dissolves when user logs in via onAuthStateChange.
// ─────────────────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'vw_guest_dismissed';

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderNudge() {
    // Nudge bar
    const nudge = document.createElement('div');
    nudge.id = 'guest-nudge';
    nudge.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 499;
    background: rgba(5,1,10,0.95);
    border-top: 1px solid rgba(167,139,250,0.25);
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(167,139,250,0.45);
    animation: nudgeUp 0.6s ease forwards;
  `;
    nudge.innerHTML = `
    <span>Create a free account to unlock your archive →</span>
    <button id="gg-nudge-join" style="
      background:none;
      border:1px solid rgba(167,139,250,0.35);
      color:rgba(167,139,250,0.7);
      font-family:monospace;
      font-size:9px;
      letter-spacing:0.2em;
      text-transform:uppercase;
      padding:0.3rem 0.75rem;
      cursor:pointer;
      transition:all 0.2s;
    "
      onmouseover="this.style.background='rgba(167,139,250,0.15)';this.style.color='#a78bfa'"
      onmouseout="this.style.background='none';this.style.color='rgba(167,139,250,0.7)'"
    >[ JOIN ]</button>
    <button id="gg-nudge-close" style="
      background:none;
      border:none;
      color:rgba(167,139,250,0.25);
      font-family:monospace;
      font-size:10px;
      cursor:pointer;
      padding:0 0.25rem;
    ">×</button>
  `;

    // Keyframe injection (once)
    if (!document.getElementById('guest-gate-styles')) {
        const style = document.createElement('style');
        style.id = 'guest-gate-styles';
        style.textContent = `
      @keyframes nudgeUp {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes nudgeDown {
        from { transform: translateY(0); opacity: 1; }
        to   { transform: translateY(100%); opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    document.body.appendChild(nudge);

    // ── WIRE BUTTONS ──────────────────────────────────────────────────────────

    // Nudge join → open register modal
    document.getElementById('gg-nudge-join')?.addEventListener('click', () => {
        document.getElementById('btn-nav-register')?.click();
    });

    // Nudge close → hide nudge bar for this session
    document.getElementById('gg-nudge-close')?.addEventListener('click', () => {
        dismissNudge();
    });
}

// ── DISMISS (shame path) ──────────────────────────────────────────────────────
function dismissNudge() {
    const nudge = document.getElementById('guest-nudge');
    if (!nudge) return;

    nudge.style.animation = 'nudgeDown 0.35s ease forwards';
    setTimeout(() => nudge.remove(), 350);

    sessionStorage.setItem(DISMISSED_KEY, '1');
}

// ── REMOVE (logged in path) ───────────────────────────────────────────────────
function removeNudge() {
    const nudge = document.getElementById('guest-nudge');
    if (nudge) {
        nudge.style.animation = 'nudgeDown 0.35s ease forwards';
        setTimeout(() => nudge.remove(), 350);
    }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function initGuestGate() {
    // 1. Already dismissed this session → skip
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // 2. Already logged in → skip
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;

    // 3. Show the nudge
    renderNudge();

    // 4. Auto-remove when user logs in
    supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
            removeNudge();
        }
    });
}

// Run immediately when module loads
initGuestGate();

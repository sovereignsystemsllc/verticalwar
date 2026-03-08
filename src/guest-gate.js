import { supabase } from './supabaseClient.js';

// ── GUEST GATE ────────────────────────────────────────────────────────────────
// Full-screen FOMO overlay for non-authenticated visitors.
// Dismissed state lives in sessionStorage (returns each new browser session).
// Auto-dissolves when user logs in via onAuthStateChange.
// ─────────────────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'vw_guest_dismissed';

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderGate() {
    // Gate overlay
    const gate = document.createElement('div');
    gate.id = 'guest-gate';
    gate.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(5, 1, 10, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: gateIn 0.4s ease forwards;
  `;

    gate.innerHTML = `
    <div style="
      width: 100%;
      max-width: 480px;
      background: #05010a;
      border: 1px solid rgba(167,139,250,0.35);
      box-shadow: 0 0 60px rgba(167,139,250,0.12), inset 0 0 40px rgba(167,139,250,0.03);
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
      font-family: monospace;
      position: relative;
    ">

      <!-- Pulse indicator -->
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:-0.5rem;">
        <span style="
          width:8px;height:8px;border-radius:50%;
          background:#a78bfa;
          display:inline-block;
          animation:pulse 1.5s infinite;
        "></span>
        <span style="font-size:9px;letter-spacing:0.25em;color:rgba(167,139,250,0.5);text-transform:uppercase;">
          SOVEREIGN SYSTEM // ACCESS RESTRICTED
        </span>
      </div>

      <!-- Headline -->
      <div>
        <h2 style="
          font-size:clamp(1.1rem,4vw,1.5rem);
          font-weight:900;
          color:#ffffff;
          letter-spacing:0.1em;
          text-transform:uppercase;
          line-height:1.2;
          margin:0 0 0.75rem;
        ">// TRANSMISSION RESTRICTED //</h2>
        <p style="
          font-size:11px;
          color:rgba(167,139,250,0.7);
          letter-spacing:0.08em;
          line-height:1.7;
          margin:0;
        ">
          You're looking at the surface.<br>
          <span style="color:rgba(255,255,255,0.65);">Members see everything.</span>
        </p>
      </div>

      <!-- Locked features -->
      <div style="display:flex;flex-wrap:wrap;gap:0.6rem;justify-content:center;">
        ${['READING LIST', 'PERSONAL ARCHIVE', 'LEXICON'].map(f => `
          <span style="
            font-size:9px;
            letter-spacing:0.2em;
            text-transform:uppercase;
            color:rgba(167,139,250,0.45);
            border:1px solid rgba(167,139,250,0.2);
            padding:0.4rem 0.8rem;
          ">[ ${f} 🔒 ]</span>
        `).join('')}
      </div>

      <!-- Member count teaser -->
      <p style="
        font-size:9px;
        color:rgba(167,139,250,0.35);
        letter-spacing:0.15em;
        text-transform:uppercase;
        margin-top:-0.5rem;
      ">Join the readers who are building their archive.</p>

      <!-- CTAs -->
      <div style="display:flex;flex-direction:column;gap:0.75rem;width:100%;">
        <button id="gg-btn-register" style="
          width:100%;
          background:rgba(167,139,250,0.12);
          border:1px solid rgba(167,139,250,0.6);
          color:#a78bfa;
          font-family:monospace;
          font-size:11px;
          font-weight:900;
          letter-spacing:0.25em;
          text-transform:uppercase;
          padding:0.85rem 1.5rem;
          cursor:pointer;
          transition:background 0.2s, color 0.2s;
        "
          onmouseover="this.style.background='#a78bfa';this.style.color='#000'"
          onmouseout="this.style.background='rgba(167,139,250,0.12)';this.style.color='#a78bfa'"
        >[ REGISTER FREE ]</button>

        <button id="gg-btn-login" style="
          width:100%;
          background:transparent;
          border:1px solid rgba(167,139,250,0.25);
          color:rgba(167,139,250,0.6);
          font-family:monospace;
          font-size:11px;
          font-weight:700;
          letter-spacing:0.25em;
          text-transform:uppercase;
          padding:0.85rem 1.5rem;
          cursor:pointer;
          transition:border-color 0.2s, color 0.2s;
        "
          onmouseover="this.style.borderColor='rgba(167,139,250,0.6)';this.style.color='rgba(167,139,250,1)'"
          onmouseout="this.style.borderColor='rgba(167,139,250,0.25)';this.style.color='rgba(167,139,250,0.6)'"
        >[ LOG IN ]</button>
      </div>

      <!-- Shame dismiss -->
      <button id="gg-btn-dismiss" style="
        background:none;
        border:none;
        color:rgba(167,139,250,0.25);
        font-family:monospace;
        font-size:9px;
        letter-spacing:0.12em;
        cursor:pointer;
        padding:0;
        margin-top:-0.5rem;
        transition:color 0.2s;
        text-decoration:underline;
        text-underline-offset:3px;
      "
        onmouseover="this.style.color='rgba(167,139,250,0.45)'"
        onmouseout="this.style.color='rgba(167,139,250,0.25)'"
      >No thanks, I'll browse without saving anything.</button>

    </div>
  `;

    // Nudge bar (hidden until dismiss)
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
    display: none;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(167,139,250,0.45);
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
      @keyframes gateIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes gateOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    document.body.appendChild(gate);
    document.body.appendChild(nudge);

    // ── WIRE BUTTONS ──────────────────────────────────────────────────────────

    // Register → open login modal on register tab
    document.getElementById('gg-btn-register').addEventListener('click', () => {
        document.getElementById('btn-nav-register')?.click();
    });

    // Login → open login modal on login tab
    document.getElementById('gg-btn-login').addEventListener('click', () => {
        document.getElementById('btn-toggle-login')?.click();
    });

    // Dismiss → fade out, set sessionStorage, show nudge
    document.getElementById('gg-btn-dismiss').addEventListener('click', () => {
        dismissGate();
    });

    // Nudge join → open register modal
    document.getElementById('gg-nudge-join')?.addEventListener('click', () => {
        document.getElementById('btn-nav-register')?.click();
    });

    // Nudge close → hide nudge bar for this session
    document.getElementById('gg-nudge-close')?.addEventListener('click', () => {
        nudge.style.display = 'none';
    });
}

// ── DISMISS (shame path) ──────────────────────────────────────────────────────
function dismissGate() {
    const gate = document.getElementById('guest-gate');
    const nudge = document.getElementById('guest-nudge');
    if (!gate) return;

    gate.style.animation = 'gateOut 0.35s ease forwards';
    setTimeout(() => {
        gate.remove();
        if (nudge) nudge.style.display = 'flex';
    }, 350);

    sessionStorage.setItem(DISMISSED_KEY, '1');
}

// ── REMOVE (logged in path) ───────────────────────────────────────────────────
function removeGate() {
    const gate = document.getElementById('guest-gate');
    const nudge = document.getElementById('guest-nudge');
    if (gate) {
        gate.style.animation = 'gateOut 0.35s ease forwards';
        setTimeout(() => gate.remove(), 350);
    }
    if (nudge) nudge.remove();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function initGuestGate() {
    // 1. Already dismissed this session → skip
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // 2. Already logged in → skip
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;

    // 3. Show the gate
    renderGate();

    // 4. Auto-remove when user logs in
    supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
            removeGate();
        }
    });
}

// Run immediately when module loads
initGuestGate();

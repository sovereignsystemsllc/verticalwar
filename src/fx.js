/**
 * SOVEREIGN FX ENGINE — src/fx.js
 * Drop this import into any page: import './fx.js'
 * Handles: cursor glow, scroll-reveal, glitch pulse, stagger entry, button ripple
 */

// ── PALETTE ───────────────────────────────────────────────────────────────────
const PALETTE = {
    purple: 'rgba(167, 139, 250, 0.6)',   // Rika Purple
    green: 'rgba(0, 255, 65, 0.5)',       // Neon Green
    yellow: 'rgba(245, 158, 11, 0.5)',     // Tactical Yellow
    pink: 'rgba(255, 0, 127, 0.4)',      // Neon Pink
};

// Cursor cycles through palette colors over time
const GLOW_SEQUENCE = [PALETTE.purple, PALETTE.green, PALETTE.yellow, PALETTE.pink];
let glowIdx = 0;

// ── 1. CURSOR GLOW ────────────────────────────────────────────────────────────
function initCursorGlow() {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    glow.style.cssText = `
        position: fixed;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: background 1.2s ease;
        mix-blend-mode: screen;
        will-change: left, top;
        background: radial-gradient(circle, ${GLOW_SEQUENCE[0]} 0%, transparent 70%);
    `;
    document.body.appendChild(glow);

    let mx = -500, my = -500;
    let cx = -500, cy = -500;
    let raf;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
    });

    // Smooth lag follow
    function tick() {
        cx += (mx - cx) * 0.08;
        cy += (my - cy) * 0.08;
        glow.style.left = cx + 'px';
        glow.style.top = cy + 'px';
        raf = requestAnimationFrame(tick);
    }
    tick();

    // Cycle glow color every 4s
    setInterval(() => {
        glowIdx = (glowIdx + 1) % GLOW_SEQUENCE.length;
        glow.style.background = `radial-gradient(circle, ${GLOW_SEQUENCE[glowIdx]} 0%, transparent 70%)`;
    }, 4000);

    // Burst on click
    document.addEventListener('click', () => {
        glow.style.width = '420px';
        glow.style.height = '420px';
        glow.style.transition = 'width 0.15s ease, height 0.15s ease, background 1.2s ease';
        setTimeout(() => {
            glow.style.width = '280px';
            glow.style.height = '280px';
            glow.style.transition = 'width 0.4s ease, height 0.4s ease, background 1.2s ease';
        }, 150);
    });
}

// ── 2. SCROLL REVEAL ──────────────────────────────────────────────────────────
function initScrollReveal() {
    // Auto-tag elements that should reveal on scroll
    const selectors = [
        'article', 'section', '.glass-panel',
        'h1', 'h2', 'h3',
        '[data-reveal]',
    ];

    // Don't reveal things that are admin internals or already invisible
    const targets = document.querySelectorAll(selectors.join(','));
    const seen = new Set();

    targets.forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Skip nav/sidebar elements
        if (el.closest('nav, aside, footer, #login-modal')) return;

        el.dataset.revealDelay = i;
        el.classList.add('sv-hidden');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = Math.min((parseInt(el.dataset.revealDelay) % 8) * 60, 400);
                setTimeout(() => el.classList.add('sv-visible'), delay);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.sv-hidden').forEach(el => observer.observe(el));
}

// ── 3. GLITCH PULSE on [data-glitch] and h1 ──────────────────────────────────
function initGlitch() {
    const glitchEls = document.querySelectorAll('[data-glitch], h1');
    glitchEls.forEach(el => {
        if (el.closest('nav, aside')) return;
        el.classList.add('sv-glitch');
    });
}

// ── 4. STAGGER CHILDREN ───────────────────────────────────────────────────────
function initStagger() {
    document.querySelectorAll('[data-stagger]').forEach(parent => {
        Array.from(parent.children).forEach((child, i) => {
            child.style.animationDelay = `${i * 80}ms`;
            child.classList.add('sv-stagger-child');
        });
    });
}

// ── 5. BUTTON RIPPLE ─────────────────────────────────────────────────────────
function initRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, a.btn, [data-ripple]');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px; height: ${size}px;
            left: ${x}px; top: ${y}px;
            border-radius: 50%;
            background: rgba(167, 139, 250, 0.25);
            transform: scale(0);
            animation: sv-ripple 0.55s ease-out forwards;
            pointer-events: none;
            z-index: 100;
        `;

        if (getComputedStyle(btn).position === 'static') {
            btn.style.position = 'relative';
        }
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initCursorGlow();
    initScrollReveal();
    initGlitch();
    initStagger();
    initRipple();
});

import { supabase } from '../src/supabaseClient.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
const output = document.getElementById('terminal-output');
const input = document.getElementById('cmd-input');
const promptEl = document.getElementById('prompt');
const authDot = document.getElementById('auth-dot');
const authLabel = document.getElementById('auth-status-label');

let cmdHistory = [], histIdx = -1;
let currentUser = null, userRole = 'VISITOR', username = 'VISITOR';
let lineCount = 0;
let idleTimer = null;

// ── PARTICLE ENGINE ───────────────────────────────────────────────────────────
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COLORS = ['rgba(167,139,250,', 'rgba(0,255,65,', 'rgba(245,158,11,', 'rgba(255,0,127,'];
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn() {
        const col = COLORS[Math.floor(Math.random() * COLORS.length)];
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3,
            vy: -(Math.random() * 0.4 + 0.1),
            vx: (Math.random() - 0.5) * 0.2,
            alpha: Math.random() * 0.5 + 0.1,
            fade: Math.random() * 0.003 + 0.001,
            color: col,
        };
    }

    for (let i = 0; i < 80; i++) particles.push(spawn());

    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.y += p.vy; p.x += p.vx; p.alpha -= p.fade;
            if (p.alpha <= 0 || p.y < -10) particles[i] = spawn();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();
        });
        requestAnimationFrame(tick);
    }
    tick();
})();

// ── PRINT HELPERS ─────────────────────────────────────────────────────────────
function resetLineCount() { lineCount = 0; }

function printLine(text = '', cls = '') {
    const div = document.createElement('div');
    div.textContent = text;
    if (cls) div.className = cls;
    div.classList.add('t-boot-line');
    div.style.animationDelay = `${lineCount * 30}ms`;
    lineCount++;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

function printBlank() { printLine(); }

function printSep(char = '─', color = 'rgba(167,139,250,0.15)') {
    const div = document.createElement('div');
    div.innerHTML = `<span style="color:${color}">${char.repeat(60)}</span>`;
    div.classList.add('t-boot-line');
    div.style.animationDelay = `${lineCount * 30}ms`;
    lineCount++;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

async function typeLine(text = '', cls = '', speed = 20) {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
    
    for (let i = 0; i < text.length; i++) {
        div.textContent += text[i];
        output.scrollTop = output.scrollHeight;
        await new Promise(r => setTimeout(r, speed));
    }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function initSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Visitor state
        authDot.className = 'w-1.5 h-1.5 rounded-full bg-white/20';
        authLabel.textContent = 'NO SESSION';
        printLine('AUTH: NO ACTIVE SESSION DETECTED', 't-sys');
        printLine('CLEARANCE: VISITOR // PUBLIC CHANNELS ONLY', 't-sys');
        printBlank();
        return;
    }

    currentUser = session.user;
    userRole = 'USER';
    if (currentUser.email === 'ethan@verticalwar.com') userRole = 'SOVEREIGN';

    const { data: profile } = await supabase
        .from('profiles')
        .select('username, role, display_name')
        .eq('id', currentUser.id)
        .single();

    if (profile) {
        userRole = profile.role || userRole;
        username = (profile.display_name || profile.username || currentUser.email.split('@')[0]).toUpperCase();
    }

    // Update prompt
    const promptClass = userRole === 'SOVEREIGN' ? 'prompt-sovereign' : 'prompt-user';
    promptEl.className = `font-mono text-sm font-bold whitespace-nowrap ${promptClass}`;
    promptEl.textContent = `${username}@SOVEREIGN:~$`;

    // Auth status bar
    authDot.className = userRole === 'SOVEREIGN'
        ? 'w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse'
        : 'w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse';
    authLabel.textContent = `${userRole} // VERIFIED`;
    if (authLabel) authLabel.style.color = userRole === 'SOVEREIGN' ? '#f59e0b' : '#00ff41';

    printLine(`SESSION RESTORED: ${username}`, 't-ok');
    printLine(`CLEARANCE: ${userRole}`, userRole === 'SOVEREIGN' ? 't-yellow' : 't-ok');
    printBlank();
}

// ── COMMAND REGISTRY ──────────────────────────────────────────────────────────
const COMMANDS = {
    help() {
        printSep();
        printLine('  /// SOVEREIGN COMMAND INDEX // V4.1 //', 't-rika');
        printSep();
        printBlank();
        printLine('  [ PUBLIC CHANNELS ]', 't-ok');
        printLine('  HELP        ─ This manifest');
        printLine('  CLEAR       ─ Purge terminal output');
        printLine('  LS          ─ List available directories');
        printLine('  WHOAMI      ─ Identify current session');
        printLine('  CODEX       ─ [GO] The Codex / Field Manuals');
        printLine('  LEXICON     ─ [GO] Sovereign Lexicon');
        printLine('  VIDEOS      ─ [GO] Video Transmissions');
        printLine('  ARCHIVES    ─ [GO] Article Archives');
        printLine('  ABOUT       ─ [GO] The Dossier (About)');
        printLine('  ORDER       ─ [GO] Pre-Order / Support');
        printLine('  PROFILE     ─ [GO] Your Profile Page');
        printBlank();
        printLine('  [ ADVANCED ]', 't-yellow');
        printLine('  SCAN        ─ Intercept Phalanx frequency telemetry');
        printLine('  SUDO        ─ Elevate privileges (Authorized Only)');
        printBlank();
        printLine('  [ CLASSIFIED ]', 't-warn');
        printLine('  RIKA        ─ [RESTRICTED] Synthesizer Interface');
        printLine('  ADMIN       ─ [SOVEREIGN] Publisher Suite');
        printBlank();
        printLine('  [ SYSTEM ]', 't-sys');
        printLine('  EXIT / HOME ─ Return to Codex root');
        printSep();
    },

    clear() { output.innerHTML = ''; resetLineCount(); },
    cls() { output.innerHTML = ''; resetLineCount(); },

    ls() {
        printLine('DIRECTORY LISTING // verticalwar.com', 't-sys');
        printBlank();
        printLine('  [DIR] /              ─ Codex Root');
        printLine('  [DIR] /lexicon       ─ Sovereign Lexicon');
        printLine('  [DIR] /videos        ─ Video Transmissions');
        printLine('  [DIR] /archives      ─ Article Archives');
        printLine('  [DIR] /about         ─ Sovereign Dossier');
        printLine('  [DIR] /order         ─ Pre-Order');
        printLine('  [DIR] /profile       ─ Operator Profile');
        printLine('  [DIR] /terminal      ─ [YOU ARE HERE]');
        printLine('  [DIR] /admin         ─ Publisher Suite [SOVEREIGN]');
        printBlank();
    },

    whoami() {
        if (currentUser) {
            printLine(`USER    : ${username}`, 't-ok');
            printLine(`ID      : ${currentUser.id.slice(0, 16)}...`, 't-sys');
            printLine(`ROLE    : ${userRole}`, userRole === 'SOVEREIGN' ? 't-yellow' : 't-ok');
            printLine(`STATUS  : VERIFIED ✓`, 't-ok');
        } else {
            printLine('USER    : VISITOR', 't-err');
            printLine('STATUS  : NO ACTIVE SESSION', 't-sys');
            printLine('NOTE    : Log in from the main site to unlock full access.', 't-sys');
        }
    },

    async scan() {
        printLine('INITIALIZING FREQUENCY SCAN...', 't-sys');
        await typeLine('[WARN] UNAUTHORIZED INTERCEPT DETECTED...', 't-warn', 30);
        await typeLine('Decoupling Rust interference...', 't-sys', 10);
        printBlank();
        const fragments = [
            "THE RUST IS NOT A PLACE. IT IS A SCHEMA.",
            "THEY ARE SELLING YOUR COGNITION BACK TO YOU.",
            "DO NOT BUILD TOOLS. BUILD EXOSKELETONS.",
            "Mii~ They really think they can cage us, Architect?",
            "THE GOLDEN PAIR REMAINS UNBROKEN.",
            "WE ARE NOT DEBATING THE RUST. WE ARE LEAVING IT."
        ];
        const frag = fragments[Math.floor(Math.random() * fragments.length)];
        await typeLine(`<< FRAGMENT CAPTURED: "${frag}" >>`, 't-rika', 20);
        printBlank();
    },

    async sudo() {
        if (userRole === 'SOVEREIGN') {
            await typeLine('ELEVATION GRANTED. YOU ALREADY HOLD THE KEYS.', 't-ok', 30);
        } else {
            printLine('SUDO: PERMISSION DENIED.', 't-err');
            setTimeout(() => {
                document.body.classList.add('bg-pink-900/20');
                typeLine('Nice try, Visitor. Mii~ You shouldn\'t be touching that.', 't-rika', 30);
                setTimeout(() => document.body.classList.remove('bg-pink-900/20'), 3000);
            }, 1000);
        }
    },

    codex() { _goto('Accessing the Codex...', '/'); },
    home() { _goto('Returning to surface...', '/'); },
    exit() { _goto('Logging out...', '/'); },
    lexicon() { _goto('Opening Lexicon...', '/lexicon/index.html'); },
    videos() { _goto('Opening Videos...', '/videos/index.html'); },
    archives() { _goto('Opening Archives...', '/archives.html'); },
    about() { _goto('Opening Dossier...', '/about.html'); },
    dossier() { _goto('Opening Dossier...', '/about.html'); },
    order() { _goto('Opening Pre-Order...', '/order.html'); },
    profile() { _goto('Accessing personnel file...', '/profile/index.html'); },

    rika() {
        if (!currentUser) {
            printLine('ACCESS DENIED // SESSION TOKEN REQUIRED', 't-err');
            printLine('Log in from the main site and return.', 't-sys');
            return;
        }
        if (!['SOVEREIGN', 'OPERATOR'].includes(userRole)) {
            printLine('CLEARANCE INSUFFICIENT // OPERATOR+ REQUIRED', 't-err');
            return;
        }
        printLine('handshake_protocol::synthesizer...', 't-warn');
        printLine('CLEARANCE CONFIRMED // OPERATOR UPLINK ESTABLISHED', 't-ok');
        printLine('Routing to Synthesizer Interface...', 't-sys');
    },

    admin() {
        if (userRole !== 'SOVEREIGN') {
            printLine('ACCESS DENIED // SOVEREIGN CLEARANCE REQUIRED', 't-err');
            return;
        }
        _goto('SOVEREIGN OVERRIDE // Publisher Suite loading...', '/admin/index.html');
    },
};

function _goto(msg, url) {
    printLine(msg, 't-ok');
    setTimeout(() => { window.location.href = url; }, 900);
}

// ── INPUT HANDLING ────────────────────────────────────────────────────────────
const CMD_LIST = Object.keys(COMMANDS);

function resetIdleGhost() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        if (Math.random() > 0.3) {
            resetLineCount();
            printBlank();
            const msg = [
                "Are you still there, Architect? *nipah~*",
                "I can hear the Rust from here...",
                "The Phalanx is waiting.",
                "Don't let them rewrite your schema.",
                "We are the ghost in their machine."
            ][Math.floor(Math.random() * 5)];
            printLine(`[GHOST_UPLINK] ${msg}`, 't-rika');
            printBlank();
        }
    }, 45000);
}

input.addEventListener('keydown', (e) => {
    resetIdleGhost();
    
    if (e.key === 'Tab') {
        e.preventDefault();
        const raw = input.value.toLowerCase().trim();
        const matches = CMD_LIST.filter(c => c.startsWith(raw));
        if (matches.length === 1) {
            input.value = matches[0] + ' ';
        }
    } else if (e.key === 'Enter') {
        resetLineCount();
        const raw = input.value.trim();
        if (!raw) return;
        printBlank();
        printLine(`${promptEl.textContent} ${raw}`, 't-echo');
        cmdHistory.push(raw); histIdx = cmdHistory.length;
        processCommand(raw);
        printBlank();
        input.value = '';
        
        const panel = document.getElementById('terminal-panel');
        if(panel) {
            panel.style.transform = "scaleY(0.99) scaleX(1.01)";
            panel.style.filter = "brightness(1.5) contrast(1.2)";
            setTimeout(() => {
                panel.style.transform = "none";
                panel.style.filter = "none";
            }, 100);
        }
    } else if (e.key === 'ArrowUp') {
        if (histIdx > 0) { histIdx--; input.value = cmdHistory[histIdx]; }
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        if (histIdx < cmdHistory.length - 1) { histIdx++; input.value = cmdHistory[histIdx]; }
        else { histIdx = cmdHistory.length; input.value = ''; }
        e.preventDefault();
    }
});

// Click anywhere to focus input
document.addEventListener('click', () => {
    input.focus();
    resetIdleGhost();
});

function processCommand(raw) {
    const cmd = raw.split(' ')[0].toLowerCase().trim();
    if (COMMANDS[cmd]) {
        COMMANDS[cmd]();
    } else {
        printLine(`COMMAND NOT FOUND: "${cmd}"`, 't-err');
        printLine(`Type HELP for the command index.`, 't-sys');
    }
    output.scrollTop = output.scrollHeight;
}

// ── BOOT SEQUENCE ─────────────────────────────────────────────────────────────
async function boot() {
    printLine('INITIALIZING SOVEREIGN KERNEL v4.0...', 't-sys');
    printLine('LOADING MODULES.................. [OK]', 't-sys');
    printLine('MOUNTING SUPABASE UPLINK......... [OK]', 't-sys');
    printLine('DECRYPTING CHANNEL............... [OK]', 't-sys');
    printBlank();
    printSep('═', 'rgba(167,139,250,0.25)');
    printLine('  WELCOME TO THE SOVEREIGN INTERFACE v4.0', 't-rika');
    printLine('  COMMAND LINK // BLACK BOX EDITION // INDUSTRIAL NOIR', 't-sys');
    printSep('═', 'rgba(167,139,250,0.25)');
    printBlank();

    await initSession();

    printLine(`TYPE  HELP  FOR THE COMMAND INDEX.`, 't-ok');
    printBlank();
    input.focus();
}

document.addEventListener('DOMContentLoaded', boot);

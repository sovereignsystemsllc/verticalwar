import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('cmd-input');
    const promptLabel = document.getElementById('prompt');
    const history = [];
    let historyIndex = -1;
    let currentUser = null;
    let username = 'VISITOR'; // Initialize username
    let userRole = 'VISITOR'; // Keep userRole as it's used later

    // AUTH CHECK
    async function initSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            // Check for specific roles if stored in metadata, otherwise default to OPERATOR for logged in users
            // Or fetch profile if needed.
            userRole = 'OPERATOR';
            if (currentUser.email === '76command@gmail.com') userRole = 'SOVEREIGN';

            // Fetch Username
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', currentUser.id)
                .single();

            if (profile && profile.username) {
                username = profile.username.toUpperCase();
            } else {
                username = currentUser.email.split('@')[0].toUpperCase();
            }

            promptLabel.innerText = `${username}@SOVEREIGN:~$`;
            promptLabel.classList.remove('text-emerald-500');
            promptLabel.classList.add('text-purple-400'); // Rika's Color

            printLine(`SESSION RESTORED: ${username}`, "system-msg");
            printLine(`CLEARANCE: ${userRole}`, "success-msg");
        }
    }

    initSession();

    // Command Registry
    const commands = {
        'help': () => {
            printLine("/// SOVEREIGN COMMAND INDEX ///", "system-msg");
            printLine(" ", "");
            printLine("[ PUBLIC ACCESS ]", "success-msg");
            printLine("  HELP       - Show this manual");
            printLine("  CLEAR      - Clear terminal screen");
            printLine("  LS         - List directory & modules");
            printLine("  WHOAMI     - Identify session");
            printLine("  WAR        - [GO] The Vertical War (Induction)");
            printLine("  RECEIPTS   - [GO] Receipt Protocol (Field Ops)");
            printLine("  NETWORK    - [GO] Phalanx Network");
            printLine("  SWITCHBOARD- [GO] Switchboard");
            printLine("  LEXICON    - [GO] The Lexicon");
            printLine("  DOSSIER    - [GO] Profile / Dossier");
            printLine("  CODEX      - [GO] Sovereign Doctrine", "success-msg");
            printLine(" ", "");
            printLine("[ RESTRICTED ACCESS ]", "alert-msg");
            printLine("  RIKA       - [GO] The Synthesizer [OPERATOR]");
            printLine("  GAS        - [GO] Gas Station Logs [ARCHIVIST]");
            printLine("  AI         - [GO] The Architect [OPERATOR]");
            printLine("  BUILD      - [GO] AI Build Specs [OPERATOR]");
            printLine("  MANUAL     - [GO] AI Manual [OPERATOR]");
            printLine(" ", "");
            printLine("  EXIT       - Return to Surface");
        },
        'clear': () => { output.innerHTML = ''; },
        'cls': () => { output.innerHTML = ''; },

        'ls': () => {
            printLine("DIRECTORY LISTING:", "system-msg");
            printLine("  [DIR] ../terminal/induction (WAR)");
            printLine("  [DIR] ../terminal/receipt-protocol");
            printLine("  [DIR] ../cmd/codex (DOCTRINE)");
            printLine("  [DIR] ../i/network");
            printLine("  [DIR] ../cmd/switchboard");
            printLine("  [DIR] ../cmd/lexicon");
            printLine("  [DIR] ../i/dossier");
            printLine("  [DIR] ../rika/synthesizer [LOCKED]");
            printLine("  [DIR] ../rika/gas-station-logs [LOCKED]");
            printLine("  [DIR] ../ai [LOCKED]");
        },
        'whoami': () => {
            if (currentUser) {
                printLine(`USER: ${username}`, "success-msg");
                printLine(`ID: ${currentUser.id}`, "system-msg");
                printLine(`ROLE: ${userRole}`, "success-msg");
                printLine("STATUS: VERIFIED", "success-msg");
            } else {
                printLine("USER: VISITOR // CLEARANCE: UNVERIFIED", "error-msg");
                printLine("NOTE: Access to restricted areas requires valid session token.", "system-msg");
            }
        },

        // --- PUBLIC ROUTING ---
        'war': () => {
            printLine("INITIATING INDUCTION PROTOCOL...", "success-msg");
            setTimeout(() => { window.location.href = '../../terminal/induction/'; }, 1000);
        },
        'training': () => {
            printLine("INITIATING INDUCTION PROTOCOL...", "success-msg");
            setTimeout(() => { window.location.href = '../../terminal/induction/'; }, 1000);
        },
        'receipts': () => {
            printLine("OPENING FIELD OPS TERMINAL...", "success-msg");
            setTimeout(() => { window.location.href = '../../terminal/receipt-protocol/'; }, 1000);
        },
        'network': () => {
            printLine("CONNECTING TO PHALANX HUB...", "success-msg");
            setTimeout(() => { window.location.href = '../../i/network/'; }, 1000);
        },
        'codex': () => {
            printLine("ACCESSING SOVEREIGN DOCTRINE...", "success-msg");
            setTimeout(() => { window.location.href = '../codex/'; }, 1000);
        },
        'doctrine': () => {
            printLine("ACCESSING SOVEREIGN DOCTRINE...", "success-msg");
            setTimeout(() => { window.location.href = '../codex/'; }, 1000);
        },
        'access': () => {
            printLine("ACCESSING SUPPLY DEPOT...", "success-msg");
            setTimeout(() => { window.location.href = '../access/'; }, 1000);
        },

        // --- RESTRICTED ROUTING ---
        'rika': () => {
            printLine("handshake_protocol::synthesizer...", "alert-msg");
            printLine("CHECKING CLEARANCE... [OPERATOR] CONFIRMED.", "success-msg");
            setTimeout(() => { window.location.href = '../../rika/synthesizer/'; }, 1000);
        },
        'gas': () => {
            printLine("accessing_memory_shards...", "alert-msg");
            printLine("CHECKING CLEARANCE... [ARCHIVIST] CONFIRMED.", "success-msg");
            setTimeout(() => { window.location.href = '../../rika/gas-station-logs/'; }, 1000);
        },
        'ai': () => {
            printLine("CONNECTING TO THE ARCHITECT...", "alert-msg");
            setTimeout(() => { window.location.href = '../../ai/'; }, 1000);
        },
        'build': () => {
            printLine("ACCESSING BLUEPRINTS...", "alert-msg");
            setTimeout(() => { window.location.href = '../../ai/build/'; }, 1000);
        },
        'manual': () => {
            printLine("OPENING OPERATOR MANUAL...", "alert-msg");
            setTimeout(() => { window.location.href = '../../ai/manual/'; }, 1000);
        },
        'switchboard': () => {
            printLine("UPLINKING TO SWITCHBOARD...", "alert-msg");
            setTimeout(() => { window.location.href = '../switchboard/'; }, 1000);
        },
        'lexicon': () => {
            printLine("DECRYPTING ARCHIVE...", "alert-msg");
            printLine("CHECKING CLEARANCE... [OBSERVER] REQUIRED.", "system-msg");
            setTimeout(() => { window.location.href = '../lexicon/'; }, 1500);
        },
        'dossier': () => {
            printLine("ACCESSING DOSSIER TOWER...", "alert-msg");
            setTimeout(() => { window.location.href = '../../i/dossier/'; }, 1000);
        },
        'profile': () => {
            printLine("ACCESSING PERSONNEL FILE...", "alert-msg");
            setTimeout(() => { window.location.href = '../profile/'; }, 1000);
        },

        // --- EXITS ---
        'exit': () => {
            printLine("LOGGING OUT...", "system-msg");
            setTimeout(() => { window.location.href = '../../'; }, 800);
        },
        'home': () => {
            printLine("RETURNING TO SURFACE...", "system-msg");
            setTimeout(() => { window.location.href = '../../'; }, 800);
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            if (cmd) {
                // Use current prompt label
                const currentPrompt = promptLabel.innerText;
                printLine(`${currentPrompt} ${cmd}`, "system-msg");
                history.push(cmd);
                historyIndex = history.length;
                processCommand(cmd);
            }
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            if (historyIndex > 0) {
                historyIndex--;
                input.value = history[historyIndex];
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                input.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                input.value = '';
            }
            e.preventDefault();
        }
    });

    function processCommand(rawCmd) {
        const parts = rawCmd.split(' ');
        const cmd = parts[0].toLowerCase();

        if (commands[cmd]) {
            commands[cmd](parts.slice(1));
        } else {
            printLine(`COMMAND NOT FOUND: ${cmd}`, "error-msg");
        }
        scrollToBottom();
    }

    function printLine(text, className = '') {
        const div = document.createElement('div');
        div.textContent = text;
        if (className) div.classList.add(className);
        output.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        output.scrollTop = output.scrollHeight;
    }

    // Auto-focus input
    document.addEventListener('click', () => {
        input.focus();
    });
});

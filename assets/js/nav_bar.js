export async function initNavBar() {
    console.log("[NAV_BAR] Initializing...");
    // UI Initialized immediately
    let nav;
    {

        // 1. CSS Injection
        const style = document.createElement('style');
        style.innerHTML = `
            #sov-nav-bar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(5, 5, 5, 0.9);
                border: 1px solid #333;
                border-bottom: 2px solid var(--term-color, #ff0033);
                padding: 10px 30px;
                display: flex;
                flex-wrap: nowrap;
                gap: 40px;
                z-index: 2147483647; /* MAX Z-INDEX */
                backdrop-filter: blur(10px);
                box-shadow: 0 0 20px rgba(0,0,0,0.8);
                font-family: 'Courier New', monospace;
                border-radius: 4px;
                opacity: 0;
                animation: fadeInNav 0.5s forwards 0.5s;
                /* overflow-x removed globally to allow floating avatar on desktop */
            }
            /* Hide scrollbar globally */
            #sov-nav-bar::-webkit-scrollbar { display: none; }
            #sov-nav-bar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes fadeInNav { to { opacity: 1; } }
            .sov-nav-link {
                color: #666;
                text-decoration: none;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 2px;
                transition: all 0.3s ease;
                position: relative;
                white-space: nowrap; /* Prevent text wrap on links */
                flex-shrink: 0;
            }
            .sov-nav-link:hover, .sov-nav-link.active {
                color: var(--term-color, #ff0033);
                text-shadow: 0 0 8px color-mix(in srgb, var(--term-color, #ff0033), transparent 50%);
            }
            .sov-nav-link::before { content: '['; margin-right: 5px; color: #333; transition: color 0.3s; }
            .sov-nav-link::after { content: ']'; margin-left: 5px; color: #333; transition: color 0.3s; }
            .sov-nav-link:hover::before, .sov-nav-link:hover::after { color: var(--term-color, #ff0033); }
            
            /* USER PROFILE & LOGOUT */
            /* User Avatar Mini */
            #sov-nav-user {
                position: absolute;
                right: -60px;
                top: 50%;
                transform: translateY(-50%);
                width: 32px;
                height: 32px;
                border: 1px solid #333;
                border-radius: 50%;
                cursor: pointer;
                transition: border-color 0.3s, opacity 0.3s;
                /* Overflow hidden removed to allow badge to overlap */
            }
            #sov-nav-user:hover { border-color: var(--term-color, #ff0033); }
            #sov-nav-user img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; border-radius: 50%; }
            #sov-nav-user:hover img { opacity: 1; }

            /* Notification Badge (Super-Beacon) */
            .sov-nav-badge {
                position: absolute;
                top: -3px;
                right: -3px;
                width: 14px;
                height: 14px;
                background-color: var(--term-color, #ff0033);
                border-radius: 50%;
                border: 2px solid #000;
                z-index: 10001;
                box-shadow: 0 0 15px var(--term-color, #ff0033);
                animation: pulse-beacon 1s infinite ease-in-out;
                display: none; 
            }
            @keyframes pulse-beacon {
                0% { 
                    transform: scale(1); 
                    background-color: var(--term-color, #ff0033);
                    box-shadow: 0 0 10px var(--term-color, #ff0033);
                    border-color: #000;
                }
                50% { 
                    transform: scale(1.4); 
                    background-color: #ffffff; /* White Hot */
                    box-shadow: 0 0 30px var(--term-color, #ff0033), 0 0 60px var(--term-color, #ff0033); /* Intense Glow */
                    border-color: var(--term-color, #ff0033);
                }
                100% { 
                    transform: scale(1); 
                    background-color: #ff0033;
                    box-shadow: 0 0 10px #ff0033;
                    border-color: #000;
                }
            }

            /* COLLAPSED STATE (FLOATING TOGGLE) */
            #sov-nav-bar {
                transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s, width 0.3s, padding 0.3s;
                position: fixed; 
            }

            #sov-nav-bar.sov-nav-collapsed {
                background-color: transparent !important;
                border-color: transparent !important;
                box-shadow: none !important;
                pointer-events: none;
                backdrop-filter: none;
            }

            /* Hide Links & Avatar when collapsed */
            #sov-nav-bar.sov-nav-collapsed .sov-nav-link:not(#sov-nav-toggle),
            #sov-nav-bar.sov-nav-collapsed #sov-nav-user {
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s;
            }

            /* TOGGLE BUTTON STYLING (The Floating Circle - NOW DETACHED) */
            #sov-nav-toggle {
                position: fixed; /* TRULY FIXED relative to viewport */
                right: 30px; /* More space from edge */
                bottom: 26px;
                width: 24px;
                height: 24px;
                background-color: #050505;
                border: 1px solid #333;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                pointer-events: auto !important;
                color: #666;
                font-size: 14px;
                line-height: 1;
                transition: all 0.3s ease;
                z-index: 2147483648;
            }

            #sov-nav-toggle:hover {
                border-color: var(--term-color, #ff0033);
                color: var(--term-color, #ff0033);
                box-shadow: 0 0 10px color-mix(in srgb, var(--term-color, #ff0033), transparent 70%);
            }

            /* When Navbar is Collapsed, Toggle acts as 'Open' button */
            body.sov-nav-is-collapsed #sov-nav-toggle {
                border-color: var(--term-color, #ff0033);
                color: var(--term-color, #ff0033);
            }

            /* RESPONSIVE LAYOUT (Mobile + Tablet + Narrow Desktop) */
            @media (max-width: 1024px) {
                #sov-nav-bar {
                    /* Secure fluid layout */
                    width: auto;
                    left: 15px;
                    right: 50px; /* EXTENDED WIDTH (Was 80px) */
                    bottom: 20px; 
                    transform: none;
                    
                    padding: 12px 10px;
                    padding-right: 10px;
                    gap: 15px;
                    justify-content: flex-start;
                    align-items: center;
                    
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    
                    /* SCROLL VISIBILITY HINT (FADE RIGHT) */
                    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
                    mask-image: linear-gradient(to right, black 85%, transparent 100%);
                }

                /* Collapsed Mobile */
                #sov-nav-bar.sov-nav-collapsed {
                    width: auto !important;
                    background: transparent !important;
                    pointer-events: none;
                    border: none !important;
                    display: none; /* Hide container completely to avoid ghosts */
                }

                /* Toggle: Pin to Bottom Right */
                #sov-nav-toggle {
                    right: 15px;
                    bottom: 26px;
                }

                /* Hide scrollbar */
                #sov-nav-bar::-webkit-scrollbar { display: none; }
                
                .sov-nav-link {
                    font-size: 14px; 
                    letter-spacing: 2px;
                }
                
                .sov-nav-link::before { margin-right: 5px; }
                .sov-nav-link::after { margin-left: 5px; }

                /* Avatar positioning */
                #sov-nav-user {
                    position: relative;
                    right: auto;
                    top: auto;
                    transform: none;
                    width: 32px;
                    height: 32px;
                    margin-left: 10px;
                    margin-right: 0; 
                    border: 1px solid #333; 
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                #sov-nav-logout {
                    margin-left: 15px !important;
                    margin-right: 10px; 
                }
            }

            /* SIGNAL BUTTON (BUG REPORT) */
            #sov-nav-signal {
                color: #f59e0b;
                font-weight: bold;
                animation: pulse-amber 3s infinite;
                cursor: pointer;
            }
            
            /* FORCE HIDE SIGNAL WHEN COLLAPSED */
            /* We now use a body class for global state or target the element directly */
            .sov-nav-collapsed #sov-nav-signal {
                display: none !important;
            }
            @keyframes pulse-amber {
                0% { text-shadow: 0 0 5px rgba(245, 158, 11, 0.5); opacity: 0.8; }
                50% { text-shadow: 0 0 15px rgba(245, 158, 11, 0.8); opacity: 1; }
                100% { text-shadow: 0 0 5px rgba(245, 158, 11, 0.5); opacity: 0.8; }
            }

            /* SIGNAL MODAL */
            #sov-signal-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 500px;
                background: #000;
                border: 1px solid #f59e0b;
                box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
                padding: 20px;
                z-index: 2147483650; /* Above everything */
                display: none; /* Hidden by default */
                font-family: 'Courier New', monospace;
            }
            #sov-signal-modal.active { display: block; }
            
            #sov-signal-header {
                color: #f59e0b;
                font-size: 16px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
                margin-bottom: 15px;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            #sov-signal-desc {
                color: #ddd; /* Much brighter grey */
                font-size: 14px; /* Larger font */
                margin-bottom: 20px;
                line-height: 1.5;
            }
            
            #sov-signal-input {
                width: 100%;
                height: 120px;
                background: #111;
                border: 1px solid #333;
                color: #eee;
                padding: 10px;
                font-family: inherit;
                resize: none;
                margin-bottom: 15px;
            }
            #sov-signal-input:focus { outline: none; border-color: #f59e0b; }
            
            .sov-signal-btn {
                background: #f59e0b;
                color: #000;
                border: none;
                padding: 8px 16px;
                font-weight: bold;
                cursor: pointer;
                text-transform: uppercase;
                display: inline-block;
            }
            .sov-signal-btn:hover { background: #d97706; }
            .sov-signal-close {
                float: right;
                color: #666;
                cursor: pointer;
                border: 1px solid #333;
                padding: 2px 8px;
            }
            .sov-signal-close:hover { color: #fff; border-color: #fff; }

            /* MISSION DROPDOWN */
            #sov-mission-dropdown {
                position: fixed; /* Fixed relative to viewport, like navbar */
                bottom: 80px; /* Above navbar */
                left: 50%; /* Centered initially, but we might want it aligned with the icon? No, center is safer for mobile */
                transform: translateX(-50%);
                width: 300px;
                background: rgba(5, 5, 5, 0.95);
                border: 1px solid #333;
                border-top: 2px solid var(--term-color, #ff0033);
                padding: 0;
                display: none;
                flex-direction: column;
                z-index: 2147483649;
                box-shadow: 0 0 30px rgba(0,0,0,0.9);
                backdrop-filter: blur(10px);
            }
            #sov-mission-dropdown.active { display: flex; animation: slideUp 0.3s ease-out; }
            @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
            
            .sov-mission-header {
                padding: 10px 20px;
                background: #111;
                border-bottom: 1px solid #333;
                font-size: 11px;
                letter-spacing: 1px;
                color: #666;
                text-transform: uppercase;
                display: flex;
                justify-content: space-between;
            }
            
            .sov-mission-item {
                padding: 15px 20px;
                border-bottom: 1px solid #222;
                color: #ccc;
                text-decoration: none;
                font-size: 12px;
                transition: all 0.2s;
                display: block;
            }
            .sov-mission-item:hover { background: #111; color: #fff; border-left: 2px solid var(--term-color, #ff0033); }
            .sov-mission-item:last-child { border-bottom: none; }
            .sov-mission-title { font-weight: bold; color: #fff; display: block; margin-bottom: 4px; }
            .sov-mission-desc { font-size: 10px; color: #888; }
            
            @media (max-width: 1024px) {
                #sov-mission-dropdown {
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 350px;
                    bottom: 90px;
                }
            }

        `;
        document.head.appendChild(style);

        // 2. HTML Injection
        nav = document.createElement('div');
        nav.id = 'sov-nav-bar';
        nav.innerHTML = `
            <a href="/" class="sov-nav-link">HOME</a>
            <a href="/cmd/" class="sov-nav-link">CMD</a>
            <a href="/cmd/codex/" class="sov-nav-link">CODEX</a>
            <a href="/terminal/" class="sov-nav-link">LEARN</a>
            <a href="/ai/" class="sov-nav-link">AI</a>

            <!-- MISSION CONTROL -->
            <a href="#" id="sov-nav-missions" class="sov-nav-link" title="CURRENT OBJECTIVES">
                 <div id="sov-mission-badge" class="sov-nav-badge"></div>
                 [ ⌖ ]
            </a>
            
            <a href="/cmd/profile/" id="sov-nav-user" title="GEAR PROFILE">
                 <div id="sov-nav-badge" class="sov-nav-badge"></div>
                 <!-- Placeholder SVG until loaded -->
                 <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiPjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+">
            </a>
            
            <a href="#" id="sov-nav-signal" class="sov-nav-link" title="REPORT ANOMALY // SEND SIGNAL">[ ! ]</a>
            <a href="#" id="sov-nav-logout" class="sov-nav-link" title="LOGOUT" style="margin-left: 10px; color: #dc2626;">X</a>
        `;
        document.body.appendChild(nav);

        // 2.2 Toggle Button Injection (DETACHED FROM NAVBAR TO AVOID BACKDROP-FILTER CONTAINING BLOCK)
        const toggle = document.createElement('div');
        toggle.id = 'sov-nav-toggle';
        toggle.title = 'COLLAPSE/EXPAND';
        toggle.innerHTML = '&mdash;';
        document.body.appendChild(toggle);

        // 2.5 Modal Injection
        const modal = document.createElement('div');
        modal.id = 'sov-signal-modal';
        modal.innerHTML = `
            <div id="sov-signal-header">
                SECURE SIGNAL LINE
                <span class="sov-signal-close" id="sov-signal-close">X</span>
            </div>
            <div id="sov-signal-desc">
                DIRECT CHANNEL TO THE ARCHITECT.<br>
                Report bugs, request features, or send feedback directly to the developer.
            </div>
            <textarea id="sov-signal-input" placeholder="Type your message here..."></textarea>
            <div style="display:flex; gap:10px;">
                <button id="sov-signal-cancel" class="sov-signal-btn" style="background:transparent; border:1px solid #333; color:#888; flex:1;">CANCEL</button>
                <button id="sov-signal-submit" class="sov-signal-btn" style="flex:2;">TRANSMIT</button>
            </div>
        `;
        document.body.appendChild(modal);

        // 2.6 Mission Dropdown Injection
        const missionDropdown = document.createElement('div');
        missionDropdown.id = 'sov-mission-dropdown';
        missionDropdown.innerHTML = `
            <div class="sov-mission-header">
                OPEN DIRECTIVES
                <span id="sov-mission-close" style="cursor:pointer; hover:text-white">X</span>
            </div>
            <div id="sov-mission-list">
                <!-- Items injected via JS -->
                <div style="padding:20px; text-align:center; color:#666; font-size:12px;">scanning...</div>
            </div>
        `;
        document.body.appendChild(missionDropdown);

        console.log("[NAV_BAR] UI Injected.");

        // 3. Active State Logic
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/index.html') nav.children[0].classList.add('active'); // HOME
        if (currentPath.includes('/cmd/') && !currentPath.includes('/codex') && !currentPath.includes('/profile')) nav.children[1].classList.add('active'); // CMD
        if (currentPath.includes('/cmd/codex')) nav.children[2].classList.add('active'); // CODEX
        if (currentPath.includes('/terminal')) nav.children[3].classList.add('active'); // LEARN
        if (currentPath.includes('/ai')) nav.children[4].classList.add('active'); // AI
        const applyState = (collapsed) => {
            if (collapsed) {
                nav.classList.add('sov-nav-collapsed');
                document.body.classList.add('sov-nav-is-collapsed');
                toggle.innerHTML = '+';
            } else {
                nav.classList.remove('sov-nav-collapsed');
                document.body.classList.remove('sov-nav-is-collapsed');
                toggle.innerHTML = '&mdash;';
            }
        };

        // Restore State
        const savedState = localStorage.getItem('sov_nav_collapsed');
        if (savedState === 'true') {
            applyState(true);
        }

        toggle.addEventListener('click', () => {
            const isCollapsed = !nav.classList.contains('sov-nav-collapsed');
            applyState(isCollapsed);
            localStorage.setItem('sov_nav_collapsed', isCollapsed);
        });

    }

    // 3.7 Signal / Bug Report Logic
    const signalBtn = document.getElementById('sov-nav-signal');
    const signalModal = document.getElementById('sov-signal-modal');
    const signalClose = document.getElementById('sov-signal-close');
    const signalCancel = document.getElementById('sov-signal-cancel'); // New
    const signalSubmit = document.getElementById('sov-signal-submit');
    const signalInput = document.getElementById('sov-signal-input');

    if (signalBtn) {
        signalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent immediate close
            signalModal.classList.add('active');
        });

        // Backdrop Click
        window.addEventListener('click', (e) => {
            if (signalModal.classList.contains('active') &&
                !signalModal.contains(e.target) &&
                e.target !== signalBtn) {
                signalModal.classList.remove('active');
            }
        });
    }

    // Close Helpers
    const performClose = () => {
        signalModal.classList.remove('active');
    };

    if (signalClose) signalClose.addEventListener('click', performClose);
    if (signalCancel) signalCancel.addEventListener('click', performClose);

    if (signalSubmit) {
        signalSubmit.addEventListener('click', async () => {
            const text = signalInput.value;
            if (!text) return;

            signalSubmit.innerText = "TRANSMITTING...";

            try {
                const { supabase } = await import('./supabaseClient.js');
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session ? session.user.id : null; // Send null for anonymous, not string

                const { error } = await supabase
                    .from('feedback')
                    .insert({ user_id: userId, message: text, type: 'bug_report', source: window.location.pathname });

                if (error) throw error;

                // NOTIFICATION ECHO (Direct to Inbox)
                // ROUTING TO ARCHITECT: 5abcdeb3-0d75-4201-ba36-2f0c9d7a41ff
                // NOTIFICATION ECHO (Direct to Inbox)
                const architectId = '5abcdeb3-0d75-4201-ba36-2f0c9d7a41ff';
                const senderId = session ? session.user.id : null;
                const senderName = session ? "USER" : "ANONYMOUS";

                const { error: notifyError } = await supabase.from('notifications').insert({
                    user_id: architectId, // RECIPIENT
                    actor_id: senderId, // SENDER (or NULL)
                    type: 'system_alert',
                    message: `SIGNAL [${senderName}]: ${text}`,
                    resource_id: null
                });

                if (notifyError) {
                    console.error("NOTIFICATION ERROR:", notifyError);
                    // Silent fail for user, but logged in console
                }

                signalSubmit.innerText = "SENT";
                signalSubmit.style.background = "#10b981"; // Success Green
                setTimeout(() => {
                    signalModal.classList.remove('active');
                    signalInput.value = '';
                    signalSubmit.innerText = "TRANSMIT";
                    signalSubmit.style.background = "#f59e0b"; // Reset
                }, 1500);

            } catch (err) {
                console.error("Signal Error:", err);
                signalSubmit.innerText = "ERROR";
                signalSubmit.style.background = "#dc2626";
                alert("TRANSMISSION FAILED: " + err.message);
            }
        });
    }

    // 4. Supabase Logic (Reactive Auth State)
    try {
        const { supabase } = await import('./supabaseClient.js');

        // Define UI Update Logic
        const updateUI = async (session) => {
            if (session) {
                // Avatar & Role Fetch
                const { data, error } = await supabase
                    .from('profiles')
                    .select('avatar_url, role')
                    .eq('id', session.user.id)
                    .single();

                if (error) console.error("[NAV_BAR] Profile fetch error:", error);

                // 1. Avatar Logic
                if (data && data.avatar_url) {
                    const { data: publicURL } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);

                    const img = nav.querySelector('#sov-nav-user img');

                    // Only update if placeholder is present or src differs
                    if (img && !img.src.includes(publicURL.publicUrl)) {
                        img.src = publicURL.publicUrl;
                    }
                }

                // 2. Observer Banner Logic (Lexicon Only)
                if ((data.role === 'OBSERVER' || data.role === 'NONE') &&
                    (window.location.pathname.includes('/lexicon') || window.location.pathname.includes('/cmd/lexicon'))) {

                    if (!document.getElementById('sov-observer-banner')) {
                        const banner = document.createElement('div');
                        banner.id = 'sov-observer-banner';
                        banner.innerHTML = `
                                <div style="
                                    position: fixed; 
                                    top: 0; 
                                    left: 0; 
                                    width: 100%; 
                                    background: #000; 
                                    border-bottom: 2px solid #10b981; 
                                    color: #10b981; 
                                    text-align: center; 
                                    padding: 10px; 
                                    font-family: monospace; 
                                    font-weight: bold; 
                                    z-index: 99999;
                                    letter-spacing: 2px;
                                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                                    animation: glitch-text 2s infinite;
                                ">
                                    ⚠️ LIMITED TIME: FULL ACCESS GRANTED // UPGRADE TO SECURE SIGNAL ⚠️
                                </div>
                                <style>
                                    @keyframes glitch-text {
                                        0% { opacity: 1; }
                                        50% { opacity: 0.8; text-shadow: 2px 0 red, -2px 0 blue; }
                                        100% { opacity: 1; }
                                    }
                                    body { margin-top: 40px; } /* Push content down */
                                </style>
                            `;

                        // BUILDER LINK (Restricted)
                        // This logic should be outside the banner.innerHTML string construction
                        // and instead dynamically add elements or modify the string based on role.
                        // For the purpose of this instruction, we'll assume `hasBuilderAccess` is defined
                        // and directly inject the HTML into the bannerContent string.
                        // In a real scenario, `hasBuilderAccess` would be derived from `data.role`.
                        const hasBuilderAccess = (data.role === 'ARCHIVIST' || data.role === 'OPERATOR');
                        if (hasBuilderAccess) {
                            bannerContent += `
                                <a href="/ai/" class="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent hover:border-gray-500 transition-all uppercase tracking-widest relative">
                                    [ SOVEREIGN // ALIAS ]
                                </a>
                                <a href="/cmd/dispatch/" class="flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold text-red-700 hover:text-red-500 hover:bg-red-500/5 shadow-[inset_2px_0_0_0_rgba(185,28,28,0)] hover:shadow-[inset_2px_0_0_0_rgba(239,68,68,1)] transition-all uppercase tracking-widest relative">
                                    [ THE FORGE / WRITE ]
                                </a>
                            `;
                        }
                        banner.innerHTML = bannerContent;
                        document.body.prepend(banner);
                    }
                }

                // 3. Notification Logic
                const checkNotifications = async () => {
                    const { count, error } = await supabase
                        .from('notifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', session.user.id)
                        .is('is_read', false);

                    const badge = document.getElementById('sov-nav-badge');
                    if (badge) {
                        if (count > 0) {
                            badge.style.display = 'block';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                };

                checkNotifications();
                if (!window.notificationInterval) {
                    window.notificationInterval = setInterval(checkNotifications, 30000);
                }
            } else {
                // Logged Out State - Clear UI if needed
                const img = nav.querySelector('img');
                // Reset to placeholder if logged out? kept simple for now.
                if (window.notificationInterval) clearInterval(window.notificationInterval);
            }
        };

        // INITIAL CHECK
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
            updateUI(initialSession);
        }

        // 4. Logout Logic (Listener)
        const logoutBtn = document.getElementById('sov-nav-logout');
        if (logoutBtn) {
            // Remove old listeners to avoid duplicates if re-init
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);

            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm("TERMINATE SESSION?")) {
                    await supabase.auth.signOut();
                    window.location.href = '/gate/?mode=login';
                }
            });
        }

    } catch (err) {
        console.error("[NAV_BAR] Supabase Error:", err);
    }

    // 5. MISSION LOGIC
    const missionBtn = document.getElementById('sov-nav-missions');
    const missionBadge = document.getElementById('sov-mission-badge');
    const missionDropdown = document.getElementById('sov-mission-dropdown');
    const missionList = document.getElementById('sov-mission-list');
    const missionClose = document.getElementById('sov-mission-close');

    if (missionBtn) {
        // Dynamic Import of ProgressManager
        try {
            const { progressManager } = await import('./progressManager.js');

            const checkMissions = async () => {
                await progressManager.init();
                const activeMissions = progressManager.getActiveMissions();

                // badge logic
                let unreadCount = 0;
                activeMissions.forEach(m => {
                    if (!progressManager.isMissionReadInSession(m.id)) {
                        unreadCount++;
                    }
                });

                if (unreadCount > 0) {
                    missionBadge.style.display = 'block';
                } else {
                    missionBadge.style.display = 'none';
                }

                // Render Dropdown (Even if read, they show up in the list)
                if (activeMissions.length === 0) {
                    missionList.innerHTML = '<div style="padding:20px; text-align:center; color:#666; font-size:12px;">ALL SYSTEMS NOMINAL.<br>NO ACTIVE DIRECTIVES.</div>';
                } else {
                    missionList.innerHTML = activeMissions.map(m => `
                        <a href="${m.url}" class="sov-mission-item" onclick="window.navMarkRead('${m.id}')">
                            <div>
                                <span class="sov-mission-title">${m.title}</span>
                                <span class="sov-mission-desc">STATUS: PENDING // CLICK TO ENGAGE</span>
                            </div>
                            <span style="color:#ff0033;">>></span>
                        </a>
                    `).join('');
                }
            };

            // Expose a global helper for the inline onclick (hacky but reliable for dynamic HTML)
            window.navMarkRead = (id) => {
                progressManager.markMissionReadInSession(id);
                // Badge update happens on next poll or we could force it
                missionBadge.style.display = 'none'; // Optimistic hide
            }

            // Poll
            checkMissions();
            setInterval(checkMissions, 10000); // Every 10s

            // Interaction
            missionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                missionDropdown.classList.toggle('active');

                // If opening, mark all as read? Or only on click?
                // User requirement: "notification will be considered read until they start a new session"
                // "if a user logs in and checks their seperate mission notifications... that notification will be considered read"
                // So OPENING the list should mark them as read.
                if (missionDropdown.classList.contains('active')) {
                    // Get current active and mark all
                    const active = progressManager.getActiveMissions();
                    active.forEach(m => progressManager.markMissionReadInSession(m.id));
                    missionBadge.style.display = 'none';
                }
            });

            if (missionClose) {
                missionClose.addEventListener('click', () => {
                    missionDropdown.classList.remove('active');
                });
            }

        } catch (err) {
            console.error("[NAV_BAR] Mission Logic Error:", err);
        }
    }

}

// Auto-init if module script
initNavBar();

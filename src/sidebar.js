// sidebar.js - Sovereign MSX-Style Root Navigation (V4 Port)
import { initAuth, currentRole, setAuthChangeCallback } from './auth.js';

// ============================================================
// NAV CONFIG â€” Add new public pages here, not buried in HTML
// ============================================================
const NAV_ITEMS = [
    { href: '/', label: '/ homepage' },
    { href: '/codex/', label: '/ codex_root' },
    { href: '/about', label: '/ about' },
    { href: '/archives', label: '/ archives' },
    { href: '/lexicon/', label: '/ lexicon' },
    { href: '/terminal/', label: '/ cmd_link', cls: 'text-[#00ff41]/70 hover:text-[#00ff41] hover:border-[#00ff41]' },
    { href: '/order', label: '/ pre-order', cls: 'text-red-500/70 hover:text-red-400' },
];

document.addEventListener('DOMContentLoaded', () => {
    const aside = document.createElement('aside');
    aside.className = 'fixed left-0 top-0 h-full w-64 bg-[#05010a] border-r border-[#a78bfa]/30 font-mono text-xs z-[110] overflow-y-auto flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0 custom-scrollbar';

    // Build nav items from config
    const navItemsHtml = NAV_ITEMS.map(item => {
        const cls = item.cls || 'text-[#a78bfa]/80 hover:text-[#a78bfa]';
        return `<a href="${item.href}" class="block w-full text-left py-2 px-6 ${cls} hover:bg-[#a78bfa]/10 transition-colors border-l-2 border-transparent hover:border-[#a78bfa]">
                    ${item.label}
                </a>`;
    }).join('');

    aside.innerHTML = `
        <!-- HEADER / LOGO REGION -->
        <div class="px-6 py-8 border-b border-[#a78bfa]/20 mb-4 bg-[#05010a]/50 relative">
            <button id="btn-desktop-collapse" class="hidden lg:block absolute top-2 right-2 text-[#a78bfa]/50 hover:text-[#a78bfa] transition-colors p-2 text-[10px] font-bold tracking-widest cursor-pointer" title="Collapse Navigator">
                [ < ]
            </button>
            <!-- Video explicitly plays once and stops without looping. -->
            <video src="/csr_animated_logo.mp4" autoplay muted playsinline class="w-full max-w-[180px] h-auto drop-shadow-[0_0_8px_rgba(167,139,250,0.3)] block mix-blend-screen"></video>
            <p class="text-[#a78bfa]/50 text-[9px] tracking-widest mt-2 uppercase">>> SOVEREIGN_V4</p>
        </div>

        <!-- NAVIGATION TREE -->
        <nav class="flex-1 overflow-x-hidden overflow-y-auto min-h-0 custom-scrollbar">
            
            <!-- THE CODEX (ROOT ARCHITECTURE) -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-[#a78bfa]/40 tracking-widest mb-1 italic">roster:</span>
                ${navItemsHtml}
                <div id="link-matrix-admin" class="hidden">
                    <div class="flex items-center justify-between px-6 pl-10 py-1.5 border-l-2 border-transparent hover:border-[#a78bfa]/30 group">
                        <a href="/admin/index.html" class="flex-1 text-white/40 hover:text-white transition-colors tracking-widest text-[10px]">
                            $ matrix_admin/
                        </a>
                        <button class="sidebar-toggle text-white/30 hover:text-[#a78bfa] transition-colors px-1 text-[10px]" data-target="nav-matrix" data-open="false">
                            <span class="toggle-arrow block transition-transform duration-200 -rotate-90">&#x25BC;</span>
                        </button>
                    </div>
                    <div id="nav-matrix" class="hidden">
                        <a href="/admin/index.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; suite
                        </a>
                        <a href="/admin/curate.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; curate
                        </a>
                        <a href="/admin/editor.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; editor
                        </a>
                        <a href="/admin/upload.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; ingest
                        </a>
                        <a href="/admin/assets.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; assets
                        </a>
                        <a href="/admin/splash.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; splash
                        </a>
                        <a href="/admin/receipts.html" class="block w-full text-left py-1 px-6 pl-14 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 hover:text-[#a78bfa] transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/40 text-[10px]">
                            &gt; receipts
                        </a>
                    </div>
                </div>
            </div>

            <!-- THE MANUAL (PUBLIC CORRIDOR) -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-[#a78bfa]/40 tracking-widest mb-1 italic">the manual (archives):</span>
                <a href="#" class="block w-full text-left py-2 px-6 text-[#a78bfa]/50 border-l-2 border-transparent opacity-30 grayscale pointer-events-none cursor-not-allowed">
                    + signal_tower
                </a>
                <a href="#" class="block w-full text-left py-1.5 px-6 pl-10 text-[#a78bfa]/40 border-l-2 border-transparent opacity-30 grayscale pointer-events-none cursor-not-allowed">
                    $ wire_cutters
                </a>
                <a href="#" class="block w-full text-left py-1.5 px-6 pl-10 text-[#a78bfa]/40 border-l-2 border-transparent opacity-30 grayscale pointer-events-none cursor-not-allowed">
                    $ paper_trail
                </a>
                <a href="/shadow-arc/index.html" class="block w-full text-left py-1.5 px-6 pl-10 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/50 hover:text-[#a78bfa]">
                    $ shadow_work
                </a>
                <a href="/series/ghost/p1/index.html" class="block w-full text-left py-1.5 px-6 pl-10 text-[#a78bfa]/50 hover:bg-[#a78bfa]/5 transition-colors border-l-2 border-transparent hover:border-[#a78bfa]/50 hover:text-[#a78bfa]">
                    $ ghost_of_east_india
                </a>
            </div>

            <!-- SOCIAL CHANNELS -->
            <div class="mb-4 border-t border-[#a78bfa]/30 pt-4">
                <button class="sidebar-toggle w-full flex items-center justify-between px-6 py-2 text-[11px] font-bold text-[#a78bfa] tracking-[0.2em] uppercase hover:text-white hover:bg-[#a78bfa]/10 transition-colors" data-target="nav-channels" data-open="false">
                    <span>// CHANNELS</span>
                    <span class="toggle-arrow transition-transform duration-200 -rotate-90">&#x25BC;</span>
                </button>
                <div id="nav-channels" class="hidden">
                <a href="https://www.youtube.com/@commonsenserebel" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-red-500/70">&#x25B6;</span> YouTube
                </a>
                <a href="https://rumble.com/user/CommonRebel" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-green-500/70">&#x25C9;</span> Rumble
                </a>
                <a href="https://www.instagram.com/faulkinner/" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-pink-500/70">&#x25C8;</span> Instagram
                </a>
                <a href="https://www.facebook.com/profile.php?id=61584796418902" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-blue-400/70">&#x25C6;</span> Facebook
                </a>
                <a href="https://www.threads.com/?hl=en" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-white/50">@</span> Threads
                </a>
                <a href="https://x.com/CSRebel" target="_blank" rel="noopener" class="flex items-center gap-3 py-1.5 px-6 text-white/40 hover:text-white hover:bg-white/5 transition-colors text-[10px] tracking-widest">
                    <span class="text-white/50">&#x2715;</span> X
                </a>
                </div>
            </div>
            
        </nav>

        <!-- THE ARCHITECT PLATE -->
        <div class="px-6 py-4 border-t border-[#a78bfa]/20 bg-[#05010a]/50 shrink-0 relative">
            <div class="absolute inset-y-0 left-0 w-1 bg-[#a78bfa]/20"></div>
            <p class="text-[9px] text-[#a78bfa]/80 tracking-[0.3em] font-bold mb-1 uppercase">// THE ARCHITECT</p>
            <p class="text-[10px] text-white/50 leading-relaxed font-sans">
                Engineered & Authored by <span class="text-[#a78bfa] font-bold">Ethan Faulkner</span>.
            </p>
        </div>

        <!-- FOOTER / LOGOUT -->
        <div class="p-4 border-t border-[#a78bfa]/20 mt-auto bg-[#05010a]/50 shrink-0 space-y-2">
           <a href="https://constructamiracle.com" target="_blank" rel="noopener" class="block w-full text-center py-2 px-4 text-[#a78bfa]/70 hover:text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors border border-[#a78bfa]/20 hover:border-[#a78bfa]/50 tracking-widest uppercase text-[9px] font-bold">
             COMMON SENSE REBEL // SUBSTACK
           </a>
           <a id="sidebar-profile-link" href="/profile/index.html"
               class="hidden w-full text-center py-2.5 px-4 text-white font-bold tracking-widest uppercase text-xs transition-all border border-[#a78bfa]/60 hover:border-[#a78bfa] hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] block">
               &#x25C8; MY PROFILE
           </a>
           <button id="btn-toggle-login"
               class="relative block w-full text-center py-2.5 px-4 font-bold tracking-widest uppercase text-xs transition-all
                      bg-[#a78bfa]/10 border border-[#a78bfa] text-[#a78bfa]
                      hover:bg-[#a78bfa] hover:text-black
                      shadow-[0_0_10px_rgba(167,139,250,0.2)] hover:shadow-[0_0_18px_rgba(167,139,250,0.5)]">
               [ LOGIN ]
           </button>
            <button id="btn-sidebar-register"
                class="block w-full text-center py-2 px-4 font-bold tracking-widest uppercase text-[10px] transition-all border border-[#a78bfa]/30 text-[#a78bfa]/50 hover:border-[#a78bfa] hover:text-[#a78bfa] hover:bg-[#a78bfa]/10">
                [ REGISTER ]
            </button>
        </div>
    `;


    // Prepend to body
    document.body.insertBefore(aside, document.body.firstChild);

    // â”€â”€ BOOT ANIMATION: stagger nav elements like a terminal loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Groups: logo (0s), section labels (0.15s), nav links (0.05s apart from 0.25s),
    //         channels toggle (0.7s), footer buttons (0.85s each)
    requestAnimationFrame(() => {
        const applyBoot = (el, delay) => {
            el.classList.add('sb-boot');
            el.style.animationDelay = delay + 's';
        };

        // Logo block
        const logo = aside.querySelector('h1');
        if (logo) applyBoot(logo, 0.05);
        const tagline = aside.querySelector('p.text-\\[\\#a78bfa\\]\\/50');
        if (tagline) applyBoot(tagline, 0.12);

        // Section heading "roster:"
        const sectionLabels = aside.querySelectorAll('span.italic');
        sectionLabels.forEach((el, i) => applyBoot(el, 0.18 + i * 0.1));

        // Nav links
        const navLinks = aside.querySelectorAll('nav > div:first-child > a');
        navLinks.forEach((el, i) => applyBoot(el, 0.28 + i * 0.06));

        // Channels toggle button
        const channelsBtn = aside.querySelector('[data-target="nav-channels"]');
        if (channelsBtn) applyBoot(channelsBtn, 0.72);

        // Footer buttons (profile + login)
        const footerEls = aside.querySelectorAll('#sidebar-profile-link, #btn-toggle-login');
        footerEls.forEach((el, i) => applyBoot(el, 0.85 + i * 0.12));
    });


    document.querySelectorAll('.sidebar-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const isOpen = btn.dataset.open === 'true';
            const target = document.getElementById(targetId);
            const arrow = btn.querySelector('.toggle-arrow');
            if (isOpen) {
                target.classList.add('hidden');
                arrow.style.transform = 'rotate(-90deg)';
                btn.dataset.open = 'false';
            } else {
                target.classList.remove('hidden');
                arrow.style.transform = 'rotate(0deg)';
                btn.dataset.open = 'true';
            }
        });
    });

    // Mobile/Desktop Edge Toggle (MENU Button)
    const edgeTab = document.createElement('button');
    edgeTab.className = 'fixed left-2 top-1/2 -translate-y-1/2 z-[120] flex items-center justify-center bg-[#05010a]/80 backdrop-blur-md border border-[#a78bfa]/40 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(167,139,250,0.1)] cursor-pointer group hover:border-[#a78bfa] overflow-hidden menu-expanded';
    edgeTab.innerHTML = `
        <div class="relative w-2 h-2 rounded-full border border-[#a78bfa] flex-shrink-0 bg-transparent flex items-center justify-center transition-all duration-700 menu-orb">
            <div class="absolute w-1 h-1 bg-[#a78bfa] rounded-full opacity-0 transition-opacity duration-700 menu-orb-core"></div>
        </div>
        <span class="menu-label font-mono text-[10px] tracking-widest font-bold text-[#a78bfa] ml-2 overflow-hidden whitespace-nowrap transition-all duration-700 max-w-[50px] opacity-100">MENU</span>
    `;

    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/80 z-[105] hidden lg:hidden transition-opacity duration-300 opacity-0';

    document.body.appendChild(edgeTab);
    document.body.appendChild(backdrop);

    let menuOpen = false; // Mobile assumes closed initally
    let desktopMenuOpen = true; // Desktop assumes open initially

    function closeMenu() {
        if (window.innerWidth >= 1024) {
            // Desktop Collapse Logic
            if (!desktopMenuOpen) return;
            desktopMenuOpen = false;
            aside.classList.remove('lg:translate-x-0');
            document.body.classList.remove('lg:pl-64');
        } else {
            // Mobile Collapse Logic
            if (!menuOpen) return;
            menuOpen = false;
            aside.classList.remove('translate-x-0');
            aside.classList.add('-translate-x-full');
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }
        resetFadeTimer(); // Start the collapse timer when menu hides
    }

    function openMenu() {
        clearTimeout(fadeTimer); // Keep it expanded while menu is open
        edgeTab.classList.remove('menu-collapsed');
        edgeTab.classList.add('menu-expanded');
        
        if (window.innerWidth >= 1024) {
            // Desktop Open Logic
            if (desktopMenuOpen) return;
            desktopMenuOpen = true;
            aside.classList.add('lg:translate-x-0');
            document.body.classList.add('lg:pl-64');
        } else {
            // Mobile Open Logic
            if (menuOpen) return;
            menuOpen = true;
            aside.classList.remove('-translate-x-full');
            aside.classList.add('translate-x-0');
            backdrop.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                backdrop.classList.add('opacity-100');
            }, 10);
        }
    }

    // ── DYNAMIC MENU TAB AUTO-COLLAPSE ──────────────────────────────────────
    const _glowStyle = document.createElement('style');
    _glowStyle.textContent = `
        .menu-expanded {
            padding: 12px 16px;
        }
        .menu-collapsed {
            padding: 8px !important;
            background: rgba(5,1,10, 0.4) !important;
            border-color: rgba(167,139,250, 0.2) !important;
            box-shadow: none !important;
            left: 4px !important;
        }
        .menu-collapsed .menu-label {
            max-width: 0 !important;
            opacity: 0 !important;
            margin-left: 0 !important;
        }
        .menu-collapsed .menu-orb {
            border-color: rgba(167,139,250, 0.6) !important;
        }
        .menu-collapsed .menu-orb-core {
            opacity: 0.8 !important;
            animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes subtle-aura {
            0%, 100% { box-shadow: 0 0 0 rgba(167,139,250,0); }
            50% { box-shadow: 0 0 12px rgba(167,139,250,0.4); }
        }
        .menu-collapsed {
            animation: subtle-aura 5s infinite ease-in-out;
        }
    `;
    document.head.appendChild(_glowStyle);

    let fadeTimer = null;
    function resetFadeTimer() {
        edgeTab.classList.remove('menu-collapsed');
        edgeTab.classList.add('menu-expanded');
        clearTimeout(fadeTimer);
        
        // Only collapse if the appropriate menu for the device size is closed
        const isMenuHiding = window.innerWidth >= 1024 ? !desktopMenuOpen : !menuOpen;
        if (isMenuHiding) {
            fadeTimer = setTimeout(() => {
                edgeTab.classList.remove('menu-expanded');
                edgeTab.classList.add('menu-collapsed');
            }, 3000);
        }
    }

    edgeTab.addEventListener('mouseenter', () => { 
        edgeTab.classList.remove('menu-collapsed'); 
        edgeTab.classList.add('menu-expanded'); 
        clearTimeout(fadeTimer); 
    });
    
    edgeTab.addEventListener('mouseleave', resetFadeTimer);
    
    edgeTab.addEventListener('touchstart', () => { 
        edgeTab.classList.remove('menu-collapsed'); 
        edgeTab.classList.add('menu-expanded'); 
        clearTimeout(fadeTimer); 
    }, { passive: true });

    edgeTab.addEventListener('click', () => {
        resetFadeTimer();
        if (window.innerWidth >= 1024) {
            desktopMenuOpen ? closeMenu() : openMenu();
        } else {
            menuOpen ? closeMenu() : openMenu();
        }
    });

    // Kick off the first fade timer on load
    setTimeout(resetFadeTimer, 3000);

    backdrop.addEventListener('click', closeMenu);

    // Bind the new desktop closure button
    const btnDesktopCollapse = document.getElementById('btn-desktop-collapse');
    if (btnDesktopCollapse) {
        btnDesktopCollapse.addEventListener('click', closeMenu);
    }

    // Auto-close menu when clicking a link
    const links = aside.querySelectorAll('a');
    links.forEach(link => {
        if (link.target === '_blank') return; // external — don't close sidebar
        link.addEventListener('click', closeMenu);
    });
    // â”€â”€ UNIVERSAL LOGIN MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // index.html already has the modal; inject it on every other page so
    // the sidebar LOGIN button works site-wide.
    if (!document.getElementById('login-modal')) {
        const modal = document.createElement('div');
        modal.id = 'login-modal';
        modal.className = 'hidden fixed inset-0 z-[100] bg-[#05010a]/90 backdrop-blur-sm flex items-center justify-center p-4';
        modal.innerHTML = `
          <div class="w-full max-w-sm border border-[#a78bfa]/50 bg-[#0a0a0a] p-6 relative shadow-[0_0_30px_rgba(167,139,250,0.1)]">
            <button id="btn-close-login" class="absolute top-2 right-2 text-[#a78bfa]/50 hover:text-[#a78bfa] font-bold text-lg leading-none">Ã—</button>

            <!-- HEADER -->
            <div class="flex items-center gap-3 mb-5 border-b border-[#a78bfa]/20 pb-4">
              <div class="w-2 h-2 bg-[#a78bfa] animate-pulse rounded-full shrink-0"></div>
              <h2 class="text-[#a78bfa] font-bold tracking-[0.2em] uppercase text-base font-mono">SOVEREIGN GATE</h2>
            </div>

            <!-- TABS -->
            <div class="flex mb-5 border-b border-[#a78bfa]/20">
              <button id="modal-tab-login" class="flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase border-b-2 border-[#a78bfa] text-[#a78bfa] transition-all font-mono">[ LOGIN ]</button>
              <button id="modal-tab-register" class="flex-1 pb-2 text-[10px] font-bold tracking-widest uppercase border-b-2 border-transparent text-[#a78bfa]/40 hover:text-[#a78bfa]/70 transition-all font-mono">[ REGISTER ]</button>
            </div>

            <!-- SUCCESS SCREEN (register only) -->
            <div id="modal-success" class="hidden text-center py-6">
              <p class="text-3xl mb-3">ðŸ“¡</p>
              <p class="text-white font-bold tracking-widest uppercase text-sm mb-2 font-mono">TRANSMISSION SENT</p>
              <p class="text-[#a78bfa]/60 text-[10px] tracking-widest leading-relaxed font-mono">Check your email to verify your account.</p>
              <button id="modal-back-to-login" class="mt-5 text-[10px] text-[#a78bfa]/50 hover:text-[#a78bfa] tracking-widest uppercase transition-colors border border-[#a78bfa]/20 hover:border-[#a78bfa]/50 px-4 py-2 font-mono">â† BACK TO LOGIN</button>
            </div>

            <!-- FORM -->
            <div id="modal-form-wrap" class="space-y-3">
              <!-- REGISTER ONLY: Display Name -->
              <div id="modal-field-name" class="hidden">
                <label class="block text-[10px] text-[#a78bfa]/70 uppercase tracking-widest mb-1 font-mono">Display Name</label>
                <input type="text" id="modal-display-name" class="w-full bg-[#050505] border border-[#a78bfa]/30 text-[#a78bfa] p-2 focus:outline-none focus:border-[#a78bfa] font-mono text-sm placeholder-[#a78bfa]/30" placeholder="How you'll appear to others" autocomplete="name">
              </div>

              <div>
                <label class="block text-[10px] text-[#a78bfa]/70 uppercase tracking-widest mb-1 font-mono">Email</label>
                <input type="email" id="login-email" class="w-full bg-[#050505] border border-[#a78bfa]/30 text-[#a78bfa] p-2 focus:outline-none focus:border-[#a78bfa] font-mono text-sm placeholder-[#a78bfa]/30" placeholder="identification@domain.com" autocomplete="email">
              </div>

              <div>
                <label class="block text-[10px] text-[#a78bfa]/70 uppercase tracking-widest mb-1 font-mono" id="modal-pass-label">Decryption Key</label>
                <input type="password" id="login-password" class="w-full bg-[#050505] border border-[#a78bfa]/30 text-[#a78bfa] p-2 focus:outline-none focus:border-[#a78bfa] font-mono text-sm placeholder-[#a78bfa]/30" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" autocomplete="current-password">
              </div>

              <!-- REGISTER ONLY: Confirm Password -->
              <div id="modal-field-confirm" class="hidden">
                <label class="block text-[10px] text-[#a78bfa]/70 uppercase tracking-widest mb-1 font-mono">Confirm Password</label>
                <input type="password" id="modal-confirm-password" class="w-full bg-[#050505] border border-[#a78bfa]/30 text-[#a78bfa] p-2 focus:outline-none focus:border-[#a78bfa] font-mono text-sm placeholder-[#a78bfa]/30" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" autocomplete="new-password">
              </div>

              <button id="btn-submit-login" class="w-full border border-[#a78bfa] bg-[#a78bfa]/10 hover:bg-[#a78bfa] text-[#a78bfa] hover:text-black font-bold uppercase tracking-widest py-2 transition-all mt-2 text-sm font-mono">INITIATE OVERRIDE</button>
              <div id="login-error" class="hidden text-red-500 text-[10px] text-center mt-2 uppercase font-bold tracking-widest font-mono"></div>
            </div>
          </div>`;
        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }

    // Run auth (session check + UI wiring). Safe to call multiple times — each call re-resolves IDs.
    initAuth();
    
    // Boot sequence: Trigger the auto-collapse timer right after rendering
    resetFadeTimer();
});


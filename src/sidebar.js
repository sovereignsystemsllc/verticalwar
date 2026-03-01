// sidebar.js - Sovereign MSX-Style Root Navigation (V4 Port)

document.addEventListener('DOMContentLoaded', () => {
    const aside = document.createElement('aside');
    aside.className = 'fixed left-0 top-0 h-full w-64 bg-[#05010a] border-r border-[#22c55e]/30 font-mono text-xs z-[60] overflow-y-auto flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0 custom-scrollbar';

    aside.innerHTML = `
        <!-- HEADER / LOGO REGION -->
        <div class="px-6 py-8 border-b border-[#22c55e]/20 mb-4 bg-[#05010a]/50 relative">
            <button id="btn-desktop-collapse" class="hidden lg:block absolute top-2 right-2 text-[#22c55e]/50 hover:text-[#22c55e] transition-colors p-2 text-[10px] font-bold tracking-widest cursor-pointer" title="Collapse Navigator">
                [ < ]
            </button>
            <h1 class="text-white font-mono font-bold text-lg tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                COMMON SENSE <br> REBEL
            </h1>
            <p class="text-[#22c55e]/50 text-[9px] tracking-widest mt-2 uppercase">>> SOVEREIGN_V4</p>
        </div>

        <!-- NAVIGATION TREE -->
        <nav class="flex-1 overflow-x-hidden overflow-y-auto min-h-0 custom-scrollbar">
            
            <!-- THE CODEX (ROOT ARCHITECTURE) -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-[#22c55e]/40 tracking-widest mb-1 italic">roster:</span>
                <a href="/" class="block w-full text-left py-2 px-6 text-[#22c55e]/80 hover:bg-[#22c55e]/10 hover:text-[#22c55e] transition-colors border-l-2 border-transparent hover:border-[#22c55e]">
                    / codex_root
                </a>
                <a id="link-matrix-admin" href="/admin/index.html" class="hidden block w-full text-left py-1.5 px-6 pl-10 text-white/40 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-white/30">
                    $ matrix_admin
                </a>
            </div>

            <!-- PUBLIC CORRIDOR (TO BE REBUILT) -->
            <div class="mb-6 opacity-30 grayscale pointer-events-none" title="OFFLINE FOR V4 MIGRATION">
                <span class="block px-6 text-[10px] text-white/40 tracking-widest mb-1 italic">the manual (offline):</span>
                <a href="#" class="block w-full text-left py-2 px-6 text-white/50 border-l-2 border-transparent">
                    + signal_tower
                </a>
                <a href="#" class="block w-full text-left py-1.5 px-6 pl-10 text-white/40 border-l-2 border-transparent">
                    $ wire_cutters
                </a>
                <a href="#" class="block w-full text-left py-1.5 px-6 pl-10 text-white/40 border-l-2 border-transparent">
                    $ paper_trail
                </a>
                <a href="#" class="block w-full text-left py-1.5 px-6 pl-10 text-white/40 border-l-2 border-transparent">
                    $ shadow_work
                </a>
            </div>
            
        </nav>

        <!-- FOOTER / LOGOUT -->
        <div class="p-4 border-t border-[#22c55e]/20 mt-auto bg-[#05010a]/50 shrink-0">
           <button id="btn-toggle-login" class="block w-full text-left py-2 px-4 text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/30 tracking-widest uppercase">
               [ LOGIN ]
           </button>
        </div>
    `;

    // Prepend to body
    document.body.insertBefore(aside, document.body.firstChild);

    // Mobile/Desktop Edge Toggle (MENU Button)
    const edgeTab = document.createElement('button');
    // Removed lg:hidden here so it appears on desktop when sidebar is closed
    edgeTab.className = 'fixed left-0 top-1/2 -translate-y-1/2 z-[55] bg-[#05010a] border border-l-0 border-[#22c55e] text-[#22c55e] px-1 py-4 rounded-r-md flex items-center justify-center opacity-70 hover:opacity-100 transition-all shadow-[2px_0_10px_rgba(34,197,94,0.2)] cursor-pointer';
    edgeTab.innerHTML = '<span class="text-[10px] transform -rotate-90 origin-center block tracking-widest font-bold">MENU</span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/80 z-[50] hidden lg:hidden transition-opacity duration-300 opacity-0';

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
    }

    function openMenu() {
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

    edgeTab.addEventListener('click', () => {
        if (window.innerWidth >= 1024) {
            desktopMenuOpen ? closeMenu() : openMenu();
        } else {
            menuOpen ? closeMenu() : openMenu();
        }
    });

    backdrop.addEventListener('click', closeMenu);

    // Bind the new desktop closure button
    const btnDesktopCollapse = document.getElementById('btn-desktop-collapse');
    if (btnDesktopCollapse) {
        btnDesktopCollapse.addEventListener('click', closeMenu);
    }

    // Auto-close menu when clicking a link
    const links = aside.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
});

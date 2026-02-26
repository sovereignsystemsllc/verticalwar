// sidebar.js - Sovereign MSX-Style Root Navigation

// Helper to resolve paths to the root site directory
function getRootPath() {
    const depth = window.location.pathname.split('/').filter(p => p).length;
    // Assuming root is 'sovereign_v3' or localhost root. 
    // If we are at /learn/ (depth 1), we need ../
    // If we are at /learn/phase/ (depth 2), we need ../../
    // For local dev where root is the base URL:
    return '/'; // We will use absolute paths from root for simplicity in modern deployments. Adjust if running locally without a clean base URL.

    // Better yet, for this specific project where we might be deep in folders:
    // Let's use relative traversal based on current depth.
}

document.addEventListener('DOMContentLoaded', () => {

    // Calculate relative path to root for assets/links if not running on a clean domain
    // A more bulletproof way for local file:// or varied localhost setups:
    const scripts = document.getElementsByTagName('script');
    let sidebarScriptSrc = '';
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('sidebar.js')) {
            sidebarScriptSrc = scripts[i].src;
            break;
        }
    }

    // Derive root by going up from assets/js/sidebar.js
    const rootPath = sidebarScriptSrc ? new URL('../../', sidebarScriptSrc).pathname : '/';

    const aside = document.createElement('aside');
    aside.className = 'fixed left-0 top-0 h-full w-64 bg-[#05010a] border-r border-zinc-800 font-mono text-xs z-50 overflow-y-auto flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.8)]';

    aside.innerHTML = `
        <!-- HEADER / LOGO REGION -->
        <div class="px-6 py-8 border-b border-zinc-800/50 mb-4 bg-zinc-950/50">
            <h1 class="text-white font-tech font-bold text-lg tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                COMMON SENSE <br> REBEL
            </h1>
            <p class="text-zinc-500 text-[9px] tracking-widest mt-2 uppercase">>> SOVEREIGN_V3</p>
        </div>

        <!-- NAVIGATION TREE -->
        <nav class="flex-1 overflow-x-hidden">
            
            <!-- ROOT SECTOR -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-zinc-500 tracking-widest mb-1 italic">roster:</span>
                <a href="${rootPath}" class="block w-full text-left py-2 px-6 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent hover:border-zinc-500">
                    / landing
                </a>
            </div>

            <!-- PUBLIC CORRIDOR -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-zinc-500 tracking-widest mb-1 italic">the manual:</span>
                <a href="${rootPath}learn/" class="block w-full text-left py-2 px-6 text-term-green/80 hover:bg-term-green/10 hover:text-term-green transition-colors border-l-2 border-transparent hover:border-term-green">
                    + signal_tower
                </a>
                <a href="${rootPath}learn/receipt-protocol/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent hover:border-zinc-500">
                    $ wire_cutters
                </a>
                <a href="${rootPath}learn/paper-trail/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent hover:border-zinc-500">
                    $ paper_trail
                </a>
                <a href="${rootPath}learn/induction/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent hover:border-zinc-500">
                    $ shadow_work
                </a>
            </div>

            <!-- THE SYNDICATE API -->
            <div class="mb-6">
                <span class="block px-6 text-[10px] text-zinc-500 tracking-widest mb-1 italic">the vanguard:</span>
                <a href="${rootPath}cmd/network/" class="block w-full text-left py-2 px-6 text-software-blue/80 hover:bg-software-blue/10 hover:text-software-blue transition-colors border-l-2 border-transparent hover:border-software-blue">
                    + syndicate
                </a>
                <a href="${rootPath}read/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent">
                    $ sub_feed
                </a>
            </div>

            <!-- SECURE COMMAND (RBAC REQUIRED) -->
            <div class="mb-6 border-t border-dotted border-zinc-800 pt-6">
                <span class="block px-6 text-[10px] text-command-red/60 tracking-widest mb-1 italic animate-pulse">secure_link:</span>
                
                <a href="${rootPath}cmd/" class="block w-full text-left py-2 px-6 text-white hover:bg-zinc-900 transition-colors border-l-2 border-transparent hover:border-white">
                    / cmd_root
                </a>
                <a href="${rootPath}cmd/lexicon/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent">
                    $ lexicon
                </a>
                <a href="${rootPath}cmd/codex/" class="block w-full text-left py-1.5 px-6 pl-10 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-l-2 border-transparent">
                    $ codex
                </a>
                
                <a href="${rootPath}synth/rika/" class="block w-full text-left py-2 px-6 mt-2 text-rika-purple/80 hover:bg-rika-purple/10 hover:text-rika-purple transition-colors border-l-2 border-transparent hover:border-rika-purple">
                    + intel_term
                </a>
                <a href="${rootPath}synth/makemyown/" class="block w-full text-left py-1.5 px-6 pl-10 text-command-amber/80 hover:bg-command-amber/10 hover:text-command-amber transition-colors border-l-2 border-transparent">
                    $ forge
                </a>
            </div>
            
        </nav>

        <!-- FOOTER / LOGOUT -->
        <div class="p-4 border-t border-zinc-800/50 mt-auto bg-zinc-950/50">
           <button id="sidebar-logout" class="block w-full text-left py-2 px-4 text-zinc-500 hover:bg-command-red/10 hover:text-command-red transition-colors border border-transparent hover:border-command-red/30">
               >> abort_session
           </button>
        </div>
    `;

    // Prepend to body
    document.body.insertBefore(aside, document.body.firstChild);

    // Logout logic
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Determine path to supabase client dynamically based on root
                const sp = await import(rootPath + 'assets/js/supabaseClient.js');
                await sp.supabase.auth.signOut();
                window.location.replace(rootPath + 'gate/');
            } catch (err) {
                console.error("Logout err", err);
                window.location.replace(rootPath + 'gate/');
            }
        });
    }
});

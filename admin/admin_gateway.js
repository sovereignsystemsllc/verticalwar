import { createClient } from '@supabase/supabase-js';
import { initAuth, currentRole, setAuthChangeCallback } from '../src/auth.js';

// Initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const statArticles = document.getElementById('stat-articles');
const statFolders = document.getElementById('stat-folders');

async function bootstrap() {
    setAuthChangeCallback(onAuthChange);
    await initAuth();
}

function onAuthChange() {
    if (currentRole !== 'SOVEREIGN') {
        window.location.replace('/');
        return;
    }
    loadTelemetry();
}

async function loadTelemetry() {
    try {
        // Fetch article count
        const { count: articleCount, error: aErr } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true });

        if (aErr) throw aErr;
        statArticles.innerText = articleCount || 0;

        // Fetch folder count
        const { count: seriesCount, error: sErr } = await supabase
            .from('series')
            .select('*', { count: 'exact', head: true });

        if (sErr) throw sErr;
        statFolders.innerText = seriesCount || 0;

    } catch (e) {
        console.error("Telemetry Load Error", e);
        statArticles.innerText = "ERR";
        statFolders.innerText = "ERR";
    }
}

// Boot
document.addEventListener('DOMContentLoaded', bootstrap);

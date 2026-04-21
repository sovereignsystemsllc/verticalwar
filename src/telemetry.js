import { supabase } from './supabaseClient.js';
import { currentUser } from './auth.js';

// Generate or retrieve a persistent session ID
function getSessionId() {
    let sid = localStorage.getItem('vw_session_id');
    if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('vw_session_id', sid);
    }
    return sid;
}

export async function trackPageview(pathOverride = null) {
    try {
        const path = pathOverride || window.location.pathname + window.location.search;
        const sessionId = getSessionId();
        const userId = currentUser ? currentUser.id : null;

        await supabase.from('page_views').insert({
            path: path,
            session_id: sessionId,
            user_id: userId
        });
    } catch (e) {
        console.warn('Telemetry error:', e);
    }
}

import { supabase } from './supabaseClient.js';

// 1. Strict Role Check (No Hierarchy)
// allowedRoles must be an Array: ['OPERATOR', 'ARCHIVIST']
export async function checkGuard(allowedRoles = []) {
    // 0. Clean Input
    if (typeof allowedRoles === 'string') {
        allowedRoles = [allowedRoles];
    }

    // Normalize allowedRoles to uppercase for comparison
    const targetRoles = allowedRoles.map(r => r.toUpperCase());

    // 1. Get Session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // No Session -> Gate
        window.location.href = '/gate/';
        return false;
    }

    // 2. Fetch True Role from Profiles Table (Source of Truth)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.warn("[ACCESS GUARD] Error fetching profile:", error);
    }

    // 3. Evaluate Access
    let userRoles = [];
    if (profile) {
        if (profile.role) userRoles.push(profile.role.trim().toUpperCase());
        if (profile.roles && Array.isArray(profile.roles)) {
            userRoles.push(...profile.roles.map(r => r.trim().toUpperCase()));
        }
    }

    if (userRoles.length === 0) userRoles.push('NONE');

    // Check if user has ANY of the allowed roles, OR if they are SOVEREIGN (Architect override)
    const hasAccess = userRoles.some(r => targetRoles.includes(r)) || userRoles.includes('SOVEREIGN');

    if (!hasAccess) {
        console.warn(`[ACCESS GUARD] Denied. Required one of: ${targetRoles.join(', ')}. Found: ${userRoles.join(', ')}`);
        return false;
    }

    return true;
}

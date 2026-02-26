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

    // 2. Open Access Override (if somehow passed)
    if (targetRoles.includes('NONE') || targetRoles.includes('GUEST') || targetRoles.includes('ALL')) {
        return true;
    }

    // 3. No Session Gate
    if (!session) {
        console.warn("[ACCESS GUARD] No Active Session. Redirecting to Gate.");
        window.location.replace('/gate/');
        return false;
    }

    // 4. Fetch True Role from Profiles Table (Source of Truth)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.warn("[ACCESS GUARD] Error fetching profile:", error);
    }

    // 5. Evaluate Access
    let userRoles = [];
    if (profile) {
        if (profile.role) userRoles.push(profile.role.trim().toUpperCase());
        if (profile.roles && Array.isArray(profile.roles)) {
            userRoles.push(...profile.roles.map(r => r.trim().toUpperCase()));
        }
    }

    if (userRoles.length === 0) userRoles.push('NONE');

    // RULE 1: SOVEREIGN bypasses everything
    if (userRoles.includes('SOVEREIGN')) {
        return true;
    }

    // RULE 2: STRICT MATCH
    // If a tool is OPERATOR exclusive, ARCHIVISTS cannot enter unless they also hold OPERATOR.
    const hasAccess = userRoles.some(r => targetRoles.includes(r));

    if (!hasAccess) {
        console.warn(`[ACCESS GUARD] Denied. Required one of: ${targetRoles.join(', ')}. Found: ${userRoles.join(', ')}`);
        // FORCE REDIRECT ON FAILED ROLE
        window.location.replace('/gate/');
        return false;
    }

    return true;
}

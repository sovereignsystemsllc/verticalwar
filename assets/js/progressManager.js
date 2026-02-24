import { supabase } from './supabaseClient.js';

/**
 * PROGRESS MANAGER
 * Handles the logic for Sovereign Curriculum tracking.
 * - Stores "Achievements" in public.profiles (sovereign_progress column)
 * - Defines the flow of the curriculum
 */

export const ACHIEVEMENTS = {
    // TRACK 00: BOOTCAMP
    INDUCTION_VISITED: 'INDUCTION_VISITED',
    INDUCTION_QUIZ_PASSED: 'INDUCTION_QUIZ_PASSED',
    LEXICON_VISITED: 'LEXICON_VISITED',
    CODEX_VISITED: 'CODEX_VISITED',

    // TRACK 01: MEDIA LITERACY
    WC_BRIEFING_READ: 'WC_BRIEFING_READ',
    WC_TRAINING_COMPLETE: 'WC_TRAINING_COMPLETE',
    WC_EP01_COMPLETE: 'WC_EP01_COMPLETE',

    // TRACK 02: PAPER TRAIL (Episode 2)
    PT_BRIEFING_READ: 'PT_BRIEFING_READ',
    PT_TRAINING_COMPLETE: 'PT_TRAINING_COMPLETE',
    PT_MISSIONS_COMPLETE: 'PT_MISSIONS_COMPLETE'
};

// DEFINES THE ORDER OF OPERATIONS
// "req" = Array of achievements required to unlock this step
export const CURRICULUM = [
    // --- TRACK 00: BOOTCAMP ---
    {
        id: 'induction_visit',
        track: 'TRACK 00: BOOTCAMP',
        title: 'INDUCTION PROTOCOL',
        url: '/terminal/induction/',
        req: [],
        achievement: ACHIEVEMENTS.INDUCTION_VISITED
    },
    {
        id: 'induction_quiz',
        track: 'TRACK 00: BOOTCAMP',
        title: 'THE DRILL',
        url: '/terminal/induction/drill/',
        req: [ACHIEVEMENTS.INDUCTION_VISITED],
        achievement: ACHIEVEMENTS.INDUCTION_QUIZ_PASSED
    },
    {
        id: 'lexicon_visit',
        track: 'TRACK 00: BOOTCAMP',
        title: 'THE BLACK BOX',
        url: '/cmd/lexicon/',
        req: [ACHIEVEMENTS.INDUCTION_QUIZ_PASSED],
        achievement: ACHIEVEMENTS.LEXICON_VISITED
    },
    {
        id: 'codex_visit',
        track: 'TRACK 00: BOOTCAMP',
        title: 'THE CODEX',
        url: '/cmd/codex/',
        req: [ACHIEVEMENTS.LEXICON_VISITED],
        achievement: ACHIEVEMENTS.CODEX_VISITED
    },

    // --- TRACK 01: MEDIA LITERACY ---
    {
        id: 'wc_briefing',
        track: 'TRACK 01: MEDIA LITERACY',
        title: 'PROTOCOL BRIEFING',
        url: '/terminal/receipt-protocol/',
        req: [ACHIEVEMENTS.CODEX_VISITED],
        achievement: ACHIEVEMENTS.WC_BRIEFING_READ
    },
    {
        id: 'wc_training',
        track: 'TRACK 01: MEDIA LITERACY',
        title: 'TRAINING MODULES',
        url: '/terminal/receipt-protocol/',
        req: [ACHIEVEMENTS.WC_BRIEFING_READ],
        achievement: ACHIEVEMENTS.WC_TRAINING_COMPLETE
    },
    {
        id: 'wc_missions',
        track: 'TRACK 01: MEDIA LITERACY',
        title: 'MISSION LOG',
        url: '/terminal/receipt-protocol/',
        req: [ACHIEVEMENTS.WC_TRAINING_COMPLETE],
        achievement: ACHIEVEMENTS.WC_EP01_COMPLETE
    },
    // --- TRACK 02: PAPER TRAIL ---
    {
        id: 'pt_briefing',
        track: 'TRACK 02: PAPER TRAIL',
        title: 'PROTOCOL BRIEFING (EP. 2)',
        url: '/terminal/paper-trail/',
        req: [ACHIEVEMENTS.WC_EP01_COMPLETE], // Locked until Ep1 done
        achievement: ACHIEVEMENTS.PT_BRIEFING_READ
    },
    {
        id: 'pt_training',
        track: 'TRACK 02: PAPER TRAIL',
        title: 'TRAINING MODULES',
        url: '/terminal/paper-trail/',
        req: [ACHIEVEMENTS.PT_BRIEFING_READ],
        achievement: ACHIEVEMENTS.PT_TRAINING_COMPLETE
    },
    {
        id: 'pt_missions',
        track: 'TRACK 02: PAPER TRAIL',
        title: 'MISSION LOG',
        url: '/terminal/paper-trail/',
        req: [ACHIEVEMENTS.PT_TRAINING_COMPLETE],
        achievement: ACHIEVEMENTS.PT_MISSIONS_COMPLETE
    },
    // --- FUTURE TRACKS (TEASERS) ---
    {
        id: 'ep3_placeholder',
        track: 'TRACK 03: ???',
        title: 'CLASSIFIED',
        url: '#',
        req: ['IMPOSSIBLE_KEY'], // Always Locked
        achievement: 'N/A'
    },
    {
        id: 'ep4_placeholder',
        track: 'TRACK 04: ???',
        title: 'CLASSIFIED',
        url: '#',
        req: ['IMPOSSIBLE_KEY'], // Always Locked
        achievement: 'N/A'
    }
];

export class ProgressManager {
    constructor() {
        this.progressCache = {};
        this.settingsCache = { public_progress: false };
        this.userId = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        this.userId = session.user.id;

        // Fetch from Profiles (Source of Truth)
        const { data, error } = await supabase
            .from('profiles')
            .select('sovereign_progress, settings')
            .eq('id', this.userId)
            .single();

        if (data) {
            this.progressCache = data.sovereign_progress || {};
            this.settingsCache = data.settings || { public_progress: false };
        }

        this.initialized = true;
    }

    /**
     * Checks if a specific curriculum step is unlocked for the user.
     * @param {string} stepId - The ID from CURRICULUM array (e.g., 'wc_training')
     * @returns {boolean}
     */
    isUnlocked(stepId) {
        const step = CURRICULUM.find(s => s.id === stepId);
        if (!step) return true; // Default to open if not defined, or safety fallback

        // Check if ALL requirements are met
        return step.req.every(reqId => !!this.progressCache[reqId]);
    }

    /**
     * Checks if an achievement is already earned.
     * @param {string} achievementId 
     * @returns {boolean}
     */
    hasAchievement(achievementId) {
        return !!this.progressCache[achievementId];
    }

    /**
     * Returns a list of active missions (Unlocked but NOT completed).
     * @returns {Array} List of step objects from CURRICULUM
     */
    getActiveMissions() {
        return CURRICULUM.filter(step => {
            const unlocked = this.isUnlocked(step.id);
            const completed = this.hasAchievement(step.achievement);
            return unlocked && !completed;
        });
    }

    /**
     * Checks if a specific mission has been marked as 'read' in this session.
     * @param {string} stepId 
     * @returns {boolean}
     */
    isMissionReadInSession(stepId) {
        return sessionStorage.getItem(`sov_mission_read_${stepId}`) === 'true';
    }

    /**
     * Marks a mission as read for this session.
     * @param {string} stepId 
     */
    markMissionReadInSession(stepId) {
        sessionStorage.setItem(`sov_mission_read_${stepId}`, 'true');
    }

    /**
     * Saves a new achievement to the profile.
     * @param {string} achievementId - Constants from ACHIEVEMENTS
     * @param {object} metadata - Optional extra data (score, timestamp)
     */
    async saveAchievement(achievementId, metadata = {}) {
        if (!this.userId) await this.init();
        if (!this.userId) return; // Still no user

        // Optimistic Update
        this.progressCache[achievementId] = {
            done: true,
            timestamp: Date.now(),
            ...metadata
        };

        // Persist
        await supabase
            .from('profiles')
            .update({ sovereign_progress: this.progressCache })
            .eq('id', this.userId);

        console.log(`[PROGRESS] Saved: ${achievementId}`);
    }

    /**
     * Toggles the public visibility of the progress on the profile.
     * @param {boolean} isPublic 
     */
    async setVisibility(isPublic) {
        if (!this.userId) await this.init();
        this.settingsCache.public_progress = isPublic;

        await supabase
            .from('profiles')
            .update({ settings: this.settingsCache })
            .eq('id', this.userId);
    }

    getSettings() {
        return this.settingsCache;
    }
}

export const progressManager = new ProgressManager();

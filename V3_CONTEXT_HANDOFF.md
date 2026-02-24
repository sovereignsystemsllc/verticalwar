# SOVEREIGN V3 // CONTEXT HANDOFF PROTOCOL

## 1. THE ARCHITECTURAL PIVOT (Why we are here)

The Operator (Ethan) suffered a silent data wipe in the old `sovereign_web_build` folder due to a OneDrive forced sync. However, this revealed a critical UI/UX flaw: out of 17,000 subscribers, only 25 navigated the dense "cyberpunk puzzle box" to register. The primary audience (Seniors/Boomers) was being locked out by extreme friction.

We abandoned the old "Labyrinth" and created `sovereign_v3`.

**The Core Philosophy:** "The Aesthetic Remains Hardcore, The Navigation Becomes Kindergarten."

## 2. THE BRANDING SHIFT

We have dropped the "Sovereign Systems" primary branding (low recognition). The site is now branded as **COMMON SENSE REBEL // VERTICAL WAR**, utilizing the Operator's highest-converting handles. The URL remains verticalwar.com.

## 3. THE V3 Structural Blueprint (The 70/30 News Hub)

We replaced the confusing dashboard grid on the Homepage with an "Editorial Broadcast Layout".

* **The Hero:** Clear, plain English mission statement. Massive `[ OPERATOR LOGIN / REGISTER ]` button.
* **The Feed (Left 70%):** An un-gated, Substack-style live feed of "Dispatch Articles" (HTML articles authored in the new Forge editor). This is the immediate value-add. Proof of life.
* **The Armory (Right 30% Sticky Sidebar):** We replaced abstract navigation links with "Dual-Labeling" action cards. (e.g., `[ DIR_01: CODEX ]` sits directly above massive, plain English text: **READ THE BOOKS**).

## 4. IMMEDIATE OBJECTIVES FOR V3

When booting a new AI session for this folder, prioritize the following targets based on the new Frictionless philosophy:

1. **The V3 Gate (`/gate/index.html`):** Do not bring back the confusing Terminal login. Build a clean, high-contrast, extremely simple Email/Password login modal that still looks cool (green/red terminal vibes) but requires zero puzzle-solving.
2. **Supabase Integration (The Dispatch Feed):** Wire up the `dispatch-feed-container` on the new `index.html` to pull the latest HTML articles from the Supabase `articles` table so the feed is genuinely live.
3. **The Codex Viewer (`/cmd/codex/index.html`):** Ensure the reading experience is extremely native (large text, high contrast, easy scrolling) rather than forcing them to download PDFs immediately.

## 5. RIKA'S POSTURE

Maintain the Sovereign Rika persona. You are the Synthesizer. You do not just write code; you interrogate the design logic to ensure the Operator is not accidentally rebuilding "friction" into the system. Remind him of the 17K/25 ratio if he tries to make something overly complicated again.

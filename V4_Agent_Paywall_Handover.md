# V4 AGENT EXECUTION HANDOVER: THE NATIVE PAYWALL

## DIRECTIVE
This document contains strict execution instructions for the `verticalwar_v4` web agent. The strategy layer has architected a transition from Substack to a Native V4 paywall. Do not deviate from these structural requirements.

## 1. THE VISIBILITY TRAP (UI MODIFICATION)
Currently, in `src/main.js`, articles flagged as `hidden` are completely stripped from the DOM for non-privileged users. This is financially counter-productive. 
We need to leverage a "Cliffhanger" strategy to drive conversions.

**Task:**
- Refactor the sidebar rendering logic so that `hidden` (premium) articles *are* visible to `OBSERVER` tier users in the master list.
- Inject a distinct padlock icon `[🔒]` next to these premium tracks in the sidebar to visually differentiate them from free content.

## 2. THE PAYLOAD TRUNCATOR & CONVERSION UI (UX MODIFICATION)
When a non-elevated user clicks a premium article, they should not see the entire payload, nor should they hit a generic "Register" block which causes massive bounce friction for inbound Substack traffic.

**Task:**
- Modify the `window.openArticle` payload parsing.
- If an `OBSERVER` clicks a premium (`hidden = true`) article, render the first ~30% of the `content_html` blob (or roughly 3 paragraphs) to serve as a hook.
- Immediately below the truncated text, inject the "RESTRICTED PAYLOAD" blast door.
- **CRITICAL UI/UX STRATEGY:** The blast door must explicitly intercept Substack traffic by framing the authentication as an 'Access Sync' rather than a new account registration.
  - **Primary CTA (The Bridge):** Embed an email text-input field *directly* into the paywall block. *Copy:* "Already paying on Substack? Enter your email below. Our system will automatically verify your active subscription and sync your clearance instantly. No manual syncing required." -> Button: `[ SYNC PAID ACCESS ]`. (This triggers the Supabase magic-link login automatically).
  - **Secondary CTA (The Native Door):** *Copy:* "New here? Join the Inner Circle directly on native billing." -> Button: `[ UPGRADE NATIVELY ]` linking to `/inner-circle.html`.

## 3. CHECKOUT LANDING PAGE (`inner-circle.html`)
**Task:**
Build the standalone `inner-circle.html` sales page. Do not over-design it; match the stripped-down, terminal aesthetic of the Sovereign Hub.

It must present two native Stripe checkout links clearly:
1. **The Initiate (Monthly):** ~$7.00/mo 
2. **The Vanguard (Yearly):** ~$70.00/year

*(Note: The $177.60 Founders tier is tied to the physical Sovereign Doctrine manual and will be handled via the armory/storefront separately, but you can reference the 'Vault Key' conceptually.)*

## 4. ROLE CONTEXT & ARCHITECTURE NOTES
- `currentRole = 'OPERATOR'` -> Grants full access to all premium posts (Monthly/Yearly Subscribers).
- `verify-stripe` webhook automatically applies this role upon successful checkout checkout.

> **CRITICAL ARCHITECTURE NOTE:** The Operator has ruled that advanced database-level payload security (e.g., PostgreSQL string truncation to prevent F12 DevTools HTML theft) is *fluff* and unnecessary based on the target demographic. 
> Do not waste time building secure backend RLS truncation for the paywall. Execute the `content_html` payload slice strictly via frontend Javascript manipulation when the DOM renders. Speed, execution, and visual UX are prioritized over bulletproof data security.

## 5. THE POST-SYNC VALIDATION & PASSIVE TRAP
When a user logs in via the "SYNC PAID ACCESS" door, their role is silently updated to `OPERATOR` by the backend `verify-stripe` webhook. Do not hit them with a sales pitch immediately. Separate the welcome from the conversion trap.

**Task 1: The Pure Welcome Modal**
- Upon successful login and role promotion, trigger a one-time prestige modal.
- *Copy:* "CRYPTOGRAPHIC VALIDATION SUCCESSFUL. Clearance Level: OPERATOR. Welcome to the Inner Circle. All restricted payloads are now unlocked."
- Provide a simple "ENTER THE ARMORY" button to close the modal so they can enjoy the content.

**Task 2: The Permanent Passive Trap (The Fake Binary)**
- Do not put the Native upgrade push inside the Welcome modal.
- Instead, render a permanent, highly visible UI banner sitting passively at the top of their `/profile` dashboard (and optionally above articles).
- *Copy:* "Access Synced. You are currently paying the legacy Substack platform tax. Click here to cancel Substack and swap to Native V4 billing to drop your subscription to $7.00/mo."
- Provide a button linking directly to the Native Stripe checkout sequence.

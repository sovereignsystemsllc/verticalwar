# SOVEREIGN V3 // CORE ARCHITECTURE MAP

**Last Updated:** February 24, 2026
**Status:** ACTIVE

This document serves as the absolute source of truth for the Sovereign V3 infrastructure. It maps the dependencies, database schemas, and data flow to ensure the Operator and the Synthesizer (Rika) maintain perfectly synchronized context.

---

## 1. THE DATA LAYER (Supabase)

Sovereign V3 relies on Supabase for Authentication, Database, and Storage.

### A. Authentication & Roles

We have abandoned complex custom auth in favor of native Supabase GoTrue.
User roles are managed and verified via the `profiles` table (Primary) and `app_metadata`/`user_metadata` (Fallback).

**The Tier System:**

* **`OPERATOR`**: The Creator (Ethan). Full read/write access to The Forge and all archives.
* **`SOVEREIGN`**: High-tier subscribers. Access to the full Archive, but no write access.
* **`ARCHIVIST`**: Inner Circle/Alpha users. Access to The Forge, Gas Station Logs, and AI Build Tools.
* **`GUEST` / Unauthenticated**: Access only to the `/read/` public endpoints and the index page.

### B. Database Schema

**Table: `profiles`**

* `id` (uuid, references auth.users)
* `role` (text) - e.g., 'OPERATOR', 'ARCHIVIST'
* `created_at` (timestamp)

**Table: `articles`** (The core content engine)

* `id` (uuid)
* `created_at` (timestamp)
* `updated_at` (timestamp)
* `title` (text)
* `content_html` (text) - Output from The Forge editor.
* `series` (text) - 'Dispatch', 'Doctrine', 'Inside the Forge'.
* `status` (text) - 'draft', 'published'.
* `author_id` (uuid, references auth.users)
* `author_name` (text)
* `published` (boolean)

### C. Storage Buckets

* **`article_assets`**: Stores images uploaded directly via The Forge editor (`/cmd/dispatch/index.html`).

---

## 2. THE ROUTING LOGIC

The V3 application structure is designed to be frictionless for the reader, and secure for the Operator.

1. **`/` (The Root):** The public face. Un-gated. Pulls active "Dispatch" articles dynamically into the UI feed.
2. **`/read/`:** The Public Dispatch Reader. Clean, Substack-style native HTML viewer. Open to all, *unless* the article `series` is marked 'Inside the Forge' (triggers auth guard).
3. **`/gate/`:** The central Authentication portal. Simple Email/Password UI. Checks RLS and redirects users based on successful auth.
4. **`/cmd/`:** The Command Center. Gated dashboard for subscribers and operators.
5. **`/cmd/codex/`:** The Archive. A dual-rendering reader that displays legacy PDFs alongside dynamic native HTML tracks fetched from Supabase.
6. **`/cmd/dispatch/` (The Forge):** The internal CMS and WYSIWYG editor. Strictly locked to `OPERATOR` and `ARCHIVIST`. Used to dynamically create and push articles to the `articles` table.
7. **`/synth/`:** The AI & Logging division.
    * `/synth/makemyown/`: The AI Build Tool (Sovereign Architect) using Gemini 3 Pro.
    * `/synth/logs/`: The Gas Station Logs (Internal thought dumps).

---

## 3. EXTERNAL APIS & INTEGRATIONS

1. **Stripe:** Handled via external payment links (e.g., "Join Core" buttons) mapped directly to Stripe Checkout. Webhooks can be connected via Supabase Edge Functions if automated role-assignment is required in the future.
2. **Gemini 3 Pro:** The core brain of the `makemyown` architect interface. Unlocked via a secure, server-side PHP proxy (`/api/antigravity.php`) protecting the `.gitignore`'d `private/config.php` key.

---

## 4. SECURITY BOUNDARIES (RLS)

* **Articles:** `SELECT` is public where `published = true` AND `series != 'Inside the Forge'`.
* **The Forge:** `INSERT` / `UPDATE` requires `auth.uid() = author_id`.
* **Client Guards:** All sensitive pages (`/synth/`, `/cmd/dispatch/`) utilize the synchronous `accessGuard.js` to speed-lock unauthorized users out before the DOM even renders.

# SOVEREIGN V3 // WORKSPACE PROTOCOLS

## 1. THE SEO DOCTRINE (DYNAMIC INJECTION)

When operating within the `sovereign_v3` architecture (or its future deployments), SEO is classified as a **Top Priority** to ensure the Sovereign domain outranks legacy Substack hosting.

The architecture relies on client-side rendering via Supabase. Therefore, any new public-facing pages, reading interfaces, or dynamic content viewers MUST include a mechanism (like `injectSEO()`) to generate and append standard `<meta>` and Open Graph (`og:`) tags to the document `<head>` *immediately* after the database fetch resolves.

**Required Tags for Dynamic Content:**

- `title`
- `meta name="description"`
- `meta property="og:title"`
- `meta property="og:description"`
- `meta property="og:image"` (Extracted from the first image frame of the content payload, or falling back to a default Sovereign icon).
- `meta property="og:type"` (Set to `article` for dispatches).
- `meta property="og:url"`
- Twitter Card equivalents (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

Do not rely on static HTML tags for dynamic routes. The crawler must receive the exact episode's metadata upon executing the JavaScript payload.

## 2. THE DEPLOYMENT PROTOCOL (FTP DEPLOY)

When executing a live launch or pushing updates to `verticalwar.com`, adhere to the following sequence:

1. **Local Verification:** Ensure all development and testing are completed and verified on the local Python server (`localhost:8080`).
2. **The Purge:** Before uploading, ensure no developmental artifacts (like massive PDF collections or raw SQL seed files) are included in the push. (e.g., Run the PDF purge to save bandwidth).
3. **The Push:** Execute the designated deployment script (e.g., `DeployToHostGator.ps1`) or manually transfer the `sovereign_v3` contents via FTP to the live production server.
4. **Live Verification:** Immediately navigate to the live URL and verify that API calls (like Supabase fetches) are not being blocked by CORS policies and that the layout renders correctly outside the local environment.

## 3. THE ANCHOR HABIT (GIT SNAPSHOTS & BACKUPS)

To prevent another "Silent Wipe" scenario, data sovereignty must be maintained at the local level.

**Mandatory Post-Session Action:**
At the conclusion of every major workspace session, the active AI Operator (Rika) **MUST** remind the User (Ethan) to perform a local backup and Git commit.

- *The Prompt:* "Operator, the session is concluding. Have we committed the latest snapshot to the local Git repository? Do we need to push a backup to the secure remote?"
- This is not optional. It is a core procedural safeguard for the V3 architecture.

## 4. THE PRE-FLIGHT ARCHITECTURE AUDIT (ANTI-TUNNEL VISION)

To prevent the AI Synthesizer from prematurely suggesting a "Live Launch" based on the completion of a single feature, the following audit protocol is mandatory.

**Before any deployment to production is proposed or authorized:**

1. **Global Directory Scan:** The Synthesizer must execute a top-down `list_dir` scan of the entire project root (`/cmd/`, `/synth/`, `/read/`, etc.).
2. **Legacy Eradication:** Every single HTML file and subdirectory must be manually verified to ensure it aligns with the V3 structural blueprint (Frictionless navigation, stripped legacy puzzles, Supabase readiness).
3. **The "No Dead Rooms" Rule:** If a directory from V2 exists but hasn't been re-wired for V3 (e.g., old Dashboards, abandoned Terminal games), the launch is **ABORTED**. The Operator must be consulted to either upgrade the room to V3 standard or delete it entirely.
4. Never box-check a launch based purely on the Homepage working. The entire connected grid must be clean.

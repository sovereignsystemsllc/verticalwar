# `/api` - The Data Pipeline

**Designation:** API // THE NEURAL LINK
**Clearance:** Backend / Server-Side Execution

This directory operates as the **backend pipeline** connecting the V3 frontend UI to our secure external services (like Supabase and the Antigravity proxy).

## Architecture

* Houses the PHP scripts (e.g., `antigravity.php`) responsible for securely brokering requests between the client and the LLM/Database APIs.
* Acts as a secure firewall, ensuring API keys and core logic remain masked from the client-side browser execution.

**Architectural Rule:** Never expose environment variables or hardcoded secret keys directly in the frontend JS. All sensitive transactions must route through these `/api/` endpoints.

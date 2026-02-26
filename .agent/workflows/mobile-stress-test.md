---
description: Automated rigorous mobile viewport stress testing via Subagent
---
This workflow is used to rigorously stress test any Sovereign V3 URL to ensure the zero-collapse flex architecture, overflow properties, and mobile triggers (like the Tailwind `md:flex` boundaries) are functioning flawlessly under extreme constraint.

// turbo

1. The Operator will provide the target URL or path (e.g., `http://localhost:8000/cmd/lexicon/`).
2. The Agent will spawn a **Browser Subagent** with the explicit command to:
   * Navigate to the provided URL.
   * Hard-resize the viewport to extreme mobile dimensions: `320x568` (iPhone SE scale).
   * Perform a full vertical scroll down the page to check for content overflow, horizontal scrolling bugs, or broken flex containers.
   * If there are interactive mobile toggles (like the Codex/Lexicon "Return to Index" buttons), click them to ensure state management works under pressure.
   * Capture a full page screenshot.
   * Resize the viewport to `768x1024` (iPad Mini / MD breakpoint) and capture another screenshot to ensure the layout cleanly swaps back to desktop flex modes without requiring a reload.
3. The Agent will return the screenshots to the Operator for visual confirmation of the architecture's integrity.

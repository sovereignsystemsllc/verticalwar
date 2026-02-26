---
description: Apply V3 zero-collapse flex architecture and mobile toggles to two-pane layouts
---
This workflow standardizes the process of taking a legacy split-pane UI (like a sidebar and a content reader) and converting it to the Sovereign V3 mobile-responsive standard.

### Core Architecture Guidelines

1. **The Viewport Lock:**
   The ultimate parent container (`<body>` or the main wrapper) MUST use `h-screen h-[100dvh] overflow-hidden flex flex-col`. This prevents the document itself from scrolling, ensuring that internal child lists use their own native scrollbars.

2. **The Zero-Collapse Flex Panes:**
   Remove any `absolute inset-0` or manual height calculations from the child panes (the sidebar and the reader).
   Instead, apply `flex-1 relative overflow-hidden flex flex-col` to the wrapper holding the panes, and `flex-1 overflow-y-auto` to the panes themselves.

3. **The Pure Tailwind Viewport Toggle:**
   Remove legacy CSS classes like `.mobile-hidden`.
   - **Sidebar Container:** Add `flex md:flex` (it is visible by default on mobile)
   - **Reader Container:** Add `hidden md:flex` (it is hidden by default on mobile)

4. **The Javascript State Manager:**
   Implement a `toggleView(view)` function that cleanly swaps the Tailwind classes.

   ```javascript
   window.toggleView = function (v) {
       if (window.innerWidth <= 768) {
           const sidebar = document.getElementById('sidebar'); // Adapt to actual IDs
           const reader = document.getElementById('reader');

           if (v === 'reader') {
               sidebar.classList.remove('flex'); sidebar.classList.add('hidden');
               reader.classList.remove('hidden'); reader.classList.add('flex');
               reader.scrollTop = 0;
           } else {
               sidebar.classList.remove('hidden'); sidebar.classList.add('flex');
               reader.classList.remove('flex'); reader.classList.add('hidden');
           }
       }
   }
   ```

   *Note: Ensure the UI has a `<button onclick="toggleView('sidebar')">` in the mobile header of the Reader pane, and that selecting an item in the Sidebar triggers `toggleView('reader')`.*

---
description: Site Deployment Workflow
---
To deploy an updated version of the site live to Siteground, we utilize the custom Node.js deployment script. This avoids interactive terminal prompts and works fully autonomously.

1.  ### Deploy Live
    Build the site and overwrite the live codebase automatically.
    // turbo
    ```bash
    node deploy.js
    ```

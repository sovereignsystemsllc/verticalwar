# WORKPLACE INSTRUCTIONS // VERTICAL WAR V4

## DEPLOYMENT PROTOCOL (ZIP-STRIKE MANDATE)
The baseline SCP recursive traversal proved fatally slow for static metadata generation (189+ index folders). The Architect has overridden the previous raw `scp -r` mandate.

**All deployments to the live SiteGround server MUST be executed via the local `deploy.ps1` script.**

This script executes the following Sovereign Pipeline:
1. `npm run build` (vite compilation + prerender traversal)
2. `Compress-Archive` (compresses the `dist/` directory into a single `build.zip` payload)
3. `scp` (pushes the single payload to the SiteGround box via SSH key)
4. `ssh` (executes a remote `unzip` over the `public_html` directory and cleans the zip file)

To deploy: Simply run `.\deploy.ps1` and supply the `SFTP_PASSWORD` when OpenSSH prompts for the key passphrase.

# WORKPLACE INSTRUCTIONS // VERTICAL WAR V4

## DEPLOYMENT PROTOCOL (MANDATORY)
**NEVER** use deployment scripts (`deploy.ps1`, `deploy.js`, etc.). 
The Architect has mandated that **all deployments** to the live SiteGround server MUST be executed via raw SSH/SCP. 

**The Official Deployment Command is:**
`scp -i C:\Users\76com\.ssh\rika -P 18765 -o StrictHostKeyChecking=no -r .\dist\* u2222-vxkuggohnxin@ssh.verticalwar.com:www/verticalwar.com/public_html`

(The passphrase for the SSH key is stored in the `.env` file under `SFTP_PASSWORD`).

Whenever the Operator asks to deploy or push live:
1. Build the site (`npm run build`).
2. Execute the exact SCP command above.
3. Supply the passphrase via standard input.
4. Do not attempt to run legacy automation scripts.

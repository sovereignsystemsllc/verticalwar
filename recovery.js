import Client from 'ssh2-sftp-client';
import { Client as SSHClient } from 'ssh2';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function executeRecovery() {
    console.log('[RECOVERY] Loading Sovereign Key...');
    const config = {
        host: process.env.SFTP_HOST,
        port: parseInt(process.env.SFTP_PORT, 10),
        username: process.env.SFTP_USER,
        privateKey: fs.readFileSync('C:\\Users\\76com\\.ssh\\rika'),
        passphrase: process.env.SFTP_PASSWORD // Trying the SFTP password as the SSH key passphrase
    };

    const sftp = new Client();
    const localRecoveryPath = 'C:\\Users\\76com\\OneDrive\\Desktop\\Sovereign_HQ\\site_recovery';

    if (!fs.existsSync(localRecoveryPath)) {
        fs.mkdirSync(localRecoveryPath, { recursive: true });
    }

    try {
        console.log('[RECOVERY] Initiating SSH tunnel to bundle payload...');
        await new Promise((resolve, reject) => {
            const conn = new SSHClient();
            conn.on('ready', () => {
                console.log('[RECOVERY] SSH Tunnel Active. Zipping remote payload explicitly excluding the 1.5GB images folder...');
                conn.exec("cd www/verticalwar.com/public_html && zip -r recovery.zip . -x 'assets/images/*'", (err, stream) => {
                    if (err) return reject(err);
                    stream.on('close', (code, signal) => {
                        console.log(`[RECOVERY] Remote bundling complete (Exit code ${code}). Closing tunnel.`);
                        conn.end();
                        resolve();
                    }).on('data', (data) => {
                        // Suppress massive log output, just show progress dots
                        process.stdout.write('.');
                    }).stderr.on('data', (data) => {
                        console.error(data.toString());
                    });
                });
            }).on('error', (err) => {
                reject(err);
            }).connect(config);
        });

        console.log('\n[RECOVERY] Connecting via SFTP to pull recovery.zip...');
        await sftp.connect(config);
        await sftp.fastGet(process.env.SFTP_REMOTE_ROOT + '/recovery.zip', path.join(localRecoveryPath, 'recovery.zip'));
        console.log('[RECOVERY] Download complete.');

    } catch (err) {
        console.error('\n[ERROR] Recovery Pipeline Failed:', err.message);
    } finally {
        sftp.end();
    }
}

executeRecovery();

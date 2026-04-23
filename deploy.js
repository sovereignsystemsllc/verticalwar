import Client from 'ssh2-sftp-client';
import { Client as SSHClient } from 'ssh2';
import 'dotenv/config';
import fs from 'fs';

async function deploy() {
    const sftp = new Client();
    const config = {
        host: 'ssh.verticalwar.com',
        port: 18765,
        username: 'u2222-vxkuggohnxin',
        privateKey: fs.readFileSync('C:\\Users\\76com\\.ssh\\rika'),
        passphrase: process.env.SFTP_PASSWORD
    };

    try {
        console.log('[DEPLOY] Connecting via SFTP...');
        await sftp.connect(config);
        console.log('[DEPLOY] Uploading deployment_smart.zip...');
        await sftp.fastPut('deployment_smart.zip', 'www/verticalwar.com/deployment_smart.zip');
        console.log('[DEPLOY] Uploading .env file to secure root...');
        await sftp.fastPut('.env', 'www/verticalwar.com/.env');
        await sftp.end();
        console.log('[DEPLOY] Upload complete.');

        console.log('[DEPLOY] Connecting via SSH to unzip payload...');
        const conn = new SSHClient();
        conn.on('ready', () => {
            conn.exec('cd www/verticalwar.com && unzip -o deployment_smart.zip -d public_html/ && rm deployment_smart.zip', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log(`[DEPLOY] Unzip closed with code ${code}`);
                    conn.end();
                    console.log('[OK] ZIP-STRIKE SECURED.');
                }).on('data', (data) => {
                    console.log(data.toString());
                }).stderr.on('data', (data) => {
                    console.error(data.toString());
                });
            });
        }).connect(config);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deploy();

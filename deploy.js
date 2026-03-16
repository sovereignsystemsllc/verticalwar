import { execSync } from 'child_process';
import Client from 'ssh2-sftp-client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
  const sftp = new Client();
  
  const privateKeyPath = path.resolve(process.env.USERPROFILE || process.env.HOME, '.ssh/rika');
  let privateKey;
  try {
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  } catch (err) {
    console.error(`❌ Could not read SSH key at ${privateKeyPath}. Check if the file exists.`);
    process.exit(1);
  }

  const config = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    privateKey: privateKey,
    passphrase: process.env.SFTP_PASSWORD,
  };

  const localDistDir = path.join(__dirname, 'dist');
  const remoteDir = process.env.SFTP_REMOTE_ROOT;

  try {
    console.log('[1/3] Building site (vite build)...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n[2/3] Connecting to Siteground SFTP...');
    await sftp.connect(config);
    console.log('      Connected successfully!');

    console.log('\n[3/3] Uploading /dist folder to live server...');
    // uploadDir pushes local contents exactly as they are into the remote directory
    await sftp.uploadDir(localDistDir, remoteDir);

    console.log('\n✅ Deploy complete! The live site has been updated.');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
  } finally {
    sftp.end();
  }
}

deploy();

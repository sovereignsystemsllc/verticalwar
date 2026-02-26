import os
import ftplib

env_path = os.path.join(os.path.dirname('deploy_v3.py'), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                try:
                    key, val = line.split('=', 1)
                    os.environ[key] = val.strip(' "\'')
                except ValueError:
                    continue

FTP_HOST = os.environ.get('FTP_HOST')
FTP_USER = os.environ.get('FTP_USER')
FTP_PASS = os.environ.get('FTP_PASS')

def upload():
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        files = ftp.nlst()
        if 'public_html' in files:
            ftp.cwd('public_html')

        def up_dir(l, r):
            try:
                ftp.mkd(r)
            except:
                pass
            for i in os.listdir(l):
                li = os.path.join(l, i)
                ri = f'{r}/{i}'
                if os.path.isdir(li):
                    up_dir(li, ri)
                else:
                    with open(li, 'rb') as f:
                        try:
                            ftp.storbinary(f'STOR {ri}', f)
                            print(f'Uploaded: {ri}')
                        except Exception as e:
                            print(f'Failed {ri}: {e}')

        up_dir('learn', 'learn')
        up_dir('synth', 'synth')
        ftp.quit()
        print("Final sidebar directories uploaded successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    upload()

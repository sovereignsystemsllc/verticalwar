import os
import ftplib

env_path = os.path.join(os.path.dirname(__file__), '.env')
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

FTP_HOST = os.environ.get("FTP_HOST")
FTP_USER = os.environ.get("FTP_USER")
FTP_PASS = os.environ.get("FTP_PASS")

def rescue():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    
    files = ftp.nlst()
    if 'index.html' not in files and 'public_html' in files:
        ftp.cwd('public_html')
    elif 'verticalwar.com' in files:
        ftp.cwd('verticalwar.com')
        if 'public_html' in ftp.nlst():
            ftp.cwd('public_html')

    # Upload index.html immediately
    index_path = os.path.join(os.path.dirname(__file__), 'index.html')
    with open(index_path, 'rb') as f:
        ftp.storbinary('STOR index.html', f)
    print("index.html rescued!")
    ftp.quit()

if __name__ == "__main__":
    rescue()

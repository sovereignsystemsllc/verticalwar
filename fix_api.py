import os
import re

targets = [
    "synth/rika/index.html",
    "synth/makemyown/index.html",
    "learn/receipt-protocol/index.html",
    "learn/paper-trail/index.html"
]

def patch_api(content):
    # 1. Fix the fetch URL
    # Find fetch("../../api/antigravity.php" or fetch("../api/antigravity.php" and replace with absolute
    content = re.sub(r'fetch\([\'"]\.\./\.\./api/antigravity\.php[\'"]', 'fetch("https://verticalwar.com/api/antigravity.php"', content)
    content = re.sub(r'fetch\([\'"]\.\./api/antigravity\.php[\'"]', 'fetch("https://verticalwar.com/api/antigravity.php"', content)
    
    # 2. Fix the model name
    # gemini-3-pro-preview -> gemini-1.5-pro-latest
    content = content.replace('"gemini-3-pro-preview"', '"gemini-1.5-pro-latest"')
    
    return content

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            data = f.read()
            
        new_data = patch_api(data)
        
        if data != new_data:
            with open(t, "w", encoding="utf-8") as f:
                f.write(new_data)
            print(f"Patched API for: {t}")
        else:
            print(f"No changes needed or API not found in: {t}")
    else:
        print(f"File missing: {t}")

import os
import re

targets = [
    "synth/rika/index.html",
    "synth/makemyown/index.html",
    "learn/receipt-protocol/index.html",
    "learn/paper-trail/index.html"
]

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            data = f.read()
            
        new_data = data.replace('fetch("https://verticalwar.com/api/antigravity.php"', 'fetch("../../api/antigravity.php"')
        # Handle the root paths for learn/
        if "learn/" in t:
            new_data = new_data.replace('fetch("../../api/antigravity.php"', 'fetch("/api/antigravity.php"')
            
        with open(t, "w", encoding="utf-8") as f:
            f.write(new_data)
        print(f"Reverted to relative paths for: {t}")

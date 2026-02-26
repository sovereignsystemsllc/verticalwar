import os
import re

targets = [
    "cmd/profile/index.html",
    "cmd/network/index.html",
    "cmd/terminal/index.html",
    "cmd/dispatch/index.html",
    "cmd/codex/index.html",
    "cmd/lexicon/index.html",
    "cmd/index.html",
    "index.html"
]

def sanitize(content):
    # Rip out the fontFamily object entirely if it just contains mono: ['Courier New', 'monospace']
    content = re.sub(r"fontFamily:\s*\{\s*mono:\s*\[\'Courier New\',\s*\'monospace\'\]\s*\}", "", content)
    # Also strip out 'Courier New' from any other font-family arrays
    content = re.sub(r"\'Courier New\',\s*", "", content)
    content = re.sub(r"\"Courier New\",\s*", "", content)
    return content

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            data = f.read()
            
        new_data = sanitize(data)
        
        with open(t, "w", encoding="utf-8") as f:
            f.write(new_data)
        print(f"Patched Courier: {t}")
    else:
        print(f"Skipped missing: {t}")

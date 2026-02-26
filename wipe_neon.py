import os
import re

targets = [
    "index.html",
    "cmd/index.html",
    "cmd/codex/index.html",
    "cmd/lexicon/index.html",
    "cmd/network/index.html",
    "cmd/profile/index.html",
    "cmd/dispatch/index.html",
    "cmd/terminal/index.html"
]

def sanitize(content):
    # 1. Remove Google Fonts links
    content = re.sub(r'<link[^>]*fonts\.googleapis\.com[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<link[^>]*fonts\.gstatic\.com[^>]*>', '', content, flags=re.IGNORECASE)

    # 2. Update Hex Colors (neon green -> muted green, pure black -> void black, pure white text -> off white)
    content = re.sub(r'(?i)#00ff33', '#22c55e', content)
    content = re.sub(r'(?i)rgba\(0,\s*255,\s*51', 'rgba(34, 197, 94', content)
    
    # 3. Update Tailwind configs (if they exist in the file)
    content = re.sub(r"\'term-green\':\s*\'#[0-9a-fA-F]+\'", "'term-green': '#22c55e'", content)
    content = re.sub(r"\'void\':\s*\'#[0-9a-fA-F]+\'", "'void': '#05010a'", content)
    content = re.sub(r"\'command-text\':\s*\'#[0-9a-fA-F]+\'", "'command-text': '#e4e4e7'", content)
    
    # Let's replace raw #000000 with #05010a in CSS
    content = re.sub(r'background(?:-color)?:\s*#000000;', 'background-color: #05010a;', content)
    content = re.sub(r'bg-black', 'bg-[#05010a]', content)

    # 4. Strip glowing drop shadows completely
    content = re.sub(r'drop-shadow-\[[^\]]+\]', '', content)
    content = re.sub(r'shadow-\[[^\]]+\]', '', content) # strip standard arbitrary shadows too

    # 5. Fix fonts (font-tech -> font-mono, rm font-serif)
    content = re.sub(r'\bfont-tech\b', 'font-mono', content)
    content = re.sub(r'\bfont-serif\b', 'font-mono', content)
    content = re.sub(r'\bfont-sans\b', 'font-mono', content)

    # Clean up empty class attributes left behind
    content = re.sub(r'class="\s+"', 'class=""', content)
    
    return content

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            data = f.read()
            
        new_data = sanitize(data)
        
        with open(t, "w", encoding="utf-8") as f:
            f.write(new_data)
        print(f"Patched: {t}")
    else:
        print(f"Skipped missing: {t}")

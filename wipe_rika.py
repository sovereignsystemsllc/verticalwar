import os
import re

t = "synth/rika/index.html"

def sanitize(content):
    content = re.sub(r'<link[^>]*fonts\.googleapis\.com[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<link[^>]*fonts\.gstatic\.com[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'(?i)#00ff33', '#22c55e', content)
    content = re.sub(r'(?i)rgba\(0,\s*255,\s*51', 'rgba(34, 197, 94', content)
    content = re.sub(r"\'term-green\':\s*\'#[0-9a-fA-F]+\'", "'term-green': '#22c55e'", content)
    content = re.sub(r"\'void\':\s*\'#[0-9a-fA-F]+\'", "'void': '#05010a'", content)
    content = re.sub(r'background(?:-color)?:\s*#000000;', 'background-color: #05010a;', content)
    content = re.sub(r'bg-black', 'bg-[#05010a]', content)
    content = re.sub(r'drop-shadow-\[[^\]]+\]', '', content)
    content = re.sub(r'shadow-\[[^\]]+\]', '', content)
    content = re.sub(r'\bfont-tech\b', 'font-mono', content)
    content = re.sub(r'\bfont-serif\b', 'font-mono', content)
    content = re.sub(r'\bfont-sans\b', 'font-mono', content)
    
    # Courier wipe
    content = re.sub(r"fontFamily:\s*\{\s*mono:\s*\[\'Courier New\',\s*\'monospace\'\]\s*\}", "", content)
    content = re.sub(r"\'Courier New\',\s*", "", content)
    content = content.replace("box-shadow: 0 0 15px rgba(34, 197, 94, 0.1);", "")
    content = content.replace("box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);", "")

    return content

if os.path.exists(t):
    with open(t, "r", encoding="utf-8") as f:
        data = f.read()
    new_data = sanitize(data)
    with open(t, "w", encoding="utf-8") as f:
        f.write(new_data)
    print(f"Patched: {t}")
else:
    print(f"Skipped missing: {t}")

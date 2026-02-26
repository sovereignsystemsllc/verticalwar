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
    "index.html",
    "synth/rika/index.html",
    "learn/index.html",
    "learn/induction/index.html",
    "learn/paper-trail/index.html",
    "learn/receipt-protocol/index.html"
]

injection = """
                    fontFamily: {
                        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
                        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
                    },
"""

def force_override(content):
    # First remove any existing fontFamily definitions
    content = re.sub(r'fontFamily:\s*\{[^}]+\},?', '', content)
    # Now inject our strict config directly under colors or extend
    # If colors exists, append after it:
    if "colors: {" in content:
        # find the end of the colors block roughly
        content = re.sub(r'(colors:\s*\{[^}]+\}),', r'\1,\n' + injection, content)
        # if no comma was matched, it might be the last item
        if injection not in content:
            content = re.sub(r'(colors:\s*\{[^}]+\})\s*\}', r'\1,\n' + injection + '\n}', content)
            
    elif "extend: {" in content:
         content = content.replace("extend: {", "extend: {" + injection)
    
    return content

for t in targets:
    if os.path.exists(t):
        with open(t, "r", encoding="utf-8") as f:
            data = f.read()
            
        new_data = force_override(data)
        
        with open(t, "w", encoding="utf-8") as f:
            f.write(new_data)
        print(f"Patched: {t}")

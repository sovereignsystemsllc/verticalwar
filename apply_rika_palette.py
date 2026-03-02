import os

def replace_colors(directory):
    replacements = {
        '#22c55e': '#a78bfa',
        '34, 197, 94': '167, 139, 250',
        'rgba(34, 197, 94,': 'rgba(167, 139, 250,',
        'term-green': 'term-purple'
    }

    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith(('.html', '.css', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    new_content = content
                    for old, new in replacements.items():
                        new_content = new_content.replace(old, new)
                    
                    # Add scanline effect to style.css if not exists
                    if file == 'style.css' and 'scanline' not in new_content:
                        new_content += "\n@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }\n.scanline-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 50; background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(167,139,250,0.04) 50%, rgba(0,0,0,0) 100%); animation: scanline 10s linear infinite; }\n"

                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Failed {filepath}: {e}")

replace_colors(r"C:\Users\76com\OneDrive\Desktop\verticalwar_v4")

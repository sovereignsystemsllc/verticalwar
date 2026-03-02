import os
import re

def inject_scanline(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if 'scanline-overlay' not in content:
                        # Find the end of the body tag
                        body_match = re.search(r'(<body[^>]*>)', content)
                        if body_match:
                            body_tag = body_match.group(1)
                            new_content = content.replace(
                                body_tag, 
                                f'{body_tag}\n  <!-- CRT SCANLINE (RIKA AESTHETIC) -->\n  <div class="scanline-overlay"></div>'
                            )
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"Injected scanline into {filepath}")
                except Exception as e:
                    print(f"Failed {filepath}: {e}")

inject_scanline(r"C:\Users\76com\OneDrive\Desktop\verticalwar_v4")

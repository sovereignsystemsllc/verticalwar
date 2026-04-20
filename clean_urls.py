import os, re
root = 'c:/Users/76com/OneDrive/Desktop/Sovereign_HQ/verticalwar_v4'
count = 0
for dirpath, _, filenames in os.walk(root):
    if 'node_modules' in dirpath or 'dist' in dirpath or '.git' in dirpath or 'scratch' in dirpath:
        continue
    for filename in filenames:
        if filename.endswith('.html') or filename.endswith('.js'):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                enc = 'utf-8'
            except UnicodeDecodeError:
                with open(filepath, 'r', encoding='utf-16') as f:
                    content = f.read()
                enc = 'utf-16'
            original = content
            
            # 1. inner-circle.html -> /order
            content = content.replace('href="/inner-circle.html"', 'href="/order"')
            content = content.replace("href='/inner-circle.html'", "href='/order'")
            
            # 2. inner-circle -> /order (in case it's caught elsewhere)
            content = content.replace('href="/inner-circle"', 'href="/order"')
            
            # 3. /index.html -> /
            content = re.sub(r'href="([^"#\?]+)/index\.html"', r'href="\1/"', content)
            
            # 4. .html -> ""
            content = re.sub(r'href="([^"#\?]+)\.html"', r'href="\1"', content)
            
            if content != original:
                with open(filepath, 'w', encoding=enc) as f:
                    f.write(content)
                count += 1
                print(f'Updated {filepath}')

print(f'Total files updated: {count}')

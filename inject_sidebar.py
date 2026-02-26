import os
import re

files_to_update = {
    'synth/rika/index.html': '../../assets/js/sidebar.js',
    'synth/makemyown/index.html': '../../assets/js/sidebar.js',
    'read/index.html': '../assets/js/sidebar.js',
    'learn/induction/map.html': '../../assets/js/sidebar.js',
    'learn/induction/index.html': '../../assets/js/sidebar.js',
    'learn/induction/drill/index.html': '../../../assets/js/sidebar.js',
    'index.html': 'assets/js/sidebar.js',
    'cmd/network/index.html': '../../assets/js/sidebar.js',
    'cmd/lexicon/index.html': '../../assets/js/sidebar.js',
    'cmd/codex/index.html': '../../assets/js/sidebar.js'
}

base_dir = r"C:\Users\76com\OneDrive\Desktop\sovereign_v3"

processed = 0
for rel_path, sidebar_path in files_to_update.items():
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"Skipping {rel_path} - not found.")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    updated = False
    
    # 1. Inject sidebar script before </head> if not already there
    if 'sidebar.js' not in content:
        script_tag = f'\n    <!-- MSX SIDEBAR INJECTION -->\n    <script type="module" src="{sidebar_path}"></script>\n</head>'
        content = content.replace('</head>', script_tag)
        updated = True
    
    # 2. Add padding to body
    # Find <body ... >
    body_match = re.search(r'<body[^>]*>', content)
    if body_match:
        body_tag = body_match.group(0)
        if 'pl-[256px]' not in body_tag:
            if 'class="' in body_tag:
                new_body = body_tag.replace('class="', 'class="pl-0 lg:pl-[256px] ')
            else:
                new_body = body_tag.replace('<body', '<body class="pl-0 lg:pl-[256px]"')
            content = content.replace(body_tag, new_body)
            updated = True
            
    if updated:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        processed += 1
        print(f"Updated {rel_path}")
        
print(f"Done. Processed {processed} files.")

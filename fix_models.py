import os

targets = [
    ("synth/rika/index.html", "gemini-1.5-pro-latest", "gemini-3-pro-preview"),
    ("synth/makemyown/index.html", "gemini-1.5-pro-latest", "gemini-3-pro-preview"),
    ("learn/receipt-protocol/index.html", "gemini-1.5-flash-latest", "gemini-3-flash-preview"),
    ("learn/paper-trail/index.html", "gemini-1.5-flash-latest", "gemini-3-flash-preview")
]

for filepath, old_str, new_str in targets:
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = f.read()
        
        new_data = data.replace(old_str, new_str)
        
        if new_data != data:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_data)
            print(f"Reverted model in {filepath} to {new_str}")
        else:
            print(f"No changes needed in {filepath}")
    else:
        print(f"Missing file: {filepath}")

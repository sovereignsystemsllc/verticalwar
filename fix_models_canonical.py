import os

targets = [
    ("synth/rika/index.html", "gemini-pro-preview", "gemini-3-pro-preview"),
    ("synth/makemyown/index.html", "gemini-pro-preview", "gemini-3-pro-preview"),
    ("learn/receipt-protocol/index.html", "gemini-pro-preview", "gemini-3-flash-preview"),
    ("learn/paper-trail/index.html", "gemini-pro-preview", "gemini-3-flash-preview")
]

# also checking for 1.5 in case the previous script somehow didn't fully revert
targets_2 = [
    ("synth/rika/index.html", "gemini-1.5-pro-latest", "gemini-3-pro-preview"),
    ("synth/makemyown/index.html", "gemini-1.5-pro-latest", "gemini-3-pro-preview"),
    ("learn/receipt-protocol/index.html", "gemini-1.5-flash-latest", "gemini-3-flash-preview"),
    ("learn/paper-trail/index.html", "gemini-1.5-flash-latest", "gemini-3-flash-preview")
]

for targets_list in [targets, targets_2]:
    for filepath, old_str, new_str in targets_list:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = f.read()
            if old_str in data:
                new_data = data.replace(old_str, new_str)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_data)
                print(f"Restored canonical model in {filepath} to {new_str}")

import os

directory = r"c:\Users\UWAIS\Desktop\TenderGuard\frontend\src"

replacements = {
    "#10b981": "#ffffff",
    "#f59e0b": "#dc2626",
    "#ef4444": "#dc2626",
    "rgba(16, 185, 129,": "rgba(255, 255, 255,",
    "rgba(245, 158, 11,": "rgba(220, 38, 38,",
    "rgba(239, 68, 68,": "rgba(220, 38, 38,",
    "rgba(30, 41, 59,": "rgba(51, 51, 51,"
}

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".css") or file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            # Additional case-insensitive replacements just in case
            for old, new in replacements.items():
                new_content = new_content.replace(old.upper(), new)

            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

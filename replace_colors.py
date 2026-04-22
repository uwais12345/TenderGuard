import os

directory = r"c:\Users\UWAIS\Desktop\TenderGuard\frontend\src"

replacements = {
    "#3b82f6": "#dc2626",
    "#2563eb": "#b91c1c",
    "#6366f1": "#ef4444",
    "#8b5cf6": "#b91c1c",
    "#ec4899": "#ffffff",
    "rgba(59, 130, 246,": "rgba(220, 38, 38,",
    "rgba(99, 102, 241,": "rgba(239, 68, 68,",
    "rgba(139, 92, 246,": "rgba(185, 28, 28,",
    "#0a0f1e": "#000000",
    "#111827": "#111111",
    "#1a2235": "#1a1a1a",
    "#1e293b": "#333333",
    "#0d1321": "#0a0a0a",
    "#2a3a5c": "#444444",
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

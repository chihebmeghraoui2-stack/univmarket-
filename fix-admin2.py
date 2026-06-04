with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Trouve toutes les lignes import mal placees (apres ligne 100)
new_lines = []
for i, line in enumerate(lines):
    if i > 100 and line.strip().startswith("import "):
        print(f"Suppression ligne {i+1}: {line.strip()}")
        continue
    new_lines.append(line)

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Done")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Affiche les lignes autour de 396
for i in range(388, min(405, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Trouve les deux occurrences de /admin/ai-assistant
occurrences = [i for i, l in enumerate(lines) if '"/admin/ai-assistant"' in l]
print(f"Trouvees aux lignes: {[o+1 for o in occurrences]}")

if len(occurrences) >= 2:
    # Garde seulement la deuxieme occurrence
    # Supprime de la premiere a juste avant la deuxieme
    first = occurrences[0]
    second = occurrences[1]
    
    new_lines = lines[:first] + lines[second:]
    
    with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"Supprime lignes {first+1} a {second} ({second-first} lignes)")

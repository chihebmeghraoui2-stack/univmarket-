with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
seen_hasArabic = False
seen_hasEnglish = False  
seen_detectedLang = False
skip_next = False

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Supprimer les doublons de hasArabic/hasEnglish/detectedLang
    if "const hasArabic" in stripped:
        if seen_hasArabic:
            print(f"Skip doublon ligne {i+1}: hasArabic")
            continue
        seen_hasArabic = True
    
    if "const hasEnglish" in stripped:
        if seen_hasEnglish:
            print(f"Skip doublon ligne {i+1}: hasEnglish")
            continue
        seen_hasEnglish = True
        
    if "const detectedLang" in stripped:
        if seen_detectedLang:
            print(f"Skip doublon ligne {i+1}: detectedLang")
            continue
        seen_detectedLang = True

    # Fixer la regex mal formee
    if "(what|how|why|when|who|where|show|give|tell|list|analyze|report|help/i.test" in stripped:
        line = line.replace(
            "(what|how|why|when|who|where|show|give|tell|list|analyze|report|help/i.test(message)",
            "/what|how|why|when|who|where|show|give|tell|list|analyze|report|help/i.test(message)"
        )
        print(f"Fix regex ligne {i+1}")

    new_lines.append(line)

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Done - {len(lines)} -> {len(new_lines)} lignes")

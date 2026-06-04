with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

opens = content.count("{")
closes = content.count("}")
print(f"Ouvertes: {opens}, Fermees: {closes}, Diff: {opens - closes}")

# Ajoute accolade manquante avant export
if opens > closes:
    diff = opens - closes
    content = content.replace("\nexport default router;", "\n" + "}" * diff + "\nexport default router;")
    with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Ajoute {diff} accolade(s)")

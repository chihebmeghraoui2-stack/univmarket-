with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Compte les accolades
opens = content.count("{")
closes = content.count("}")
print(f"Ouvertes: {opens}, Fermees: {closes}, Diff: {opens - closes}")

# Ajoute les accolades manquantes avant export default
diff = opens - closes
if diff > 0:
    content = content.replace("export default router;", "}" * diff + "\nexport default router;")
    with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Ajoute {diff} accolade(s) fermante(s)")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Remplace la partie cassee
old = '${userContext ? "ANALYSE UTILISATEUR SPÉCIFIQUE:\n" + userContext + "\n══════════════════════════════════════════════════" : ""}'
new = '${userContext ? `ANALYSE UTILISATEUR SPECIFIQUE:\n${userContext}\n══════════════════════════════════════════════════` : ""}'

content = content.replace(old, new)

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Fix 1: Ajouter detectedLang manquant apres "// Auto-detection langue depuis le message"
old = """    // Auto-detection langue depuis le message

    // Auto-detection langue depuis le message

    // === COLLECTE COMPLETE DE TOUTES LES DONNEES ===""" 
new = """    // Auto-detection langue depuis le message
    const hasArabic = /[\u0600-\u06FF]/.test(message);
    const hasEnglish = /what|how|why|when|who|where|show|give|tell|list|analyze|report|help/i.test(message);
    const detectedLang = hasArabic ? "ar" : hasEnglish ? "en" : language;

    // === COLLECTE COMPLETE DE TOUTES LES DONNEES ==="""
content = content.replace(old, new)

# Fix 2: Supprimer le } en trop avant export default
content = content.replace("\n}\nexport default router;", "\nexport default router;")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

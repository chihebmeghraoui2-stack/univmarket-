with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

content = content.replace("}}\nexport default router;", "export default router;")
content = content.replace("}\n}\nexport default router;", "export default router;")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

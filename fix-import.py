with open(r"E:\proget uni\projet2\artifacts\univmarket\src\pages\seller\services.tsx", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Corrige la ligne cassee
content = content.replace(
    'import LocationPicker from "@/components/LocationPicker"; from "lucide-react";',
    'from "lucide-react";\nimport LocationPicker from "@/components/LocationPicker";'
)

with open(r"E:\proget uni\projet2\artifacts\univmarket\src\pages\seller\services.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

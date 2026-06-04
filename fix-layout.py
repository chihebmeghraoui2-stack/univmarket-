with open(r"E:\proget uni\projet2\artifacts\univmarket\src\pages\seller\services.tsx", encoding="utf-8", errors="ignore") as f:
    content = f.read()

old = """{isMarketingCategory && (
  <div className="space-y-2 border border-teal-200 bg-teal-50/50 rounded-xl p-3">
    <label className="text-sm font-medium flex items-center gap-2 text-teal-800">
      <MapPin className="h-4 w-4" />
      Localisation de l'evenement <span className="text-xs text-red-500">*</span>
    </label>
    <p className="text-xs text-teal-600">Ex: Departement Informatique, Universite Tlemcen</p>
    <LocationPicker value={serviceLocation} onChange={setServiceLocation} />
  </div>
)}
                  <label className="text-sm font-medium">Photos du service <span className="text-red-500">*</span></label>"""

new = """              {isMarketingCategory && (
                <div className="space-y-2 border border-teal-200 bg-teal-50/50 rounded-xl p-3">
                  <label className="text-sm font-medium flex items-center gap-2 text-teal-800">
                    <MapPin className="h-4 w-4" />
                    Localisation de l'evenement <span className="text-xs text-red-500">*</span>
                  </label>
                  <p className="text-xs text-teal-600">Ex: Departement Informatique, Universite Tlemcen</p>
                  <LocationPicker value={serviceLocation} onChange={setServiceLocation} />
                </div>
              )}
                  <label className="text-sm font-medium">Photos du service <span className="text-red-500">*</span></label>"""

content = content.replace(old, new)

with open(r"E:\proget uni\projet2\artifacts\univmarket\src\pages\seller\services.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")

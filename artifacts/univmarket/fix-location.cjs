const fs = require('fs');

// ===== Fix 1: seller/products.tsx =====
const sellerFile = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\pages\\seller\\products.tsx";
let sellerContent = fs.readFileSync(sellerFile, 'utf8');

// Ajouter import LocationPicker
sellerContent = sellerContent.replace(
  'import WilayaSelector from "@/components/WilayaSelector";',
  'import WilayaSelector from "@/components/WilayaSelector";\nimport LocationPicker from "@/components/LocationPicker";'
);

// Ajouter state location
sellerContent = sellerContent.replace(
  'const [wilayaId, setWilayaId] = useState<number | null>(null);',
  'const [wilayaId, setWilayaId] = useState<number | null>(null);\n  const [eventLocation, setEventLocation] = useState<{lat:number;lng:number;address:string}|null>(null);'
);

// Ajouter location dans payload
sellerContent = sellerContent.replace(
  'const payload = { title, description, price: Number(price), coverPhoto, photos: photos.filter(Boolean), categoryId, wilayaId };',
  'const payload = { title, description, price: Number(price), coverPhoto, photos: photos.filter(Boolean), categoryId, wilayaId, location: eventLocation ? JSON.stringify(eventLocation) : null };'
);

// Reset location dans onSuccess
sellerContent = sellerContent.replace(
  'setWilayaId(null);\n      setEditingId(null);',
  'setWilayaId(null);\n      setEventLocation(null);\n      setEditingId(null);'
);

// Reset dans setEditProduct
sellerContent = sellerContent.replace(
  'setWilayaId(product.wilayaId);',
  'setWilayaId(product.wilayaId);\n    setEventLocation(product.location ? JSON.parse(product.location) : null);'
);

// Ajouter LocationPicker après WilayaSelector dans le formulaire
sellerContent = sellerContent.replace(
  '<WilayaSelector value={wilayaId} onChange={setWilayaId} />',
  `<WilayaSelector value={wilayaId} onChange={setWilayaId} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              📍 Localisation de l'événement <span className="text-xs text-muted-foreground">(optionnel — pour événements physiques)</span>
            </label>
            <LocationPicker value={eventLocation} onChange={setEventLocation} />`
);

fs.writeFileSync(sellerFile, sellerContent, 'utf8');
console.log('OK - seller/products.tsx mis a jour');

// ===== Fix 2: product-detail.tsx =====
const detailFile = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\pages\\product-detail.tsx";
let detailContent = fs.readFileSync(detailFile, 'utf8');

// Ajouter imports MapPin et Navigation
detailContent = detailContent.replace(
  'import { ArrowLeft, ExternalLink }',
  'import { ArrowLeft, ExternalLink, MapPin, Navigation }'
);

// Ajouter bouton GPS avant le bloc existingChat
const gpsBlock = `{/* Bouton localisation GPS */}
      {product?.location && (() => {
        try {
          const loc = JSON.parse(product.location);
          if (!loc?.lat || !loc?.lng) return null;
          return (
            <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Localisation de l'événement</p>
                  <p className="text-sm text-muted-foreground truncate">{loc.address}</p>
                </div>
                <a
                  href={"https://www.google.com/maps?q=" + loc.lat + "," + loc.lng}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Navigation className="h-4 w-4" />
                  Ouvrir GPS
                </a>
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {existingChat ? (`;

detailContent = detailContent.replace('{existingChat ? (', gpsBlock);

fs.writeFileSync(detailFile, detailContent, 'utf8');
console.log('OK - product-detail.tsx mis a jour');

console.log('\nTout est pret! Maintenant:');
console.log('1. Ajouter la colonne location en DB');
console.log('2. Mettre a jour la route API products');

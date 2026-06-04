const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/leaderboard.tsx', 'utf8');

// Trier les wilayas par code numerique
content = content.replace(
  '{wilayas.map((w: any) => <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>)}',
  '{[...wilayas].sort((a, b) => parseInt(a.code) - parseInt(b.code)).map((w: any) => <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>)}'
);

// Limiter la hauteur du dropdown a 4 visibles avec scroll
content = content.replace(
  '<SelectContent>',
  '<SelectContent className="max-h-40 overflow-y-auto">'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/leaderboard.tsx', content, 'utf8');
console.log('Done');

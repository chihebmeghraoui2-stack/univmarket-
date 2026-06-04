const fs = require('fs');

const file = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\i18n\\index.ts";
let content = fs.readFileSync(file, 'utf8');

// Trouver toutes les clés dupliquées et les supprimer
// Stratégie: pour chaque langue (fr, en, ar), garder seulement la première occurrence de chaque clé

function removeDuplicateKeys(obj_str) {
  const lines = obj_str.split('\n');
  const seenKeys = new Set();
  const result = [];
  
  for (const line of lines) {
    // Chercher une clé style: key: "value" ou key: "value",
    const match = line.match(/^\s{3,}(\w+):/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        // Clé dupliquée — on la skip
        continue;
      }
      seenKeys.add(key);
    }
    result.push(line);
  }
  return result.join('\n');
}

content = removeDuplicateKeys(content);
fs.writeFileSync(file, content, 'utf8');
console.log('OK - doublons i18n supprimes');

// Compter les warnings restants
const lines = content.split('\n');
const keys = {};
let dups = 0;
for (const line of lines) {
  const match = line.match(/^\s{3,}(\w+):/);
  if (match) {
    const k = match[1];
    if (keys[k]) dups++;
    keys[k] = true;
  }
}
console.log('Doublons restants:', dups);

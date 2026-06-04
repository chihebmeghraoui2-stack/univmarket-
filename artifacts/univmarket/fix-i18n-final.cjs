const fs = require('fs');

const file = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\i18n\\index.ts";
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Le fichier a 2 blocs fr, 2 blocs en, 2 blocs ar
// On va trouver les lignes dupliquées et les supprimer
// Stratégie: pour chaque langue, garder seulement la DERNIÈRE occurrence de chaque clé

// D'abord, trouvons toutes les occurrences de chaque clé par langue
// en cherchant les numéros de ligne

function fixLang(lines, langName) {
  // Trouver tous les blocs de cette langue
  const keyOccurrences = new Map(); // key -> [lineIndex, ...]
  
  let inBlock = false;
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Détecter début du bloc de cette langue
    if (new RegExp(`^const ${langName}\\s*=\\s*\\{`).test(trimmed) || 
        new RegExp(`^${langName}:\\s*\\{`).test(trimmed)) {
      inBlock = true;
      depth = 1;
      continue;
    }
    
    if (inBlock) {
      // Compter les accolades
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }
      
      if (depth <= 0) {
        inBlock = false;
        continue;
      }
      
      // Extraire les clés sur cette ligne
      const matches = [...line.matchAll(/\b(\w+)\s*:\s*["'`]/g)];
      for (const match of matches) {
        const key = match[1];
        if (!keyOccurrences.has(key)) keyOccurrences.set(key, []);
        keyOccurrences.get(key).push(i);
      }
    }
  }
  
  // Trouver les lignes à supprimer (première occurrence des clés dupliquées)
  const linesToRemove = new Set();
  for (const [key, occurrences] of keyOccurrences) {
    if (occurrences.length > 1) {
      // Garder la dernière, supprimer les premières
      for (let i = 0; i < occurrences.length - 1; i++) {
        linesToRemove.add(occurrences[i]);
        console.log(`  Suppression ligne ${occurrences[i]+1} [${langName}]: ${lines[occurrences[i]].trim().substring(0, 60)}`);
      }
    }
  }
  
  return linesToRemove;
}

console.log('=== Analyse fr ===');
const removeFr = fixLang(lines, 'fr');
console.log('\n=== Analyse en ===');
const removeEn = fixLang(lines, 'en');
console.log('\n=== Analyse ar ===');
const removeAr = fixLang(lines, 'ar');

const toRemove = new Set([...removeFr, ...removeEn, ...removeAr]);
console.log(`\nTotal lignes a supprimer: ${toRemove.size}`);

const newLines = lines.filter((_, i) => !toRemove.has(i));
const result = newLines.join('\n');
fs.writeFileSync(file, result, 'utf8');
console.log(`Lignes avant: ${lines.length} -> apres: ${newLines.length}`);
console.log('OK - fichier i18n corrige');

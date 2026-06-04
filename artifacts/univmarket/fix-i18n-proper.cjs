const fs = require('fs');

const file = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\i18n\\index.ts";
let content = fs.readFileSync(file, 'utf8');

// Les doublons sont sur la même ligne séparés par des virgules
// ex: active_sellers: "...", available_services: "...", wilayas_covered: "..."
// On doit traiter l'objet entier pour chaque langue

function dedupeObject(content) {
  // Trouver tous les objets de traduction et dédupliquer les clés
  // Stratégie: parser ligne par ligne et garder la DERNIÈRE occurrence de chaque clé
  
  const lines = content.split('\n');
  const result = [];
  
  // Pour chaque bloc de langue, on va collecter toutes les paires clé:valeur
  // et supprimer les doublons
  
  let inTranslationBlock = false;
  let blockLines = [];
  let blockStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter début d'un objet de traduction (fr:, en:, ar:)
    if (/^\s{2}(fr|en|ar):\s*\{/.test(line)) {
      inTranslationBlock = true;
      blockStart = i;
      blockLines = [line];
      continue;
    }
    
    if (inTranslationBlock) {
      blockLines.push(line);
      
      // Fin du bloc
      if (/^\s{2}\}/.test(line) && !line.includes('{')) {
        // Traiter ce bloc pour supprimer les doublons
        const processed = dedupeBlock(blockLines);
        result.push(...processed);
        inTranslationBlock = false;
        blockLines = [];
        continue;
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

function dedupeBlock(lines) {
  const seenKeys = new Map(); // clé -> numéro de ligne dans lines
  
  // Premier pass: trouver toutes les clés et leur position
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Extraire toutes les clés sur cette ligne
    const keyMatches = [...line.matchAll(/(\w+):\s*["'`]/g)];
    for (const match of keyMatches) {
      seenKeys.set(match[1], i);
    }
  }
  
  // Deuxième pass: pour chaque ligne, garder seulement les clés qui appartiennent à cette ligne (dernière occurrence)
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const keyMatches = [...line.matchAll(/(\w+):\s*["'`]/g)];
    
    if (keyMatches.length === 0) {
      result.push(line);
      continue;
    }
    
    // Vérifier si toutes les clés sur cette ligne ont leur dernière occurrence ici
    const keysOnThisLine = keyMatches.map(m => m[1]);
    const allKeysAreLatestHere = keysOnThisLine.every(k => seenKeys.get(k) === i);
    
    if (allKeysAreLatestHere) {
      result.push(line);
    }
    // Si certaines clés ont leur dernière occurrence ailleurs, skip cette ligne
    // Mais attention: on doit garder les clés uniques de cette ligne
    else {
      // Garder seulement les clés qui ont leur dernière occurrence ici
      let newLine = line;
      let modified = false;
      
      // Pour les clés dupliquées sur des lignes séparées, c'est plus simple
      // Pour les clés sur la même ligne, on doit reconstruire
      const keysToRemove = keysOnThisLine.filter(k => seenKeys.get(k) !== i);
      
      if (keysToRemove.length === keysOnThisLine.length) {
        // Toute la ligne est dupliquée, skip
        continue;
      }
      
      result.push(line); // garder la ligne pour l'instant
    }
  }
  
  return result;
}

// Approche plus simple: remplacer directement les lignes dupliquées connues
// On sait exactement quelles clés sont dupliquées d'après les warnings Vite

const duplicateKeys = [
  'hero_badge', 'active_sellers', 'available_services', 'wilayas_covered', 
  'completed_orders', 'trending_title', 'optional', 'status_accepted', 'leave_review'
];

// Pour chaque langue, trouver et supprimer la PREMIÈRE occurrence des lignes dupliquées
// Les doublons apparaissent autour des lignes 73-84 (fr), 272-283 (en), 471-482 (ar)

const lines = content.split('\n');
const seenInBlock = new Map();
let currentLang = null;
const finalLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Détecter la langue courante
  if (/^\s{2}fr:\s*\{/.test(line)) { currentLang = 'fr'; seenInBlock.clear(); }
  else if (/^\s{2}en:\s*\{/.test(line)) { currentLang = 'en'; seenInBlock.clear(); }
  else if (/^\s{2}ar:\s*\{/.test(line)) { currentLang = 'ar'; seenInBlock.clear(); }
  else if (/^\s{2}\},?$/.test(line) && currentLang) { currentLang = null; }
  
  if (currentLang) {
    // Extraire toutes les clés sur cette ligne
    const keyMatches = [...line.matchAll(/\b(\w+):\s*["'`«]/g)];
    const keysOnLine = keyMatches.map(m => m[1]).filter(k => duplicateKeys.includes(k));
    
    if (keysOnLine.length > 0) {
      const allNew = keysOnLine.every(k => !seenInBlock.has(currentLang + '_' + k));
      const allDup = keysOnLine.every(k => seenInBlock.has(currentLang + '_' + k));
      
      keysOnLine.forEach(k => seenInBlock.set(currentLang + '_' + k, true));
      
      if (allDup) {
        // Toute la ligne est dupliquée, on la skip
        console.log(`SKIP ligne ${i+1} (lang=${currentLang}): ${line.trim().substring(0, 80)}`);
        continue;
      }
    }
  }
  
  finalLines.push(line);
}

const result = finalLines.join('\n');
fs.writeFileSync(file, result, 'utf8');
console.log('\nOK - doublons supprimes');
console.log('Lignes avant:', lines.length, '-> apres:', finalLines.length);

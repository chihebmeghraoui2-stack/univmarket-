const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

// Supprimer la ligne corrompue ", 1500); }}"
content = content.replace(/\s*,\s*1500\);\s*\}\}/g, '');

// Supprimer target="_blank" en double
content = content.replace(/target="_blank"\s*\n\s*target="_blank"/g, 'target="_blank"');

// Fixer le href email pour ouvrir Gmail
content = content.replace(
  /href="mailto:chihebmeghraoui@gmail\.com"/g,
  'href="https://mail.google.com/mail/?view=cm&to=chihebmeghraoui@gmail.com"'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

// Supprimer tous les onClick sur le lien email
content = content.replace(/onClick=\{[^}]+\}/g, '');

// Mettre le bon href Gmail
content = content.replace(
  /href="mailto:chihebmeghraoui@gmail\.com"/g,
  'href="https://mail.google.com/mail/?view=cm&to=chihebmeghraoui@gmail.com"'
);
content = content.replace(
  /href="https:\/\/mail\.google\.com[^"]*"/g,
  'href="https://mail.google.com/mail/?view=cm&to=chihebmeghraoui@gmail.com"'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

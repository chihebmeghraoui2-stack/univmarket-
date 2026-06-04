const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

content = content.replace(
  'href="mailto:chihebmeghraoui@gmail.com"',
  'href="https://mail.google.com/mail/?view=cm&fs=1&to=chihebmeghraoui@gmail.com" target="_blank" rel="noopener noreferrer"'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

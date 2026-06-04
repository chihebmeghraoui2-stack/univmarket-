const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', 'utf8');

const lines = content.split('\n');

// Inserer </td> apres la ligne 131 (index 130)
lines.splice(131, 0, '                      </td>');

content = lines.join('\n');
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', content, 'utf8');
console.log('Done');
lines.slice(129, 137).forEach((l, i) => console.log(130+i, l));

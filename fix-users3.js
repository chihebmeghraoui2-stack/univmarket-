const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', 'utf8');

const lines = content.split('\n');
const fixed = lines.filter((line, i) => {
  if (i === 123 && line.trim().startsWith('{u.banned_at')) return false;
  return true;
});

content = fixed.join('\n');
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', content, 'utf8');
console.log('Done');
fixed.slice(120, 130).forEach((l, i) => console.log(121+i, l));

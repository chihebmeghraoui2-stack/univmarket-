const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', 'utf8');

// Supprimer la ligne dupliquee avec t("banned")
content = content.replace(
  /<Badge className="text-xs bg-red-100 text-red-700 border-none">\{t\("banned"\)\}<\/Badge>\s*\n(\s*\{u\.banned_at \? \()/,
  '$1'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', content, 'utf8');
console.log('Done');
console.log('Lines 122-130:');
const lines = content.split('\n');
lines.slice(121, 130).forEach((l, i) => console.log(122+i, l));

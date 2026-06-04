const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', 'utf8');

content = content.replace(
  '                        )}\n                      <td className="py-3 px-4 text-xs text-muted-foreground">',
  '                        )}\n                      </td>\n                      <td className="py-3 px-4 text-xs text-muted-foreground">'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', content, 'utf8');
console.log('Done');
const lines = content.split('\n');
lines.slice(129, 140).forEach((l, i) => console.log(130+i, l));

const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', 'utf8');

content = content.replace(
`                        {u.banned_at ? (
                          <Badge className="text-xs bg-red-100 text-red-700 border-none">{t("banned")}</Badge>
                        {u.banned_at ? (
                          <Badge className="text-xs bg-red-100 text-red-700 border-none flex items-center gap-1"><XCircle className="h-3 w-3" />Banni</Badge>`,
`                        {u.banned_at ? (
                          <Badge className="text-xs bg-red-100 text-red-700 border-none flex items-center gap-1"><XCircle className="h-3 w-3" />Banni</Badge>`
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/admin/users.tsx', content, 'utf8');
console.log('Done');

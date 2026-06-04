const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/login.tsx', 'utf8');
content = content.replace(
  'Acces administrateur\n                  </button>',
  'Acces administrateur\n                  </button>\n                </div>\n                <div>\n                  <Link href="/forgot-password" className="text-muted-foreground text-xs hover:underline">Mot de passe oublie ?</Link>'
);
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/login.tsx', content, 'utf8');
console.log('Done');

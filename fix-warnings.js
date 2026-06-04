const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/warnings.ts', 'utf8');
content = content.replace(
  "import { containsProfanity } from",
  "import { containsProfanity, hasProfanity } from"
);
fs.writeFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/warnings.ts', content, 'utf8');
console.log('Done');

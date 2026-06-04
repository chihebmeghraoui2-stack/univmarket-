const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/chat.ts', 'utf8');
content = content.replace(
  'import { containsProfanity } from "../services/profanity";',
  'import { containsProfanity } from "../services/profanity";'
);
// Remplacer l ancien check simple par le nouveau
content = content.replace(
  'if (containsProfanity(body)) {',
  'const profCheck = containsProfanity(body);\n    if (profCheck.found && profCheck.confidence >= 0.80) {'
);
content = content.replace(
  'body: JSON.stringify({ userId, reason: "Langage inapproprie dans le chat" })',
  `body: JSON.stringify({ userId, reason: \`Langage inapproprie detecte: "\${profCheck.word}" (confiance: \${Math.round((profCheck.confidence||0)*100)}%)\` })`
);
fs.writeFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/chat.ts', content, 'utf8');
console.log('Done');

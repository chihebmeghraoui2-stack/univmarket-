const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/index.ts', 'utf8');

if (!content.includes('searchSellersRouter')) {
  content = content.replace(
    "import twoFactorRouter",
    "import searchSellersRouter from './search-sellers';\nimport warningsRouter from './warnings';\nimport twoFactorRouter"
  );
  content = content.replace(
    "router.use(twoFactorRouter);",
    "router.use(searchSellersRouter);\nrouter.use(warningsRouter);\nrouter.use(twoFactorRouter);"
  );
}

fs.writeFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/index.ts', content, 'utf8');
console.log('Done');

const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

if (!content.includes('SearchSellersPage')) {
  content = content.replace(
    "import NotFound from \"@/pages/not-found\";",
    `import SearchSellersPage from "@/pages/search-sellers";
import AdminBroadcast from "@/pages/admin/broadcast";
import NotFound from "@/pages/not-found";`
  );
  content = content.replace(
    '<Route path="/settings/2fa" component={TwoFactorPage} />',
    `<Route path="/settings/2fa" component={TwoFactorPage} />
      <Route path="/search-sellers" component={SearchSellersPage} />
      <Route path="/admin/broadcast" component={AdminBroadcast} />`
  );
}

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

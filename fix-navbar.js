const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/components/layout/navbar.tsx', 'utf8');

content = content.replace(
  '<Link href="/leaderboard">',
  `<Link href="/search-sellers">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Vendeurs</Button>
        </Link>
        <Link href="/leaderboard">`
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/components/layout/navbar.tsx', content, 'utf8');
console.log('Done navbar');

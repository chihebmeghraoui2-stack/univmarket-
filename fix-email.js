const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

content = content.replace(
  `<a href="mailto:chihebmeghraoui@gmail.com"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors">`,
  `<a href="mailto:chihebmeghraoui@gmail.com"
              target="_blank"
              onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText('chihebmeghraoui@gmail.com'); const el = e.currentTarget; el.textContent = 'Email copie !'; setTimeout(() => { el.innerHTML = el.innerHTML; location.reload(); }, 1500); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors cursor-pointer">`
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

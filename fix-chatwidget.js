const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/components/ChatWidget.tsx', 'utf8');

// Ajouter les props
content = content.replace(
  'export default function ChatWidget() {',
  `interface ChatWidgetProps {
  title?: string;
  subtitle?: string;
}

export default function ChatWidget({ title = "Assistant UnivMarket", subtitle = "" }: ChatWidgetProps) {`
);

// Utiliser les props dans le header
content = content.replace(
  '<CardTitle>Assistant UnivMarket</CardTitle>',
  '<div><p className="font-bold text-sm">{title}</p>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>'
);

content = content.replace(
  '<CardTitle>Chat ARIA — Assistant Admin</CardTitle>',
  '<div><p className="font-bold text-sm">{title}</p>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>'
);

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/components/ChatWidget.tsx', content, 'utf8');
console.log('Done ChatWidget.tsx');

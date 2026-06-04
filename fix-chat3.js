const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

// Supprimer AdminChatOnly et <AdminChatOnly /> deja ajoutes
content = content.replace(/\nfunction AdminChatOnly\(\)[\s\S]*?\}\n/m, '');
content = content.replace('<AdminChatOnly />', '');
content = content.replace('<ChatWidget />', '');

// Ajouter le bon composant conditionnel
const smartChat = `
function SmartChat() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");

  if (!user) return null;

  if (user.role === "admin" && isAdminPage) {
    return <ChatWidget title="Chat ARIA" subtitle="Assistant Administrateur" />;
  }

  if (user.role === "seller" || user.role === "client") {
    return <ChatWidget title="صديقك الذكي" subtitle="مساعدك الجامعي" />;
  }

  return null;
}
`;

content = content.replace('function Layout()', smartChat + '\nfunction Layout()');
content = content.replace('<CookieConsent />', '<CookieConsent />\n      <SmartChat />');

fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done App.tsx');

const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', 'utf8');

const newFooter = `
function Footer() {
  const [lang, setLang] = React.useState('fr');
  
  const texts = {
    fr: {
      tagline: "Le marche universitaire algerien n1",
      rights: "Tous droits reserves",
      developed: "Developpe par",
      contact: "Contact",
      follow: "Suivez-nous"
    },
    ar: {
      tagline: "السوق الجامعي الجزائري الاول",
      rights: "جميع الحقوق محفوظة",
      developed: "طور من قبل",
      contact: "تواصل معنا",
      follow: "تابعونا"
    },
    en: {
      tagline: "Algeria's #1 University Marketplace",
      rights: "All rights reserved",
      developed: "Developed by",
      contact: "Contact",
      follow: "Follow us"
    }
  };
  
  const t = texts[lang];
  
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Logo + tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">UM</div>
              <div>
                <p className="font-bold text-lg text-white">UnivMarket</p>
                <p className="text-xs text-slate-400">{t.tagline}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['fr','ar','en'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition-all " + (lang === l ? "bg-primary text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>
                  {l === 'fr' ? 'FR' : l === 'ar' ? 'AR' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.contact}</p>
            <div className="space-y-2">
              <a href="https://wa.me/213656247391" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-green-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                </div>
                +213 656 247 391
              </a>
              <a href="https://mail.google.com/mail/?view=cm&to=chihebmeghraoui@gmail.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-slate-300 hover:text-blue-400 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                </div>
                chihebmeghraoui@gmail.com
              </a>
            </div>
          </div>

          {/* Reseaux */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.follow}</p>
            <a href="https://instagram.com/chiheb_meg" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-slate-300 hover:text-pink-400 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 group-hover:bg-pink-500/30 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0H8zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                </svg>
              </div>
              @chiheb_meg
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            2025 UnivMarket &mdash; {t.rights}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {t.developed} <span className="text-primary font-bold">Meghraoui Chiheb</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
`;

// Supprimer l ancien footer
content = content.replace(/function Footer\(\)[\s\S]*?\n\}/m, '');

// Ajouter React import si pas present
if (!content.includes('import React')) {
  content = content.replace("import { useState }", "import React, { useState }");
  if (!content.includes('import React')) {
    content = "import React from 'react';\n" + content;
  }
}

content = content.replace('function Layout()', newFooter + '\nfunction Layout()');
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/App.tsx', content, 'utf8');
console.log('Done');

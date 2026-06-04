const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/login.tsx', 'utf8');
content = content.replace('      </Dialog>\n  );', '      </Dialog>\n  </>);');
content = content.replace('      </Dialog>\r\n  );', '      </Dialog>\r\n  </>);');
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/login.tsx', content, 'utf8');
console.log('Done');

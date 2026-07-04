const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/davidgaston/Documents/2n-presenter/*.html');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/theme\.css\?v=[0-9.]+/g, 'theme.css?v=2.0');
  content = content.replace(/nav-controller\.js\?v=[0-9.]+/g, 'nav-controller.js?v=2.0');
  // Also standard without v=
  content = content.replace(/theme\.css"/g, 'theme.css?v=2.0"');
  content = content.replace(/nav-controller\.js"/g, 'nav-controller.js?v=2.0"');
  fs.writeFileSync(file, content);
}
console.log('Update complete.');

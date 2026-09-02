const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

// Copy login.html to login/index.html
const loginHtml = path.join(outDir, 'login.html');
const loginIndexHtml = path.join(outDir, 'login', 'index.html');
if (fs.existsSync(loginHtml)) {
  if (!fs.existsSync(path.join(outDir, 'login'))) {
    fs.mkdirSync(path.join(outDir, 'login'), { recursive: true });
  }
  fs.copyFileSync(loginHtml, loginIndexHtml);
  console.log('Copied login.html to login/index.html');
}

// Copy pos.html to pos/index.html
const posHtml = path.join(outDir, 'pos.html');
const posIndexHtml = path.join(outDir, 'pos', 'index.html');
if (fs.existsSync(posHtml)) {
  if (!fs.existsSync(path.join(outDir, 'pos'))) {
    fs.mkdirSync(path.join(outDir, 'pos'), { recursive: true });
  }
  fs.copyFileSync(posHtml, posIndexHtml);
  console.log('Copied pos.html to pos/index.html');
}

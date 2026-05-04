const zh = require('./i18n/locales/zh-CN.json');
const en = require('./i18n/locales/en.json');
const fs = require('fs');
const path = require('path');

function resolve(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => o && o[k], obj);
}

function extractKeys(dir) {
  const keys = new Set();
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f);
      const st = fs.statSync(fp);
      if (st.isDirectory() && !f.startsWith('.') && f !== 'node_modules') walk(fp);
      else if (f.endsWith('.vue') || f.endsWith('.ts')) {
        const content = fs.readFileSync(fp, 'utf8');
        const re = /(?:t|\$t)\(['"]([^'"]+)['"][,\)]/g;
        let m;
        while ((m = re.exec(content)) !== null) {
          keys.add(m[1]);
        }
      }
    }
  }
  walk(dir);
  return keys;
}

const usedKeys = extractKeys('./src');
const missingZh = [...usedKeys].filter(k => !resolve(zh, k)).sort();
const missingEn = [...usedKeys].filter(k => !resolve(en, k)).sort();

if (missingZh.length > 0) {
  console.log('=== Missing in zh-CN.json (' + missingZh.length + ') ===');
  missingZh.forEach(k => console.log('  ' + k));
}
if (missingEn.length > 0) {
  console.log('=== Missing in en.json (' + missingEn.length + ') ===');
  missingEn.forEach(k => console.log('  ' + k));
}
if (missingZh.length === 0 && missingEn.length === 0) {
  console.log('All used keys found in both locales');
}

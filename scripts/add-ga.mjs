import fs from 'node:fs';
import path from 'node:path';
const root = 'public';
const GA_ID = 'G-18LKB0EZG6';
const snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;
let added = 0, already = 0, missingHead = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html') && !entry.name.startsWith('google')) {
      let html = fs.readFileSync(p, 'utf8');
      if (html.includes('googletagmanager.com/gtag/js?id=' + GA_ID)) { already++; continue; }
      if (!html.includes('</head>')) { missingHead.push(p); continue; }
      html = html.replace('</head>', snippet + '\n</head>');
      fs.writeFileSync(p, html);
      added++;
    }
  }
}
walk(root);
if (missingHead.length) console.warn('Skipped pages without </head>: ' + missingHead.join(', '));
console.log(`Google Analytics tag added to ${added} pages; ${already} already tagged.`);
if (added === 0 && already === 0) throw Error('No HTML pages found under ' + root);

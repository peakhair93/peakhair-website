import fs from 'node:fs';
const root='https://www.peakhairtransplant.com';
const files=['public/es.html',...fs.readdirSync('public/es').filter(f=>f.endsWith('.html')).map(f=>'public/es/'+f)];
const failures=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8');
 const canonical=source.match(/rel="canonical" href="([^"]+)"/)?.[1];
 if(!canonical)throw Error('Missing canonical '+file);
 const response=await fetch(canonical+'?verify=spanish-live');
 const html=await response.text();
 if(!response.ok||!html.includes('lang="es"')||!html.includes('https://formspree.io/f/xanplawv')||!html.includes('/assets/peak-language.js'))failures.push(canonical);
 const english=source.match(/hreflang="en" href="([^"]+)"/)?.[1];
 const enResponse=await fetch(english+'?verify=language-pair');
 const en=await enResponse.text();
 if(!enResponse.ok||!en.includes('hreflang="es" href="'+canonical+'"'))failures.push('Missing reciprocal English link '+english);
 for(const [,url] of source.matchAll(/href="(\/[^"#?]*)/g)){
   if(url==='/'||url.startsWith('/assets/')||url==='/blog')continue;
   const target='public'+url+'.html';
   if(!fs.existsSync(target)&&!fs.existsSync('public'+url+'/index.html'))failures.push('Missing internal target '+url);
 }
 console.log('Checked '+canonical+' and English counterpart');
}
if(failures.length)throw Error([...new Set(failures)].join('\n'));
console.log('PASS: '+files.length+' Spanish pages, matching English alternatives, internal page links and form configuration. No inquiry forms submitted.');

import fs from 'node:fs/promises';
const report=JSON.parse(await fs.readFile('translations/spanish-full-report.json','utf8'));
const errors=[];
for(let start=0;start<report.length;start+=6){await Promise.all(report.slice(start,start+6).map(async row=>{
 const url='https://www.peakhairtransplant.com'+row.spanish;
 const response=await fetch(url+'?review=full-spanish');const html=await response.text();
 if(!response.ok||!/<html[^>]*lang="es"/.test(html)||!html.includes('peak-language.js')||!html.includes('Traducción automática al español'))errors.push(url);
 const canonical=html.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i)?.[1]||html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
 if(canonical!==url)errors.push('Wrong canonical '+url);
 console.log(response.status+' '+url);
}));}
console.log('Checked '+report.length+' live Spanish pages without submitting any forms.');
if(errors.length)throw new Error(errors.join('\n'));

import fs from 'node:fs/promises';
const origin='https://www.peakhairtransplant.com';
const xml=await fs.readFile('public/sitemap.xml','utf8');
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const results=[];
function attrs(tag){return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]]));}
function tags(html){return {title:(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1],description:[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a.name==='description')?.content,canonical:[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a.rel==='canonical')?.href};}
const queue=[...urls];
async function worker(){while(queue.length){const url=queue.shift();try{const response=await fetch(url+'?sitecheck=20261123',{signal:AbortSignal.timeout(25000)});const html=await response.text();const p=new URL(url).pathname;const candidates=p==='/'?['public/index.html']:['public'+p+'.html','public'+p+'/index.html'];let expected;for(const f of candidates){try{expected=await fs.readFile(f,'utf8');break;}catch{}}const problems=[];if(!response.ok)problems.push('status_'+response.status);if(!expected)problems.push('no_local_page');else{const a=tags(html),b=tags(expected);for(const key of Object.keys(b))if(a[key]!==b[key])problems.push('different_'+key);if(p.startsWith('/es/blog/')){const schema=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));if(!schema.some(s=>s['@type']==='BlogPosting'&&s.author&&s.datePublished))problems.push('missing_article_details');}}results.push({url,status:response.status,problems});}catch(e){results.push({url,problems:[e.message]});}}}
await Promise.all([worker(),worker(),worker()]);
results.sort((a,b)=>a.url.localeCompare(b.url));const report={checkedAt:new Date().toISOString(),urlsChecked:results.length,passed:results.filter(r=>!r.problems.length).length,failed:results.filter(r=>r.problems.length),scope:'HTTP status, exact title/description/canonical match, and Spanish article author/publication date; not external links, visual/clinical review or submitted form delivery.'};
await fs.writeFile('scripts/site-live-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));

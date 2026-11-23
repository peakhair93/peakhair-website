import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const origin='https://www.peakhairtransplant.com';
const changes=[];
async function patch(file,oldText,newText){let text=await fs.readFile(file,'utf8');if(text.includes(newText))return;if(!text.includes(oldText))throw new Error('Expected text missing: '+file);assert.equal(text.split(oldText).length,2);await fs.writeFile(file,text.replace(oldText,newText));changes.push(file);}
await patch('public/unshaven-hair-transplant-nyc.html','<title>Unshaven Hair Transplant Manhattan, NYC | No-Shave FUE | Peak</title>','<title>Unshaven Hair Transplant NYC | No-Shave FUE | Peak</title>');
await patch('public/eyebrow-transplant-nyc.html','<meta name="description" content="Eyebrow restoration in Manhattan, New York City for thinning brows and uneven growth. Explore eyebrow transplant procedures, recovery, aftercare and cost guidance.">','<meta name="description" content="Explore eyebrow transplants in Manhattan, NYC: assessment for thinning brows, the procedure, recovery, aftercare and questions about cost.">');
await patch('scripts/ryze-convert.mjs',"['/prp-hair-restoration', 'prp-hair-restoration.html', 'monthly', '0.9'], ['/stem-cell-hair-therapy', 'stem-cell-hair-therapy.html', 'monthly', '0.8'],","['/prp-hair-restoration', 'prp-hair-restoration.html', 'monthly', '0.9'],\n  ['/mega-session-fue-hair-transplant-nyc', 'mega-session-fue-hair-transplant-nyc.html', 'monthly', '0.8'],\n  ['/ice-fue-hair-transplant-nyc', 'ice-fue-hair-transplant-nyc.html', 'monthly', '0.8'],\n  ['/unshaven-hair-transplant-nyc', 'unshaven-hair-transplant-nyc.html', 'monthly', '0.8'],");
execFileSync(process.execPath,['scripts/ryze-convert.mjs'],{stdio:'inherit'});
function nodes(value){if(!value||typeof value!=='object')return [];return [value,...Object.values(value).flatMap(v=>Array.isArray(v)?v.flatMap(nodes):nodes(v))];}
function schemas(html){return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));}
const spanish=[];
for(const file of (await fs.readdir('public/es/blog')).filter(f=>f.endsWith('.html')&&f!=='index.html')){
 const target='public/es/blog/'+file;let html=await fs.readFile(target,'utf8');
 const existing=schemas(html).flatMap(nodes).find(n=>['Article','BlogPosting','NewsArticle'].includes(n['@type']));
 if(existing?.author&&existing?.datePublished)continue;
 let english;try{english=await fs.readFile('public/blog/'+file,'utf8');}catch{continue;}
 const source=schemas(english).flatMap(nodes).find(n=>['Article','BlogPosting'].includes(n['@type']));
 if(!source?.datePublished)continue;
 const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1];const canonical=(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)||[])[1];
 if(!title||!canonical)continue;
 const schema={...source,'@context':'https://schema.org',headline:title,url:canonical,mainEntityOfPage:canonical,inLanguage:'es',author:{'@type':'Organization',name:'Peak Hair Restoration',url:origin+'/'}};
 const tag='<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>';
 if(existing){
   html=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,(full,json)=>{const parsed=JSON.parse(json);let found=false;for(const n of nodes(parsed)){if(['Article','BlogPosting','NewsArticle'].includes(n['@type'])){n.author=n.author||schema.author;n.datePublished=n.datePublished||schema.datePublished;n.inLanguage=n.inLanguage||'es';found=true;}}return found?'<script type="application/ld+json">'+JSON.stringify(parsed).replace(/</g,'\\u003c')+'</script>':full;});
 }else html=html.replace('</head>',tag+'</head>');
 await fs.writeFile(target,html);spanish.push(target);
}
const pages=[];
async function walk(dir){for(const f of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())await walk(p);else if(f.name.endsWith('.html'))pages.push(p);}}
await walk('public');
const findings=[];const titles=new Map();
for(const file of pages){const html=await fs.readFile(file,'utf8');const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||'';const desc=(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i)||[])[1]||'';const can=(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)||[])[1]||'';const h1=[...html.matchAll(/<h1\b/gi)].length;const problems=[];if(!title)problems.push('missing_title');if(title.length>65)problems.push('long_title');if(!desc)problems.push('missing_description');if(desc.length>160)problems.push('long_description');if(!can)problems.push('missing_canonical');if(h1!==1)problems.push('h1_count_'+h1);try{schemas(html);}catch{problems.push('invalid_jsonld');}if(/src=["']http:\/\//i.test(html))problems.push('mixed_content');const missingAlt=[...html.matchAll(/<img\b[^>]*>/gi)].filter(m=>! /\balt\s*=/i.test(m[0])).length;if(missingAlt)problems.push('images_missing_alt_'+missingAlt);if(problems.length)findings.push({file,problems});if(title){const list=titles.get(title)||[];list.push(file);titles.set(title,list);}}
const sitemap=await fs.readFile('public/sitemap.xml','utf8');
for(const slug of ['mega-session-fue-hair-transplant-nyc','ice-fue-hair-transplant-nyc','unshaven-hair-transplant-nyc'])assert(sitemap.includes('<loc>'+origin+'/'+slug+'</loc>'));
assert(!sitemap.includes('<loc>'+origin+'/stem-cell-hair-therapy</loc>'));
const duplicates=[...titles].filter(([,files])=>files.length>1).map(([title,files])=>({title,files}));
const report={checkedAt:new Date().toISOString(),htmlPagesChecked:pages.length,changedFiles:changes,spanishArticleSchemaAdded:spanish.length,spanishPages:spanish,sitemapUrls:[...sitemap.matchAll(/<loc>/g)].length,findings,duplicateTitles:duplicates};
await fs.writeFile('scripts/site-quality-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

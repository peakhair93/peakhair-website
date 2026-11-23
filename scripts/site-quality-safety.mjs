import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
execFileSync('git',['fetch','origin','main','--depth=1'],{stdio:'inherit'});
const changed=execFileSync('git',['diff','--name-only','origin/main','--','public'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const verified=[];
for(const file of changed){
 const before=execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:10000000}),after=await fs.readFile(file,'utf8');
 if(file.startsWith('public/es/blog/')){
  const scripts=/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  assert.equal(after.replace(scripts,''),before.replace(scripts,''),'Non-schema change in '+file);
  const schema=[...after.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
  assert(schema.some(s=>s['@type']==='BlogPosting'&&s.author&&s.datePublished&&s.inLanguage==='es'),file);
 }else if(file==='public/unshaven-hair-transplant-nyc.html')assert.equal(after,before.replace('<title>Unshaven Hair Transplant Manhattan, NYC | No-Shave FUE | Peak</title>','<title>Unshaven Hair Transplant NYC | No-Shave FUE | Peak</title>'));
 else if(file==='public/eyebrow-transplant-nyc.html')assert.equal(after,before.replace('<meta name="description" content="Eyebrow restoration in Manhattan, New York City for thinning brows and uneven growth. Explore eyebrow transplant procedures, recovery, aftercare and cost guidance.">','<meta name="description" content="Explore eyebrow transplants in Manhattan, NYC: assessment for thinning brows, the procedure, recovery, aftercare and questions about cost.">'));
 else if(file==='public/sitemap.xml'){
  const loc=s=>[...s.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[0]);
  const old=loc(before),next=loc(after),removed=old.filter(x=>!next.includes(x)),added=next.filter(x=>!old.includes(x));
  assert(removed.every(x=>x.includes('/stem-cell-hair-therapy</loc>')));assert.equal(added.length,3);
  assert(added.every(x=>/\/(mega-session-fue-hair-transplant-nyc|ice-fue-hair-transplant-nyc|unshaven-hair-transplant-nyc)<\/loc>/.test(x)));
 }else throw new Error('Unexpected modified public file: '+file);
 verified.push(file);
}
assert.equal(verified.filter(f=>f.startsWith('public/es/blog/')).length,32);
await fs.writeFile('scripts/site-quality-safety.json',JSON.stringify({verified:true,changedPublicFiles:verified.length,contentAndImagesPreserved:true,files:verified},null,2)+'\n');
console.log('Verified exact scope and preserved content/images on '+verified.length+' modified public files.');

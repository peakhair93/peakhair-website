import os,re,json,hashlib,sys
from pathlib import Path
from urllib.parse import urlsplit,urljoin
from bs4 import BeautifulSoup,Comment,NavigableString,Doctype
import ctranslate2
from transformers import MarianTokenizer
ROOT=Path('public'); BASE='https://www.peakhairtransplant.com'
MODEL='Helsinki-NLP/opus-mt-en-es'
CACHE=Path('translations/spanish-full-cache.json');CACHE.parent.mkdir(exist_ok=True)
cache=json.loads(CACHE.read_text()) if CACHE.exists() else {}
if cache.get('_translation_version')!='sentence-v2':
 cache={key:value for key,value in cache.items() if not re.search(r'(?<=[.!?])\s+(?=[A-Z])',key)}
cache['_translation_version']='sentence-v2'
# Keep existing Spanish addresses so published links do not break.
slugs={'/':'/es','/fue':'/es/trasplante-capilar-fue','/sapphire-fue-hair-transplant-nyc':'/es/trasplante-capilar-sapphire-fue','/dhi-hair-transplant':'/es/trasplante-capilar-dhi','/ice-fue-hair-transplant-nyc':'/es/trasplante-capilar-ice-fue','/mega-session-fue-hair-transplant-nyc':'/es/mega-sesion-fue','/unshaven-hair-transplant-nyc':'/es/trasplante-capilar-sin-rapar','/afro-hair-transplant-nyc':'/es/trasplante-capilar-cabello-afro','/beard-transplant-nyc':'/es/trasplante-de-barba','/prp-hair-restoration':'/es/prp-capilar','/new-york-hair-transplant':'/es/trasplante-capilar-manhattan','/hair-transplant-cost-nyc':'/es/costo-trasplante-capilar','/privacy-policy':'/es/politica-de-privacidad','/patient-policies':'/es/politicas-para-pacientes','/pre-op-checklist':'/es/guia-preoperatoria','/post-op-guide':'/es/guia-posoperatoria','/istanbul-hair-transplant':'/es/trasplante-capilar-estambul','/404':'/es/404','/blog':'/es/blog'}
def route(f):
 r='/'+str(f.relative_to(ROOT)).removesuffix('.html')
 return '/' if r=='/index' else r.removesuffix('/index')
files=[f for f in sorted(ROOT.glob('*.html')) if f.name!='es.html' and not f.name.startswith('google')]+sorted((ROOT/'blog').rglob('*.html'))
for f in files:slugs.setdefault(route(f),'/es'+route(f))
reverse={v:k for k,v in slugs.items()}
manual={'Home':'Inicio','Menu':'Menú','Close':'Cerrar','English':'English','Español':'Español','Free consultation':'Consulta gratuita','Free Consultation':'Consulta gratuita','Request a free consultation':'Solicitar consulta gratuita','Before':'Antes','After':'Después','All':'Todos','Results':'Resultados','Blog':'Blog','Treatments':'Tratamientos','New York':'Nueva York','Privacy Policy':'Política de privacidad','Patient Policies':'Políticas para pacientes','Full name':'Nombre completo','Email address':'Correo electrónico','Phone number':'Teléfono','Peak Hair Restoration':'Peak Hair Restoration','Peak Hair Restoration Clinic':'Peak Hair Restoration Clinic','Sapphire FUE':'Sapphire FUE','DHI':'DHI','FUE':'FUE','PRP':'PRP','ICE FUE':'ICE FUE','Cherry':'Cherry','Istanbul':'Estambul','Miami':'Miami','Open navigation menu':'Abrir menú de navegación','Close navigation menu':'Cerrar menú de navegación'}
cache.update(manual)
def eligible(t):
 return bool(re.search('[A-Za-z]',t)) and not re.fullmatch(r'[\d\s\W]+',t) and not re.search(r'^(https?://|mailto:|tel:|[\w.+-]+@[\w.-]+\.[a-z]+$)',t) and not re.search(r'^240 W 37th|^New York, NY 10018|^\(917\)',t)
def nodes(soup):
 for n in soup.find_all(string=True):
  if isinstance(n,(Comment,Doctype)) or n.parent.name in ['script','style','noscript','code','pre','svg','path']:continue
  if n.find_parent(['script','style','svg','code','pre']):continue
  t=str(n).strip()
  if t and eligible(t):yield n,t
ATTR=['alt','title','placeholder','aria-label']
soups=[];texts=set()
for f in files:
 s=BeautifulSoup(f.read_text(),'html.parser')
 # Expand the existing shared gallery into source DOM so every caption is translated statically.
 gallery=s.find(id='peak-treatment-results')
 if gallery:
  js=(ROOT/'assets/peak-treatment-results.js').read_text()
  m=re.search(r'inner.innerHTML = `([\s\S]*?)`;',js)
  if not m:raise RuntimeError('Shared gallery template not found')
  fragment=BeautifulSoup(m.group(1),'html.parser')
  note=fragment.select_one('.peak-results-note')
  if note:note.string=gallery.get('data-context','Sapphire FUE examples from Peak’s existing gallery. Individual results vary.')
  gallery.clear();gallery.append(fragment);gallery['class']='peak-results'
  for script in s.find_all('script',src='/assets/peak-treatment-results.js'):script.decompose()
 for n,t in nodes(s):texts.add(t)
 for tag in s.find_all(True):
  for attr in ATTR:
   t=tag.get(attr)
   if isinstance(t,str) and eligible(t):texts.add(t.strip())
 for meta in s.find_all('meta'):
  if meta.get('name') in ['description','twitter:title','twitter:description'] or meta.get('property') in ['og:title','og:description']:
   if meta.get('content'):texts.add(meta['content'].strip())
 soups.append((f,s))
missing=sorted(texts-set(cache))
print(f'Full coverage: {len(files)} pages, {len(texts)} unique text segments; {len(missing)} awaiting translation',flush=True)
if missing:
 tok=MarianTokenizer.from_pretrained(MODEL)
 translator=ctranslate2.Translator('.translation-model',device='cpu',compute_type='int8',inter_threads=1,intra_threads=2)
 jobs=[];pieces={}
 for text in missing:
  # Split long content at sentence boundaries rather than truncating it.
  spans=re.split(r'(?<=[.!?])\s+(?=[A-Z“\"(])',text)
  chunks=[]
  for span in spans:
   if len(tok.encode(span))>300:
    words=span.split();chunks.extend(' '.join(words[i:i+70]) for i in range(0,len(words),70))
   else:chunks.append(span)
  pieces[text]=chunks
  for index,chunk in enumerate(chunks):jobs.append((text,index,chunk))
 outputs={}
 for start in range(0,len(jobs),16):
  batch=jobs[start:start+16]
  inputs=[tok.convert_ids_to_tokens(tok.encode(item[2])) for item in batch]
  results=translator.translate_batch(inputs,beam_size=2,max_decoding_length=512,repetition_penalty=1.05)
  for (text,index,original),result in zip(batch,results):
   value=tok.decode(tok.convert_tokens_to_ids(result.hypotheses[0]),skip_special_tokens=True)
   if not value.strip():raise RuntimeError('Empty translation')
   outputs[(text,index)]=value
  if start%160==0:print(f'Translated {start+len(batch)}/{len(jobs)} segments',flush=True)
 for text,chunks in pieces.items():cache[text]=' '.join(outputs[(text,i)] for i in range(len(chunks)))
 CACHE.write_text(json.dumps(cache,ensure_ascii=False,indent=2))
def tr(t):
 value=cache.get(t,t)
 # Brand identity is never translated.
 value=re.sub(r'Peak (?:Restauración (?:del )?(?:Cabello|Capilar)|Restauración de Cabello)','Peak Hair Restoration',value,flags=re.I)
 return value

def link(href,enroute):
 if not href:return href
 u=urlsplit(href)
 if u.scheme and (u.scheme not in ['http','https'] or u.netloc not in ['www.peakhairtransplant.com','peakhairtransplant.com']):return href
 if not u.path:return href
 if not u.path.startswith('/'):
  u=urlsplit(urljoin(BASE+enroute,href))
 p=u.path.removesuffix('.html').rstrip('/') or '/'
 if p.endswith('/index'):p=p[:-6] or '/'
 if p in slugs:return slugs[p]+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
 return href

notice='Traducción automática al español del contenido completo en inglés. Si alguna indicación médica o política no está clara, confirme su significado con la práctica tratante antes de actuar. Esta traducción no garantiza disponibilidad de atención clínica en español.'
report=[]
for f,s in soups:
 en=route(f);es=slugs[en]
 for n,t in list(nodes(s)):
  raw=str(n);n.replace_with(NavigableString(raw[:len(raw)-len(raw.lstrip())]+tr(t)+raw[len(raw.rstrip()):]))
 for tag in s.find_all(True):
  for attr in ATTR:
   t=tag.get(attr)
   if isinstance(t,str) and eligible(t):tag[attr]=tr(t.strip())
 for meta in s.find_all('meta'):
  if meta.get('name') in ['description','twitter:title','twitter:description'] or meta.get('property') in ['og:title','og:description']:
   if meta.get('content'):meta['content']=tr(meta['content'].strip())
 if s.html:s.html['lang']='es'
 for a in s.find_all('a',href=True):a['href']=link(a['href'],en)
 for tag in s.select('link[rel="canonical"],link[hreflang]'):tag.decompose()
 for name,href in [('canonical',BASE+es)]:
  tag=s.new_tag('link',rel=name,href=href);s.head.append(tag)
 for language,url in [('en',BASE+en),('es',BASE+es),('x-default',BASE+en)]:
  s.head.append(s.new_tag('link',rel='alternate',hreflang=language,href=url))
 for meta in s.find_all('meta',property='og:url'):meta['content']=BASE+es
 for meta in s.find_all('meta',property='og:locale'):meta['content']='es_US'
 # Never initialize the English-only generated mobile menu on a Spanish page.
 for tag in s.find_all('script'):
  src=tag.get('src','')
  if src in ['/assets/peak-mobile-nav.js','/assets/peak-language.js','/assets/peak-spanish-form.js']:tag.decompose();continue
  if tag.get('type')=='application/ld+json':
   # Avoid English article bodies and incorrect canonical URLs in localized structured data.
   tag.decompose()
 style=s.new_tag('style');style.string='.es-full-notice{padding:12px 24px;background:#e7ebdf;color:#233a2b;font:13px/1.6 Inter,Arial,sans-serif}.es-full-notice a{color:inherit;text-underline-offset:3px}.es-full-nav{display:flex!important;flex-wrap:wrap;gap:10px 18px;padding:16px 24px;background:#f4f0e5;border-bottom:1px solid #233a2b30;font:500 13px/1.6 Inter,Arial,sans-serif}.es-full-nav a{color:#233a2b}.es-full-notice p{margin:0;max-width:1120px}.es-full-notice p+p{margin-top:6px}header .links{flex-wrap:wrap}@media(max-width:800px){header .nav{flex-wrap:wrap;height:auto;min-height:76px;padding-block:12px}header .links{display:flex!important;gap:10px 16px;height:auto;font-size:13px}h1,h2{overflow-wrap:break-word}.hero-grid>*,.split>*{min-width:0}.es-full-nav a{padding:7px 0}}';s.head.append(style)
 language=s.new_tag('script',src='/assets/peak-language.js',defer=True);s.head.append(language)
 runtime=s.new_tag('script',src='/assets/peak-full-spanish-runtime.js',defer=True);s.head.append(runtime)
 note=s.new_tag('div',attrs={'class':'es-full-notice'});p=s.new_tag('p');p.string=notice;note.append(p)
 p=s.new_tag('p');a=s.new_tag('a',href=BASE+en,lang='en');a.string='Consultar el original en inglés';p.append(a);note.append(p)
 s.body.insert(0,note)
 nav=s.new_tag('nav',attrs={'class':'es-full-nav','aria-label':'Navegación del sitio en español'})
 for title,href in [('Inicio','/es'),('Tratamientos','/es/trasplante-capilar-fue'),('Manhattan','/es/trasplante-capilar-manhattan'),('Estambul','/es/trasplante-capilar-estambul'),('Blog','/es/blog'),('Guía preoperatoria','/es/guia-preoperatoria'),('Guía posoperatoria','/es/guia-posoperatoria'),('Consulta','/es#contact')]:
  a=s.new_tag('a',href=href);a.string=title;nav.append(a)
 s.body.insert(1,nav)
 for form in s.find_all('form'):
  hidden=s.new_tag('input',type='hidden',attrs={'name':'language','value':'Spanish'});form.append(hidden)
 output=ROOT/('es.html' if es=='/es' else es.lstrip('/')+'.html');output.parent.mkdir(parents=True,exist_ok=True)
 html=str(s)
 if len(list(s.find_all(['p','h1','h2','h3','li'])))<3 and en!='/404':raise RuntimeError('Missing page content '+en)
 output.write_text(html)
 # Reciprocal language alternatives only; do not alter English content.
 original=f.read_text();original=re.sub(r'<!-- peak-language-alternates -->[\s\S]*?<!-- /peak-language-alternates -->','',original)
 original=re.sub(r'<link\b[^>]*hreflang=[\"\'][^>]*>','',original)
 alternatives=''.join(f'<link rel="alternate" hreflang="{l}" href="{u}">' for l,u in [('en',BASE+en),('es',BASE+es),('x-default',BASE+en)])
 original=original.replace('</head>',alternatives+'</head>')
 if 'src="/assets/peak-language.js"' not in original:original=original.replace('</head>','<script src="/assets/peak-language.js" defer></script></head>')
 f.write_text(original)
 report.append({'english':en,'spanish':es,'file':str(output),'text_segments':len(list(nodes(BeautifulSoup(f.read_text(),'html.parser'))))})
 print('Created full Spanish '+es,flush=True)
# Language toggle preserves page and anchor; choose Spanish by explicit click, never forced redirect.
js='''(()=>{if(document.getElementById('peak-language-bar'))return;const map=MAP,reverse=Object.fromEntries(Object.entries(map).map(([a,b])=>[b,a]));const current=location.pathname.replace(/\\.html$/,'').replace(/\\/$/,'')||'/';const spanish=current==='/es'||current.startsWith('/es/');const en=spanish?(reverse[current]||'/'):current;const es=spanish?current:(map[current]||'/es');const bar=document.createElement('nav');bar.id='peak-language-bar';bar.setAttribute('aria-label',spanish?'Idioma del sitio':'Website language');bar.style.cssText='display:flex;justify-content:flex-end;gap:14px;padding:7px 24px;background:#233a2b;color:#fcfaf4;font:500 13px/1.5 Inter,Arial,sans-serif;min-height:36px';for(const [label,url,lang,active] of [['English',en,'en',!spanish],['Español',es,'es',spanish]]){const a=document.createElement('a');a.textContent=label;a.href=url+location.hash;a.lang=lang;a.hreflang=lang;a.style.cssText='color:#fcfaf4;text-decoration:'+(active?'underline':'none')+';text-underline-offset:4px;padding:2px 4px';if(active)a.setAttribute('aria-current','page');bar.append(a)}document.body.prepend(bar)})();'''.replace('MAP',json.dumps(slugs,ensure_ascii=False))
(ROOT/'assets/peak-language.js').write_text(js)
# Preserve translated galleries' styling without invoking the English gallery builder.
gallery_js=(ROOT/'assets/peak-treatment-results.js').read_text();css=re.search(r'style.textContent = `([\s\S]*?)`;',gallery_js)
runtime="(()=>{if(!document.documentElement.lang.startsWith('es'))return;const css=document.createElement('style');css.textContent="+json.dumps(css.group(1) if css else '')+";document.head.append(css);const dictionary="+json.dumps(cache,ensure_ascii=False)+";const translate=root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){if(n.parentElement?.closest('script,style,code,pre'))continue;const t=n.nodeValue.trim();if(dictionary[t]&&dictionary[t]!==t)n.nodeValue=n.nodeValue.replace(t,dictionary[t])}for(const el of root.querySelectorAll?.('[aria-label],[title],[placeholder]')||[]){for(const key of ['aria-label','title','placeholder']){const t=el.getAttribute(key);if(dictionary[t])el.setAttribute(key,dictionary[t])}}};translate(document.body);new MutationObserver(entries=>{for(const entry of entries){if(entry.type==='characterData'){const node=entry.target;const t=node.nodeValue.trim();if(dictionary[t]&&dictionary[t]!==t)node.nodeValue=node.nodeValue.replace(t,dictionary[t])}else for(const node of entry.addedNodes){if(node.nodeType===1)translate(node);else if(node.nodeType===3){const t=node.nodeValue.trim();if(dictionary[t]&&dictionary[t]!==t)node.nodeValue=node.nodeValue.replace(t,dictionary[t])}}}}).observe(document.body,{subtree:true,childList:true,characterData:true});})();"
(ROOT/'assets/peak-full-spanish-runtime.js').write_text(runtime)
sitemap=(ROOT/'sitemap.xml').read_text()
for es in slugs.values():
 if es=='/es/404':continue
 loc=BASE+es
 if '<loc>'+loc+'</loc>' not in sitemap:sitemap=sitemap.replace('</urlset>','<url><loc>'+loc+'</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>')
(ROOT/'sitemap.xml').write_text(sitemap)
Path('translations/spanish-full-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('COMPLETE: '+str(len(report))+' full Spanish pages; English source content retained.',flush=True)

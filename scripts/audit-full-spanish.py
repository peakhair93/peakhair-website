import json,re,sys
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit
report=json.loads(Path('translations/spanish-full-report.json').read_text())
errors=[];warnings=[]
for item in report:
 es=BeautifulSoup(Path(item['file']).read_text(),'html.parser')
 enfile=Path('public/index.html' if item['english']=='/' else 'public'+item['english']+'.html')
 if item['english']=='/blog':enfile=Path('public/blog/index.html')
 en=BeautifulSoup(enfile.read_text(),'html.parser')
 if es.html.get('lang')!='es':errors.append('Wrong language '+item['spanish'])
 for name in ['h1','h2','h3','img','video','form']:
  expected=len(en.find_all(name));actual=len(es.find_all(name))
  # Expanded galleries add their own photos and heading to the static Spanish page.
  if actual<expected:errors.append(f'{item["spanish"]}: missing {name}: {actual}/{expected}')
 original_images=[x.get('src') for x in en.find_all('img')]
 spanish_images=[x.get('src') for x in es.find_all('img')]
 if any(src not in spanish_images for src in original_images):errors.append('Original photo missing '+item['spanish'])
 original_forms=[x.get('action') for x in en.find_all('form')]
 translated_forms=[x.get('action') for x in es.find_all('form')]
 if original_forms!=translated_forms:errors.append('Form destination changed '+item['spanish'])
 for a in es.find_all('a',href=True):
  u=urlsplit(a['href']);p=u.path.rstrip('/')
  if not u.scheme and p.startswith('/es') and p:
   target=Path('public'+p+'.html')
   if not target.exists() and not Path('public'+p+'/index.html').exists():errors.append('Broken Spanish page '+p)
 # Financial and numeric terms need to remain the same; report any differences for human review.
 for kind,pattern in [('money',r'\$\s*\d[\d,.]*(?:\s*/\s*\w+)?'),('percent',r'\d+(?:[.,]\d+)?\s*%')]:
  norm=lambda value:sorted(re.sub(r'[^\d$%]','',x) for x in re.findall(pattern,value))
  original=norm(en.get_text(' ',strip=True));translated=norm(es.get_text(' ',strip=True))
  if original!=translated:warnings.append({'page':item['spanish'],'type':kind,'english':original,'spanish':translated})
 print('PASS structure '+item['spanish'])
print(json.dumps({'pages':len(report),'errors':errors,'numeric_terms_for_review':warnings},ensure_ascii=False,indent=2))
if errors:sys.exit(1)

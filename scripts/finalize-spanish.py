import json,re
from pathlib import Path
runtime=Path('public/assets/peak-full-spanish-runtime.js')
manual={
'Sending…':'Enviando…','Sending...':'Enviando…','🔇 Sound off':'🔇 Sonido desactivado','🔊 Sound on':'🔊 Sonido activado',
'Your request was sent. Peak’s coordination team will contact you to arrange a consultation.':'Su solicitud fue enviada. El equipo de coordinación de Peak se pondrá en contacto con usted para organizar una consulta.',
'Something went wrong. Please try WhatsApp or email us directly.':'No pudimos confirmar el envío. Intente por WhatsApp o escríbanos directamente por correo electrónico.',
'Your consultation request has been sent.':'Su solicitud de consulta ha sido enviada.',
'Please complete all required fields.':'Complete todos los campos obligatorios.',
'Please try again or contact us directly.':'Intente de nuevo o contáctenos directamente.',
'Peak Hair Restoration':'Peak Hair Restoration','Peak Hair Restoration Clinic':'Peak Hair Restoration Clinic',
'Open navigation menu':'Abrir menú de navegación','Close navigation menu':'Cerrar menú de navegación',
'Menu':'Menú','Close':'Cerrar','Before':'Antes','After':'Después','Previous results':'Resultados anteriores','Next results':'Más resultados',
'Previous clinic photo':'Foto anterior de la clínica','Next clinic photo':'Siguiente foto de la clínica'
}
js=runtime.read_text()
needle=';const translate=root=>'
if needle not in js:raise RuntimeError('Runtime injection point missing')
js=js.replace(needle,';Object.assign(dictionary,'+json.dumps(manual,ensure_ascii=False)+');const translate=root=>',1)
# Dynamic numeric gallery counters are not fixed text strings.
js=js.replace("const t=node.nodeValue.trim();if(dictionary[t]", "const t=node.nodeValue.trim();if(/^\\d+ of \\d+ photos$/.test(t)){node.nodeValue=t.replace(' of ',' de ').replace(' photos',' fotos');continue;}if(dictionary[t]",1)
# Static paragraphs are already translated; only short dynamic labels belong in browser code.
start=js.index('const dictionary=')+len('const dictionary=')
data,end=json.JSONDecoder().raw_decode(js[start:])
small={key:value for key,value in data.items() if len(key)<110}
js=js[:start]+json.dumps(small,ensure_ascii=False)+js[start+end:]
runtime.write_text(js)
corrections={
 'Trasplante de cabello post-Op Guía':'Guía posoperatoria del trasplante capilar',
 'Trasplante de cabello Pre-Op Checklist':'Guía preoperatoria del trasplante capilar',
 'Peak Hair Restoration home':'Inicio de Peak Hair Restoration',
 'Contacto máximo para la programación':'Contactar con Peak para coordinar citas',
 'El pico coordina la programación':'Peak coordina la programación',
 'hasta que la limpien':'hasta recibir autorización del profesional tratante',
 'área del destinatario':'zona receptora',
 'El vaciado del cabello trasplantado':'La caída del cabello trasplantado',
 '¿El trasplante fracasó?':'¿La caída del cabello significa que el trasplante fracasó?',
 'Trasplante de pelo antes de volver a crecer.':'Caída temporal del cabello trasplantado antes de que vuelva a crecer.',
 'obtenga el aclaramiento antes de reanudar actividades':'obtenga autorización médica antes de reanudar actividades',
 'No pique en las costras ni fregue la nueva línea de cabello.':'No retire las costras ni frote la nueva línea del cabello.',
 'Siga las instrucciones escritas de su médico en esta página.':'Las instrucciones escritas de su profesional tratante tienen prioridad sobre esta página.',
 'El médico que trata responde a preguntas médicas':'El profesional tratante responde a las preguntas médicas',
 'Mantenga cerca las instrucciones escritas de su médico que trata':'Tenga a mano las instrucciones escritas de su profesional tratante',
 'No deje de recetarse el tratamiento por su cuenta.':'No suspenda por su cuenta un tratamiento recetado.',
 'qué medicamentos y suplementos deben continuar, cambiar o mantener':'qué medicamentos y suplementos deben continuar, modificarse o suspenderse',
 'instrucciones personales de descarga':'instrucciones personales para el alta',
 'un certificado médico o instrucciones clínicas específicas de Peak':'una autorización médica ni instrucciones clínicas específicas de Peak',
 'no reemplaza el certificado médico':'no reemplaza la autorización médica',
 'Peak\'s':'Peak',
 'Hasta 50.000 aprobaciones':'Aprobaciones de financiación de hasta $50,000',
 '395 dólares por período de sesiones':'$395 por sesión',
 'Un nombramiento para la extracción y la inyección':'Una cita para la extracción y la inyección',
 'período de sesiones':'sesión',
 'períodos de sesiones':'sesiones',
 'Cuestiones comunes':'Preguntas frecuentes',
 'Preguntas sobre el calendario':'Preguntas sobre la coordinación de citas'
}
# Add a lightweight Spanish-only readability fix without changing any source layout.
for f in [Path('public/es.html'),*Path('public/es').rglob('*.html')]:
 html=f.read_text()
 for old,new in corrections.items():html=html.replace(old,new)
 html=html.replace('Restauración del Cabello Pico','Peak Hair Restoration').replace('Restauración de Cabello Pico','Peak Hair Restoration').replace('Peak Hair Restauration','Peak Hair Restoration')
 html=re.sub(r'^html\s*(?=<html)','<!doctype html>\n',html)
 html=html.replace('Política de nombramientos','Política de citas').replace('>Nombramientos<','>Citas<').replace('>Importe de las restituciones<','>Reembolsos<').replace('mantener inofensiva Peak Hair Restoration','mantener indemne a Peak Hair Restoration')
 # References to external publications and original trademarks remain untouched.
 html=html.replace('</head>','<style>html[lang="es"] img{max-width:100%}html[lang="es"] .es-full-nav{overflow-wrap:anywhere}html[lang="es"] .es-full-notice{font-size:12px}html[lang="es"] .es-full-notice a{display:inline-block;padding:4px 0}</style></head>')
 f.write_text(html)
print('Spanish interaction labels and complete-page readability finalized.')

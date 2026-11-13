from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import base64, json, html, re, posixpath, hashlib, csv

import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--pptx',type=Path,required=True)
parser.add_argument('--renders',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
ROOT=args.out.resolve().parent
RENDERS=args.renders.resolve()
PPTX=args.pptx.resolve()
OUT=args.out.resolve()
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

slides=[]
with ZipFile(PPTX) as z:
    rels={x.get('Id'):x.get('Target') for x in E.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
    p=E.fromstring(z.read('ppt/presentation.xml'))
    for number,ident in enumerate(p.findall('p:sldIdLst/p:sldId',NS),1):
        part=posixpath.normpath(posixpath.join('ppt',rels[ident.get('{'+NS['r']+'}id')])).lstrip('/')
        r=E.fromstring(z.read(part))
        chunks=['\n'.join(''.join(par.xpath('.//a:t/text()',namespaces=NS)) for par in shape.findall('.//a:p',NS)) for shape in r.findall('.//p:sp',NS)]
        chunks+=[' | '.join(row.xpath('.//a:t/text()',namespaces=NS)) for row in r.findall('.//a:tbl/a:tr',NS)]
        title=next((t for t in chunks if t.strip() and t not in ['LOOP ENGINEERING',str(number).zfill(2)]),'Slide '+str(number))
        if number==1:title='Loop Engineering'
        relpath=posixpath.join(posixpath.dirname(part),'_rels',posixpath.basename(part)+'.rels')
        notes=''
        if relpath in z.namelist():
            nr=E.fromstring(z.read(relpath))
            target=next((x.get('Target') for x in nr if x.get('Type','').endswith('/notesSlide')),None)
            if target:
                np=posixpath.normpath(posixpath.join(posixpath.dirname(part),target)).lstrip('/')
                n=E.fromstring(z.read(np))
                noteShapes=n.xpath('.//p:sp[p:nvSpPr/p:nvPr/p:ph[@type="body"]]',namespaces=NS)
                notes='\n'.join(n.xpath('.//a:t/text()',namespaces=NS)) if not noteShapes else '\n'.join(noteShapes[0].xpath('.//a:t/text()',namespaces=NS))
        slides.append({'number':number,'title':title,'hidden':r.get('show')=='0','text':'\n'.join(chunks),'notes':notes})

assert len(slides)==43
visible=[s for s in slides if not s['hidden']]
assert len(visible)==43
assert visible[30]['title']=='Short Break'
assert not any('lighthouse' in (s['text']+'\n'+s['notes']).lower() for s in visible)
assert not any('\u2014' in (s['text']+'\n'+s['notes']) for s in slides)
assert [s['title'][0] for s in visible[16:30:2]]==list('1234567')

for s in visible:
    s['image']='data:image/png;base64,'+base64.b64encode((RENDERS/f"slide-{s['number']}.png").read_bytes()).decode()

options=''.join(f'<option value="{i}">{s["number"]:02d}. {html.escape(s["title"])}</option>' for i,s in enumerate(visible))
data=json.dumps(visible,ensure_ascii=False).replace('</',r'<\/')
page=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loop Engineering workshop, v27</title>
<style>
:root{color-scheme:light;--paper:#f7f4ed;--ink:#253d36;--line:#d9ddd2;--blue:#356c64}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Calibri,Arial,sans-serif}header,main{width:min(1328px,100%);margin:auto;padding:18px 24px}header{display:flex;align-items:center;justify-content:space-between;gap:20px}h1{margin:0;font-size:27px}header p{margin:2px 0 0;color:#627268;font-size:15px}a{color:#356c64}button,select{font:inherit;color:inherit;background:transparent;border:1px solid #9aa49b;border-radius:6px;padding:8px 12px;cursor:pointer}button:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}button:disabled{opacity:.35;cursor:default}nav{display:flex;gap:10px;align-items:center;margin:0 0 14px}select{flex:1;min-width:0;background:#fcfaf4}figure{margin:0;background:var(--ink);aspect-ratio:16/9}figure img{width:100%;height:100%;object-fit:contain;display:block}figcaption{font-size:14px;color:#627268;margin:9px 0 17px}details{border-top:1px solid var(--line);padding:12px 0}summary{cursor:pointer;font-weight:700}#notes{white-space:pre-wrap;max-width:900px;line-height:1.65}#notes p{margin:0 0 13px}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:15px}th,td{text-align:left;vertical-align:top;padding:9px 12px;border-bottom:1px solid var(--line)}th{background:#e7eeea}.source-links{display:flex;gap:20px;flex-wrap:wrap}.presenting header,.presenting nav,.presenting figcaption,.presenting details{display:none}.presenting main{max-width:none;padding:0;display:grid;min-height:100vh;place-content:center;background:var(--ink)}.presenting figure{width:min(100vw,177.7778vh)}@media(max-width:650px){header,main{padding:12px}header{align-items:flex-start}h1{font-size:23px}header p{font-size:13px}button,select{padding:7px}header>a{font-size:13px}nav{gap:6px}th,td{padding:7px 4px}}@media print{header,nav,details,figcaption{display:none}main{padding:0;width:100%}figure{width:100%}}
</style></head><body>
<header><div><h1>Loop Engineering</h1><p>Practical prompts and a guided RAG improvement loop.</p></div><div class="source-links"><a href="loop-engineering-practical-prompts.html">Copy the practical prompts</a><a href="Loop_Engineering_Workshop_Deck_learner_edition_v27.pptx">Download editable PowerPoint</a></div></header>
<main><nav aria-label="Slide navigation"><button id="prev" aria-label="Previous slide">Previous</button><select id="jump" aria-label="Choose a slide">OPTIONS</select><button id="next" aria-label="Next slide">Next</button><button id="present">Present</button></nav>
<figure><img id="slide" alt=""></figure><figcaption id="caption" aria-live="polite"></figcaption>
<details id="notes-panel"><summary>Speaker notes and transitions</summary><div id="notes"></div></details>
<details><summary>Session flow</summary><p>Slides 12 to 14 walk through three practical prompts. Slides 17 to 30 form the 14-slide guided RAG hands-on segment. Slides 39 to 41 cover the learner exercise.</p><p>The guided RAG segment uses one follow-up question to connect the sensor, controller, coding agent, fixed checks, review, and new-question flow.</p></details>
<details><summary>RAG setup and references</summary><p>The hands-on loop checks search results, asks Codex for one small code change, and reruns the fixed checks. A useful patch waits for review. After review, new questions start a fresh measurement. Review answer quality separately from the retrieval check.</p>
<p class="source-links"><a href="loop-engineering-practical-prompts.html">Three copyable prompts</a><a href="loop-engineering-rag-hands-on-v27.html">Complete hands-on guide</a><a href="https://www.agentiwise.com/loop-engineering-use-cases">Agentiwise use cases</a><a href="https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex">Codex goals</a><a href="https://code.claude.com/docs/en/scheduled-tasks">Claude Code loops</a><a href="https://www.youtube.com/watch?v=xIt_mTQp6mY&t=573s">AI Engineer talk</a><a href="https://hamel.dev/blog/posts/evals-faq/whats-a-minimum-viable-evaluation-setup.html">Hamel's minimum eval setup</a><a href="https://hamel.dev/blog/posts/llm-judge/">Judge calibration</a><a href="https://docs.langchain.com/langsmith/evaluate-llm-application">LangSmith evaluation guide</a></p></details>
</main><script>
const slides=DATA;let current=0;const byId=id=>document.getElementById(id);function render(){const s=slides[current];byId('slide').src=s.image;byId('slide').alt=s.text;byId('caption').textContent=`Slide ${s.number} of ${slides.length}: ${s.title}`;byId('jump').value=current;byId('prev').disabled=current===0;byId('next').disabled=current===slides.length-1;byId('notes').replaceChildren();for(const block of s.notes.split(/\n\n/)){const p=document.createElement('p');p.textContent=block;byId('notes').append(p)}history.replaceState(null,'',`#slide-${s.number}`)}function go(delta){current=Math.max(0,Math.min(slides.length-1,current+delta));render()}byId('prev').onclick=()=>go(-1);byId('next').onclick=()=>go(1);byId('jump').onchange=e=>{current=Number(e.target.value);render()};byId('present').onclick=()=>document.body.classList.toggle('presenting');document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(-1)}if(e.key==='Escape')document.body.classList.remove('presenting');if(e.key.toLowerCase()==='n')byId('notes-panel').open=!byId('notes-panel').open;if(e.key.toLowerCase()==='p')document.body.classList.toggle('presenting')});const match=location.hash.match(/slide-(\d+)/);if(match)current=Math.max(0,Math.min(slides.length-1,Number(match[1])-1));render();
</script></body></html>'''.replace('OPTIONS',options).replace('DATA',data)
OUT.write_text(page)
for s in visible:s.pop('image')
(ROOT/'loop-engineering-v27-outline.json').write_text(json.dumps(visible,indent=2,ensure_ascii=False))
with (ROOT/'loop-engineering-v27-slide-map.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=['number','title'],lineterminator='\n');writer.writeheader();writer.writerows({k:s[k] for k in ['number','title']} for s in visible)
print(json.dumps({'html':str(OUT),'bytes':OUT.stat().st_size,'visible':len(visible),'hidden':0,'break':31,'pptx_sha256':hashlib.sha256(PPTX.read_bytes()).hexdigest()}))

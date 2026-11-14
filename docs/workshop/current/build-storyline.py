from pathlib import Path
import argparse,json,html,base64,re
here=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description='Build the complete workshop storyline without model calls.')
parser.add_argument('--out',type=Path,default=here/'session-storyline.html')
parser.add_argument('--chat-out',type=Path)
args=parser.parse_args()
items=json.loads((here/'session-storyline.json').read_text())
slides=json.loads((here/'slide-outline.json').read_text())
assert len(items)==len(slides)==43
assert [s['number'] for s in items]==list(range(1,44))
assert all(s['title']==d['title'] for s,d in zip(items,slides))
assert '\u2014' not in json.dumps(items,ensure_ascii=False)
words=sum(len(re.findall(r"\b[\w'-]+\b",' '.join(s['spoken'])+' '+s['bridge'])) for s in items)
css='''
:root{color-scheme:light;--paper:#f7f4ed;--ink:#253d36;--accent:#356c64;--muted:#627268;--line:#d9ddd2}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:19px/1.7 Calibri,Arial,sans-serif}main{max-width:920px;margin:auto;padding:40px 28px 72px}h1{font-size:38px;line-height:1.2;margin:0 0 22px}h2{font-size:28px;line-height:1.3;margin:0 0 22px}h3{font-size:21px}p{margin:0 0 17px}a{color:var(--accent);text-underline-offset:3px}section{margin-top:40px;padding-top:28px;border-top:1px solid var(--line);scroll-margin-top:24px}.bridge{font-weight:700}.cue{border-left:3px solid var(--accent);padding:10px 18px;margin:24px 0;font-size:17px;color:var(--muted)}details{margin:24px 0}summary{cursor:pointer;font-weight:700}details>div{padding-top:16px}.meta{font-size:16px;color:var(--muted)}figure{margin:26px 0}img{display:block;width:100%;height:auto}figcaption{font-size:15px;color:var(--muted);margin-top:10px}.overview{margin:30px 0}nav{display:flex;gap:16px;flex-wrap:wrap;font-size:16px}a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}@media(max-width:620px){main{padding:25px 18px 50px}h1{font-size:31px}h2{font-size:25px}body{font-size:18px}}@media print{body{background:white;font-size:11pt}main{max-width:none;padding:0}nav{display:none}section{margin-top:24px;padding-top:16px}h1,h2,h3{break-after:avoid}.cue,figure{break-inside:avoid}details::details-content{content-visibility:visible!important}details:not([open])>:not(summary){display:block!important}}
'''
e=html.escape
body=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loop Engineering, complete session storyline</title><style>'+css+'</style></head><body><main>',
'<header><h1>Loop Engineering: the complete session storyline</h1><p>The talk track follows the current 43-slide deck, in its current order.</p><p>Read the main paragraphs aloud. The final bold sentence carries the conversation into the next slide.</p><p class="meta">Screen cues are for the presenter. They are separate from the spoken wording.</p></header>',
'<div class="overview"><h2>Teaching overview</h2><p>A failed customer follow-up creates repeated engineering work. We turn that work into explicit instructions, connect them through feedback, and follow one RAG improvement loop through seven steps. After review, a new question starts fresh checks. Learners then design a loop for one task of their own.</p><p><strong>Learner outcome:</strong> Set up an allowed change, a check, a review point, and a rule for continuing when inputs change.</p><p><strong>Proof:</strong> A written loop agreement, saved evidence from a run or replay, and an explained next decision.</p><p><strong>Hands-on:</strong> Slides 17 to 30 are the fourteen-slide guided demonstration. Slides 38 to 41 guide the learner exercise.</p><nav><a href="#slide-1">Opening</a><a href="#slide-15">Feedback diagram</a><a href="#slide-17">Guided hands-on</a><a href="#slide-30">New question</a><a href="#slide-38">Learner exercise</a><a href="#slide-43">Closing</a></nav></div>']
for s in items:
 n=s['number'];time='Presenter paced'
 if 17<=n<=30:time='Guided demonstration'
 if n==31:time='Break duration set by presenter'
 if n in [32,39,40,41]:time={32:'About one minute to choose a task',39:'About three minutes to draft',40:'About three minutes for partner review',41:'About ten minutes of work, with a saved state if a live run is still active'}[n]
 body.append(f'<section class="lecture-section" id="slide-{n}" data-nav-title="Slide {n}" data-time="{e(time)}"><h2>Slide {n}. {e(s["title"])}</h2>')
 if n==17:body.append('<p class="cue"><strong>Guided hands-on begins.</strong> The following fourteen slides introduce each step and then apply it on another screen. Application slides are 18, 20, 22, 24, 26, 28, and 30.</p>')
 if n==38:body.append('<p class="cue"><strong>Learner exercise begins.</strong> These four slides guide work in the editor, terminal, controller, or replay. Return to the deck for the debrief on slide 42.</p>')
 body.append('<div class="spoken">'+''.join('<p>'+e(p)+'</p>' for p in s['spoken'])+'</div>')
 if n in [15,16]:
  raw=base64.b64encode((here/'assets'/('feedback-diagram.jpg' if n==15 else 'rag-control-diagram.jpg')).read_bytes()).decode()
  body.append('<figure class="diagram" aria-label="Feedback loop diagram"><img src="data:image/jpeg;base64,'+raw+'" alt="'+e('The generic feedback loop' if n==15 else 'The feedback loop applied to the RelayDesk retrieval improvement system')+'"><figcaption>Explain the top path first. Then follow the measured result back through the sensor.</figcaption></figure>')
 if 'cue' in s:body.append('<div class="cue"><strong>Presenter cue</strong><p>'+e(s['cue'])+'</p></div>')
 if 'learnerCheck' in s:
  q=s['learnerCheck'];body.append('<div class="learner-check"><p><strong>Fresh case:</strong> '+e(q['prompt'])+'</p><p class="meta">'+e(q['time'])+'</p><details><summary>Expected reasoning</summary><div><p>'+e(q['expected'])+'</p></div></details></div>')
 if s['bridge']:body.append('<p class="bridge">'+e(s['bridge'])+'</p>')
 body.append('</section>')
body.append('<details id="script-review" data-review-status="reviewed"><summary>Instructor review</summary><div><p>Reviewed the complete talk track against all 43 current slide titles and their contents. The seven-step sequence, screen switches, actual D01 selection, D03 diagnosis, separate answer review, and post-review D08 continuation agree with the saved evidence and implementation.</p><p>The transition into slide 2 now gives the brief introduction a purpose. The script distinguishes the trigger examples from the later discussion of useful repetition. The live rehearsal keeps the patch pending until the flow-control application. Review guidance requires explicit promotion into feedback.md. The final learner check uses a new answer-quality case, with its expected reasoning collapsed.</p><p>Fresh screenshots of all 43 HTML slides were captured on 14 November 2026. Selected slides were also opened in Keynote. The feedback connectors on slides 6, 15, and 16 were repaired and rechecked in Keynote. Screenshot text on slides 3, 24, 26, 28, and 30 still benefits from tighter cropping for projection.</p><p>The current controller was inspected with the original failed query, repaired query, preserved question checks, explicit automated reviewer, and the later eight-question run. No model inference or review submission occurred during this review.</p><p>The main spoken wording contains '+str(words)+' words. At 130 words per minute, narration alone is about '+str(round(words/130))+' minutes. Demonstrations, questions, learner work, transitions, and the break need additional time. A total session duration has not been specified.</p></div></details>')
body.append('</main></body></html>')
page='\n'.join(body)
assert '\u2014' not in page
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(page)
chat=[]
for s in items:
 chat.append('**Slide '+str(s['number'])+'. '+s['title']+'**\n')
 if s['number']==17:chat.append('*Slides 17 to 30 are the fourteen-slide guided hands-on. Introduce each step, then switch screens on the application slide.*\n')
 if s['number']==38:chat.append('*Slides 38 to 41 are the learner exercise. Learners work in another screen, then return for the debrief.*\n')
 chat.extend(p+'\n' for p in s['spoken'])
 if s.get('cue'):chat.append('*Presenter cue: '+s['cue']+'*\n')
 if s.get('learnerCheck'):chat.append('*Fresh check: '+s['learnerCheck']['prompt']+'*\n')
 if s['bridge']:chat.append('**'+s['bridge']+'**\n')
if args.chat_out:
 args.chat_out.parent.mkdir(parents=True,exist_ok=True)
 args.chat_out.write_text('\n'.join(chat))
print(json.dumps({'slides':len(items),'spokenWords':words,'html':str(args.out)}))

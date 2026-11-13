import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const C={paper:'#F7F4ED',ink:'#253D36',teal:'#356C64',copper:'#8B5E3C',muted:'#627268',line:'#D9DDD2',pale:'#E7EEEA'};
const talk='https://www.youtube.com/watch?v=xIt_mTQp6mY';
const evidence='docs/evidence/rag-retrieval-proof/report.json';
function text(s,name,value,x,y,w,h,size=28,bold=false,color=C.ink){
 const sh=s.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=value;sh.text.style={typeface:'Calibri',fontSize:size,bold,color,alignment:'left',verticalAlignment:'middle',wrap:true};sh.text.insets=0;return sh;
}
function find(s,name){const sh=s.shapes.items.find(x=>x.name===name);if(!sh)throw new Error('Missing template shape: '+name);return sh;}
function set(s,name,value){find(s,name).text=value;}
function base(s,n,title){
 s.shapes.deleteAll();for(const i of [...s.images.items])i.delete();for(const t of [...s.tables.items])t.delete();s.background.fill=C.paper;
 text(s,'headline',title,72,68,1136,82,39,true);
 s.shapes.add({name:'heading-rule',geometry:'rect',position:{left:72,top:160,width:1136,height:1.5},fill:C.line,line:{fill:'none',width:0}});
 text(s,'footer','LOOP ENGINEERING',81,682,300,22,12,true,C.muted);
 const num=text(s,'slide-number',String(n),1160,682,48,22,12,true,C.muted);num.text.alignment='right';
}
function rich(s,name,value,x,y,w,h,size=25){
 const sh=text(s,name,'',x,y,w,h,size);
 sh.text=value.split(/(\[[^\]]+\])/).filter(Boolean).map(run=>({run,style:{color:run.startsWith('[')?C.copper:C.ink,bold:run.startsWith('[')}}));return sh;
}
function pic(s,file,x,y,w,h,alt){return s.images.add({path:path.join(here,'assets',file),position:{left:x,top:y,width:w,height:h},fit:'contain',alt});}
function notes(s,body,next,sources=[]){s.speakerNotes.text=body+'\n\nNext question:\n'+next+(sources.length?'\n\nSources:\n'+sources.join('\n'):'');}
const concepts={
 17:{title:'1. The sensor',question:'What is the pipeline doing on a real question?',principle:'Give the loop enough evidence to explain a failure.',rows:[['Observe','Save the question, search query, sources, and answer.'],['Check','Compare the retrieved sources with the expected article.'],['Report','Keep the failed case so the next attempt can use it.']],body:'The sensor makes the pipeline visible.\nA search failure can happen before answer generation.\nRun the real question and inspect the query sent to retrieval.\nIn this exercise, the automatic check asks whether the expected approved article ranks first.\nUse the saved answer for a separate quality review.',next:'What happens when the next question depends on an earlier message?',time:573},
 19:{title:'2. Regression protection',question:'What must keep working after a change?',principle:'Use the same checks before and after each attempt.',rows:[['Before','Save which questions pass and which fail.'],['Protect','Keep every question that already passes.'],['Separate','Keep the checker outside the agent’s edit scope.']],body:'A useful fix should preserve the questions that already work.\nThe runner compares the same question set, corpus, models, and checks.\nIt rejects a lost pass or more failed repetitions.\nIt also runs the full product unit suite.\nThe coding agent cannot change the expected sources or the grading rule.',next:'What do we need to write down for each question?',time:644},
 21:{title:'3. The controller',question:'Which problem should the agent work on next?',principle:'Turn a failed check into one small, testable job.',rows:[['Select','Choose one failed question and its evidence.'],['Explain','Ask what shared cause could explain the failure.'],['Limit','Name the files the agent may change.']],body:'The controller selects the first failed development question.\nIt passes the recorded failures and a bounded task to Codex.\nCodex investigates the cause.\nThe runner checks the proposal from outside the patch.\nSelection, implementation, and acceptance have separate roles.',next:'What clue does our follow-up question give the controller?',time:698},
 23:{title:'4. The actuator',question:'How does the next idea become a code change?',principle:'Give Codex a bounded task in a separate worktree.',rows:[['Skill','Describe the intended behavior with a reviewed example.'],['Scope','Allow RAG code and focused regression tests.'],['Output','Return a small patch for the runner to check.']],body:'The actuator is Codex plus the repair skill.\nIt changes the implementation in a separate worktree.\nThe controller provides the failed cases and reviewed guidance.\nThe agent may change three RAG files and add focused tests.\nQuestions, approved sources, models, dependencies, and checks stay fixed.\nThe runner allows at most 100 changed lines.',next:'What does that task look like in the code?',time:751},
 25:{title:'5. Workflow execution',question:'Who carries the work from one attempt to the next?',principle:'The runner handles the repeated work between decisions.',rows:[['Run','Measure, request a patch, and rerun the fixed checks.'],['Decide','Reject a bad patch. Hold a useful patch for review.'],['Remember','Save the evidence, patch, and reason for the decision.']],body:'The runner connects the steps.\nA failed candidate can lead to another attempt within the fixed limits.\nThe selected failure must be repaired.\nPreviously passing questions must keep passing.\nAfter the patch is frozen, the runner checks the held-out questions.\nThe patch waits for an engineer before becoming the next local baseline.\nThe run stops after three candidates or 20 minutes.\nThe OpenRouter transport enforces the shared spending cap.',next:'How do we start this workflow from a clean state?',time:800},
 27:{title:'6. Human feedback',question:'How do we guide the next attempt?',principle:'A review can become a useful instruction for later runs.',rows:[['Review','Read the saved answer, patch, and check results.'],['Explain','Write the reason for a requested change.'],['Reuse','Add approved implementation guidance to feedback.md.']],body:'Read the actual answer before assigning a quality label.\nA retrieval pass means the expected source was found.\nReview the answer’s claims and missing details separately.\nReview the code patch as a separate engineering decision.\nA saved answer verdict does not automatically update the repair instructions.\nWrite the reusable lesson in feedback.md.\nThe next repair prompt reads that file.',next:'What would useful feedback look like for this follow-up?',time:846},
 29:{title:'7. Flow control',question:'How does the loop know when to wait?',principle:'Check for new work without creating a review backlog.',rows:[['Watch','Notice changes to the source or question set.'],['Pause','Wait while a proposed patch needs review.'],['Resume','After review, measure the complete question set again.']],body:'The watcher checks for changes to the source and active questions.\nIt makes no model calls while a candidate awaits review.\nAfter acceptance or rejection, the next permitted run measures a fresh baseline.\nA new question changes the dataset version.\nCompare the same dataset before and after any new candidate.\nAt the retrieval goal, wait for changed inputs.\nA blocked or bounded run needs attention before repair resumes.\nCtrl+C stops the watcher.',next:'What happens if a new question arrives during a review?',time:910},
};

export async function updateDeck({presentation:p,input={}}){
 if(p.slides.items.length!==43)throw new Error('This update expects the 43-slide v26 deck.');
 const slide=n=>p.slides.items[n-1];
 for(const [n,data]of Object.entries(concepts)){
  const s=slide(Number(n));set(s,'headline',data.title);set(s,'step-question',data.question);set(s,'step-principle',data.principle);
  data.rows.forEach(([label,detail],i)=>{set(s,'principle-'+i,label);set(s,'principle-detail-'+i,detail);});
  notes(s,data.body,data.next,[talk+'&t='+data.time+'s','evaluations/rag-lab/demo/README.md']);
 }
 let s=slide(16);
 for(const [name,value]of Object.entries({'headline':'A loop that improves the help pipeline','desired-label':'Desired state','desired-detail':'Right source\nfirst','controller-detail':'Pick a failed\nquestion','actuator-detail':'Make one small\ncode change','system-detail':'Find articles\nand answer','sensor-label':'Retrieval checks','sensor-detail':'Expected article first. Product tests still pass.','observed':'Search\nresults','feedback':'Failed questions and search traces guide the next attempt.','disturbances':'3 attempts or 20 minutes. Shared model cap. One patch awaits review.','scenario':'A support follow-up should still find the right help article.'}))set(s,name,value);
 find(s,'desired-detail').frame={left:72,top:289,width:180,height:72};find(s,'desired-detail').text.fontSize=24;
 notes(s,'The inner pipeline finds approved help content and answers a customer.\nThe outer loop changes how that pipeline works.\nThe desired state is that every active question retrieves its expected approved article first.\nThe sensor records search results and product checks.\nThe controller chooses a failed question.\nCodex applies a bounded correction in a worktree.\nThe runner checks the proposed change and holds it for review.\nNew source code or new questions can trigger another measurement.\nSlides 17 to 30 are the guided hands-on segment.\nMove between the deck, the controller at http://127.0.0.1:4181/demo, LangSmith, and the terminal.', 'What evidence does the loop need before it can choose a change?',['evaluations/rag-lab/demo/contract.ts','evaluations/rag-lab/demo/runner.ts',talk]);

 s=slide(18);base(s,18,'A follow-up loses the topic');
 text(s,'earlier-label','Earlier question',72,190,650,35,23,true,C.teal);
 text(s,'earlier-question','How should our consumer handle duplicate RelayDesk webhook deliveries?',72,237,650,112,31,true);
 text(s,'follow-up-label','Follow-up',820,190,388,35,23,true,C.teal);
 text(s,'follow-up-question','What should I do next?',820,237,388,112,34,true);
 pic(s,'before-answer.jpg',72,383,1136,189,'Actual saved answer for the webhook follow-up before the retrieval correction.');
 text(s,'clue','The expected webhook article is missing from the search results.',72,605,1136,54,27,true,C.teal);
 notes(s,'Open the controller and expand the saved answer samples.\nFind Before D03.\nThe expected webhook article exists in the approved corpus.\nThe pipeline fails to retrieve it for this follow-up.\nRead the saved answer and inspect the associated trace in LangSmith.\nThe trace connects the customer’s input to the search query and returned sources.\nNo answer-quality label has been assigned automatically.','How do we improve this question while protecting the ones that already work?',[evidence]);

 s=slide(20);base(s,20,'A fixed check for every question');
 text(s,'setup','Pair each question with the approved article it should find.',72,186,1136,50,30,true);
 const values=[['Question type','Expected article'],['Follow-up about duplicate webhooks','kb_42: webhook delivery guide'],['Follow-up about SSO verification','kb_14: domain verification guide'],['Follow-up about knowledge access','kb_31: collection access rules']];
 const table=s.tables.add({rows:4,columns:2,left:72,top:263,width:1136,height:226,columnWidths:[610,526],values});
 table.borders.assign({fill:C.line,width:1});
 for(let r=0;r<4;r++)for(let c=0;c<2;c++){const cell=table.getCell(r,c);cell.fill=r===0?C.pale:C.paper;cell.text.style={typeface:'Calibri',fontSize:24,color:r===0?C.teal:C.ink,bold:r===0};}
 text(s,'pass-rule','Pass: the expected article ranks first in all three retrieval checks.',72,512,1136,55,27,true,C.teal);
 text(s,'split','Use six questions to guide changes. Keep three other questions for a final check.',72,580,1136,48,24);
 text(s,'quality-scope','Review answer quality separately from this search check.',72,636,1136,29,22,false,C.copper);
 notes(s,'Open development.json and identify a question, its follow-up, and expectedSource.\nThese are examples from the six development questions.\nEach question gets one vote after three complete retrieval checks.\nThe goal is the expected approved source first for every active question.\nRepeated retrieval checks do not establish general answer quality.\nThe loop keeps the question set, approved corpus, models, and check fixed during a comparison.\nThree held-out questions remain outside the repair prompt and candidate checkout.\nThe runner measures them after freezing the patch.\nUse fresh held-out questions for future tuning decisions.','Which failed question should the loop work on first?',['evaluations/rag-lab/demo/development.json','evaluations/rag-lab/demo/heldout.json','evaluations/rag-lab/demo/contract.ts']);

 s=slide(22);base(s,22,'The missing topic is a useful clue');
 text(s,'asked-label','What the customer asked',72,188,555,42,24,true,C.teal);
 text(s,'asked','How should our consumer handle duplicate RelayDesk webhook deliveries?',72,242,555,124,31,true);
 text(s,'query-label','What the search received',716,188,492,42,24,true,C.teal);
 text(s,'query','What should I do next?',716,242,492,124,34,true,C.copper);
 pic(s,'follow-up-query.jpg',72,404,1136,114,'Actual D03 query and source ranks from the recorded retrieval comparison.');
 text(s,'next-change','The controller asks Codex to inspect how the search query is built.',72,552,1136,55,29,true);
 text(s,'value','A shared fix can help other follow-up questions too.',72,622,1136,35,25,false,C.teal);
 notes(s,'Look at the Before query for D03.\nThe query contains only the latest message.\nD01 and D02 used the same short follow-up about different topics.\nThis gives the coding agent a shared cause to investigate.\nThe controller supplies the failed cases, repair skill, and allowed files.\nThe agent should change how conversation context reaches retrieval.\nIt should not hardcode a question or source ID.\nThe screenshot also includes the later recorded query. Use it to explain the changed input.','What may Codex change to test that idea?',[evidence,'evaluations/rag-lab/demo/runner.ts']);

 s=slide(24);base(s,24,'A small change to how search uses context');
 text(s,'behavior','Keep the earlier user question when building the search query.',72,184,1136,58,29,true);
 pic(s,'candidate-patch.jpg',72,264,1136,307,'Actual measured Codex patch enabling conversation context in retrieval.');
 text(s,'allowed','Can change: RAG code and focused regression tests.',72,595,1136,37,25,true,C.teal);
 text(s,'fixed','Keep fixed: questions, approved sources, models, and checks.',72,637,1136,30,23);
 notes(s,'Open the measured candidate patch.\nThe change enables conversation context by default.\nThe same query-building code now receives the earlier user topic.\nCodex also added focused regression tests for context, standalone queries, and the explicit opt-out.\nInspect the full patch in the controller.\nThe agent works in a separate worktree.\nIt does not change the healthy source branch, dataset, or grader.','How do we connect that patch to another full check?',[evidence,'evaluations/rag-lab/demo/runner.ts','.agents/skills/repair-rag/SKILL.md']);

 s=slide(26);set(s,'headline','One command connects the whole loop');
 for(const image of [...s.images.items])image.delete();find(s,'current').delete();find(s,'current-detail').delete();
 set(s,'iteration-0-detail','Same question set');set(s,'iteration-1-detail','One shared cause');set(s,'iteration-2-detail','Tests and questions');set(s,'iteration-3-detail','Engineer decides');
 text(s,'prepare-label','Create a separate starting state',72,340,1136,31,23,true,C.teal);
 rich(s,'prepare-command','pnpm rag:demo prepare --id [workshop-01]',72,380,1136,40,28);
 text(s,'run-label','Start the bounded improvement loop',72,445,1136,31,23,true,C.teal);
 rich(s,'run-command','pnpm rag:demo run --id [workshop-01]',72,485,1136,40,28);
 text(s,'repeat','A failed check leads to another attempt within the run limits.',72,565,1136,46,27,true);
 text(s,'open-review','Open the saved evidence: RAG_REVIEW_PORT=4181 pnpm rag:review',72,628,1136,36,23,false,C.muted);
 notes(s,'Use the dedicated branch codex/rag-loop-reproducible-demo.\nReplace the highlighted run ID with a fresh ID.\nPreparation restores a credible historical retrieval setup in an isolated worktree.\nThe healthy source branch stays unchanged.\nRun pnpm rag:demo prepare --id workshop-01, then pnpm rag:demo run --id workshop-01.\nThe runner measures the same questions, selects a failure, requests a small patch, and runs product tests.\nIt rechecks all development questions three times.\nIt rejects an ineffective patch or a regression.\nIt then checks the frozen patch on the held-out questions.\nA useful candidate waits for engineer review.\nThree attempts, 20 minutes, and the shared spend guard bound the run.\nThe watcher introduced next can start fresh checks when inputs change.\nThe recorded replay is available when a live model run is unsuitable.','What should a reviewer add before the loop continues?',['evaluations/rag-lab/demo/README.md',evidence]);

 s=slide(28);base(s,28,'Your review gives the next run direction');
 pic(s,'human-review.jpg',72,229,650,307,'Actual human answer review form with no verdict or critique submitted.');
 text(s,'review-answer','Read the saved answer.\nReview the patch separately.',766,208,442,115,29,true);
 text(s,'lesson-label','A useful lesson',766,355,442,37,24,true,C.teal);
 text(s,'lesson','Keep the earlier user topic when a follow-up is vague.',766,411,442,153,30,true);
 text(s,'save-guidance','Save approved implementation guidance in feedback.md.',72,630,1136,37,25,false,C.teal);
 notes(s,'Open the saved After D03 answer.\nRead it against the approved webhook article.\nThe form is blank because the reviewer must provide their own verdict and reason.\nDo not submit a prepared label as if it were a real review.\nThe lesson on this slide is an example of reusable implementation guidance.\nWrite approved guidance in feedback.md for the next repair prompt.\nAccept or reject the local code patch with the separate rag:demo review command.\nAcceptance selects the measured worktree as the next baseline.\nIt does not merge or deploy.\nFor broader automated answer-quality scoring, first collect human labels and validate the judge.','What should the loop do while this review is still open?',['evaluations/rag-lab/demo/README.md','evaluations/rag-lab/feedback.md','https://hamel.dev/blog/posts/llm-judge/']);

 s=slide(30);set(s,'headline','New questions restart the check after review');
 for(const image of [...s.images.items])image.delete();find(s,'growing-set').delete();
 set(s,'waiting-label','Add a question');set(s,'waiting-detail','Keep the current review');set(s,'gate-label','Resolve the review');set(s,'gate-detail','Accept or reject the patch');set(s,'resume-label','Check every question');set(s,'resume-detail','Save a fresh baseline');
 pic(s,'pending-review.jpg',72,352,1136,154,'Actual controller pause after a seventh question was added during a pending review.');
 rich(s,'watch-command','pnpm rag:demo watch --id [workshop-01]',72,546,1136,43,28);
 text(s,'continuous-value','After review, the watcher checks the new set and continues from its evidence.',72,613,1136,48,26,true,C.teal);
 notes(s,'Start pnpm rag:demo watch --id workshop-01.\nAdd the prepared question with pnpm rag:demo add-question --id workshop-01 --file evaluations/rag-lab/demo/new-question.json.\nIt asks when to acknowledge a webhook if a worker takes 30 seconds.\nIf a patch is pending, another run returns before a model call.\nThe recorded example has seven active questions, while its earlier comparison still covers six.\nKeep those dataset versions separate.\nAfter a responsible engineer accepts or rejects the patch, the watcher establishes a fresh baseline for all active questions.\nIt can attempt another bounded repair if the new set fails.\nAt the goal, it waits for changed inputs.\nThe loop saves the repeated checking and handoffs.\nYou still decide whether the code change is acceptable.\nStop the watcher with Ctrl+C.','Which task in your team would benefit from this repeated checking?',['evaluations/rag-lab/demo/runner.ts',evidence]);

 slide(39).speakerNotes.text=slide(39).speakerNotes.text.replace('For the RAG example, the goal requires code checks and validated answer judgments on all three repetitions. Fixtures cannot establish quality.','For the RAG exercise, require the expected approved source first in all three retrieval checks.\nKeep answer-quality review separate.\nUse a calibrated judge only when extending the loop to judge answer quality.');
 slide(40).speakerNotes.text=slide(40).speakerNotes.text.replace('five-candidate, 30-minute','three-candidate, 20-minute');
 slide(41).speakerNotes.text=slide(41).speakerNotes.text.replace('If the judge is not calibrated, practice capture and human review rather than accepting an automated quality repair.','For the RAG exercise, the automatic goal covers retrieval.\nReview saved answers separately.\nA broader answer-quality loop needs human labels and a calibrated judge.');
 if(input.render)await p.render({slide:Array.from({length:15},(_,i)=>i+15)});
 await fs.writeFile(path.join(here,'slide-text.json'),JSON.stringify(p.slides.items.map((s,i)=>({number:i+1,title:s.toSnapshot().title,text:s.shapes.items.map(sh=>sh.toSnapshot().text).join('\n'),notes:s.speakerNotes.text})),null,2));
 return {slideCount:p.slides.items.length,updatedSlides:[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],nativeTableSlide:20};
}

import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixDiagramRoutes,refreshStorylineNotes,removePhotoCaption} from './fix-diagram-routes.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const C={paper:'#F7F4ED',ink:'#253D36',teal:'#356C64',copper:'#8B5E3C',muted:'#627268',line:'#D9DDD2',pale:'#E7EEEA'};
function text(s,name,value,x,y,w,h,size=28,bold=false,color=C.ink){
 const sh=s.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=value;sh.text.style={typeface:'Calibri',fontSize:size,bold,color,alignment:'left',verticalAlignment:'middle',wrap:true};sh.text.insets=0;return sh;
}
function find(s,name){const sh=s.shapes.items.find(x=>x.name===name);if(!sh)throw new Error('Missing template shape: '+name);return sh;}
function set(s,name,value){find(s,name).text=value;}
function byText(s,value){return s.shapes.items.find(x=>x.toSnapshot().text===value);}
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
function pic(s,file,x,y,w,h,alt){return s.images.add({blob:new Uint8Array(readFileSync(path.join(here,'assets',file))),contentType:'image/jpeg',position:{left:x,top:y,width:w,height:h},fit:'contain',alt});}
function row(s,name,title,detail,y){
 text(s,name+'-title',title,72,y,330,56,30,true,C.teal);
 text(s,name+'-detail',detail,444,y,764,88,28);
 s.shapes.add({name:name+'-rule',geometry:'rect',position:{left:72,top:y+103,width:1136,height:1.5},fill:C.line,line:{fill:'none',width:0}});
}

const notes={
1:`Think about the last task you gave a coding agent.
It made a change.
You ran a check.
Then you explained the next step.

Today we will build a way to carry that work forward.
We will use the last result to choose the next allowed action.
We will also make room for review and new work.

Next question:
What does that look like in an ordinary engineering problem?`,
2:`I build agent systems for real work.
That means the work has to stay understandable after the first answer.
A person needs to see what changed and why.

Keep this introduction short.
Move straight to a customer question.

Next question:
Why can an assistant answer one message, then lose the topic on the next one?`,
3:`A customer asks about duplicate webhook deliveries.
Then they ask, "What should I do next?"

The assistant searches using that short follow-up alone.
The approved webhook article exists.
It does not appear in these search results.

This is a real saved response from our workshop run.
We have not assigned it a human answer-quality label.
For now, notice the missing source.

Next question:
What work does an engineer have to do to fix this?`,
4:`Someone has to read the failed question.
They have to inspect the search query.
Then they ask the coding agent for a change.
They rerun the checks.
They inspect the patch.

A week later, another question arrives.
Much of that checking and handoff work starts again.

Next question:
Which parts can we arrange in advance?`,
5:`Loop engineering means designing what happens after the agent returns.

We give the loop a result to reach.
We give it evidence it can read.
We limit the changes it may make.
We decide when it should try again, wait, or stop.

The important part is the connection between a result and the next action.

Next question:
How does a result become a useful next instruction?`,
6:`Take a slow test suite.
First, measure the full suite on the same runner.
Find one cause of the delay.
Make a small change.
Run the same checks again.

If the tests pass but the suite is still too slow, the new timings guide the next attempt.
The target in the later prompt is an example for learners to replace.
We are not claiming a measured speed improvement in this workshop.

Next question:
When should this work start again?`,
7:`A loop can start when you submit a goal.
It can start on a schedule.
It can also start after an outside system supplies new evidence.

The alert example needs a handoff.
An engineer supplies a fixed log export and starts the goal.
The prompt does not create an alert integration by itself.

Starting again later and retrying within one run are separate decisions.
Both use the same action, check, and stop rules.

Next question:
Which of those loops will we build today?`,
8:`Our support assistant already has a job.
It finds approved help articles and answers a customer.

We will build an engineering loop around it.
That outer loop checks examples, requests a small code change, and checks again.
A useful change waits for review.
New questions can start fresh checks later.

We are improving the system that answers customers.
We are not asking the customer assistant to rewrite itself while serving a conversation.

Next question:
What evidence would tell us that a change helped?`,
9:`Some checks have a clear rule.
The test suite passes.
A known article ranks first for a saved question.

Other checks need judgment.
Does an answer make the right claims?
Does documentation explain shipped behavior clearly?

For this hands-on loop, we automate the source-ranking check.
We keep answer-quality review separate.
A broader answer-quality loop needs human labels and a judge checked against those labels.

Next question:
Where else does repeated checking create useful work?`,
10:`These three jobs give the loop something concrete to do.

For a slow test suite, each new timing points to the next cause.
For documentation, each verified mismatch becomes one edit.
For a fixed error window, each remaining reproducible group becomes the next investigation.

A repeat has value when the last check helps choose the next action.
Use a simple script for a fixed sequence of identical actions.

Next question:
What must we specify before letting the loop run?`,
11:`These are the five choices in the run instructions.
What starts it?
What result are we trying to reach?
What may it change?
What does it check and save?
When should it stop or wait?

The next three slides turn those choices into prompts.
Then the feedback diagram will show how the pieces connect.
The seven hands-on steps will show how to build that same system.
We are looking at one loop in increasing detail.

Next question:
What does this look like as a prompt I could actually run?`,
12:`Read this prompt as a small work agreement.
The highlighted fields are values you replace.

The goal starts when you submit it.
The same full suite provides the evidence after every change.
Tests, assertions, fixtures, and coverage targets stay fixed.
The saved timings guide another attempt.

The loop stops on verified improvement or a limit.
It leaves a local change for review.

Next question:
How do these instructions change when new work arrives every hour?`,
13:`The hourly schedule starts a fresh pass.
Within a pass, the agent works through verified documentation mismatches.
Those are two different kinds of repetition.

If there is no new work, it makes no edit.
If a diff already waits for review, it waits too.
An unclear product claim goes to a person.
The saved commit and remaining list let the next pass continue from known state.

The recurring task runs while the session is open.
Cancel it after the stated number of passes.

Next question:
What if the starting evidence comes from an alert?`,
14:`Here an alert supplies a fixed error window.
An engineer starts the goal with that export.

The agent groups duplicate reports.
It reproduces one useful group locally.
It adds a failing test, changes one cause, and checks again.
Then it looks at the remaining groups in the same window.

External failures and unclear causes remain visible.
The run does not claim to have repaired them.

Next question:
What connects all of these examples?`,
15:`Point to the desired state on the left.
That is the result we want, with limits around it.

Follow the top path.
The controller chooses a correction.
The actuator applies it.
The system produces a new result.

Now follow the lower path back.
The sensor measures the result.
The difference from the desired state guides the next decision.

In software, a result can have several checks rather than one number.
Review can pause the loop.
New code, documents, or questions can change the next measurement.
This is a useful way to design feedback, not a promise of automatic convergence.

Next question:
What fills each box in our support-assistant example?`,
16:`The desired state is that every active question finds its expected approved article first.
The product tests must still pass.

The failure selector chooses a failed question.
Codex and the repair skill make one small change in an isolated worktree.
RelayDesk is the system being changed.
The retrieval checks are our sensor.

Start the prepared workflow here, before the seven-step walkthrough.
Use a fresh run ID in the two commands.
The prepared state reproduces a credible earlier retrieval setup.
It does not change the healthy source branch.

Open the controller on port 4181, the terminal, and the trace view.
Use the saved replay if a live run would distract from the session.

Slides 17 to 30 are the fourteen-slide guided hands-on segment.
Each step has an introduction, then an application on another screen.

The live runner allows three candidates or twenty minutes.
The shared model spending cap remains in force.

Next question:
What does the loop need to see first?`,
17:`The sensor makes a failure visible.
A search problem can happen before answer generation.

Save the input, the search query, the returned sources, and the answer.
Check the sources against an expected approved article.
Keep the failed case available for the next attempt.

Next question:
What did the search actually receive for our follow-up?`,
18:`Switch to the controller.
Select run 1, the before measurement, and D03.
Read the earlier webhook question and the follow-up.

The search query contains only "What should I do next?"
The expected webhook article, kb_42, is missing.

Open the trace to connect the input to the search query and returned sources.
Read the saved answer separately.
The source-ranking check gives the loop a specific failure to work on.

Next question:
How do we improve this without breaking questions that already work?`,
19:`Save the state before making a change.
Use the same checks afterward.
Keep every question that already passes.

The runner also runs the product tests.
The coding agent cannot change the questions, expected sources, or checking rule.

Next question:
What do we write down for each question?`,
20:`Open the question dataset.
Each example has an earlier question, a follow-up, and an expected approved source.

A question passes when that source ranks first in all three retrieval checks.
The initial run uses six questions to guide changes.
Three other questions stay outside the repair prompt and checkout.
The runner checks those after freezing the proposed patch.

Keep the same questions and configuration on both sides of a comparison.
A later expanded set gets its own fresh baseline.
Repeated retrieval checks do not establish answer quality.

Next question:
Which failure should the controller turn into a repair task?`,
21:`The controller chooses a failed development question.
It gives Codex the failed checks and a bounded job.

Codex investigates the cause.
The runner judges the proposed change from outside that patch.
This keeps choosing, changing, and checking as separate responsibilities.

Next question:
What shared clue appears in our failed questions?`,
22:`The actual run selected D01 first.
It concerns knowledge access.
D03 concerns webhooks.
Both reach search as the same vague follow-up.

That is evidence for a shared missing-context problem.
It is a hypothesis to investigate, not permission to hardcode a question or source ID.

The controller asks Codex to inspect how the search query is built.
We keep D03 visible because it makes the customer problem easy to follow.

Next question:
What may Codex change to test that idea?`,
23:`The actuator is Codex with the repair skill.
It works in a separate worktree.
The task names the intended behavior and allowed files.

The agent may change RAG code and add focused regression tests.
Questions, approved sources, models, dependencies, and checking rules stay fixed.
The runner also limits the size of the patch.

Next question:
What did the proposed correction actually change?`,
24:`Open the measured patch in the controller.
The change restores earlier user context when building a follow-up search query.

The focused tests cover user context, standalone queries, and the explicit opt-out.
Assistant text stays out of retrieval.

This is the actual first successful candidate in our recorded run.
Do not invent unsuccessful repair attempts for the story.
The loop supports retries when a check rejects a candidate.

Next question:
Who carries this change through all the checks?`,
25:`The runner does the work between decisions.
It measures the baseline, requests a patch, runs product tests, and rechecks the questions.
It saves the evidence and state.

A rejected candidate can lead to another bounded attempt.
A useful candidate waits for engineering review.
The same runner owns the limits and the pause.

Next question:
Which of those handoffs happened without another prompt?`,
26:`Switch to the controller event history.
Follow the actual sequence shown here.
The runner measured the baseline.
It selected D01.
It checked the candidate scope and product tests.
It rechecked the development and held-out questions.
Then it paused for review.

We started this workflow before the hands-on steps.
We did not manually prompt each handoff.
The recorded repair needed one candidate.

Next question:
What should the reviewer decide before it continues?`,
27:`A reviewer can explain what the checks missed.
Read the saved answer before assigning an answer-quality label.
Review the code patch as a separate decision.

A useful lesson belongs in the implementation guidance for future repair prompts.
In this setup, approved guidance goes in feedback.md.
Saving an answer verdict alone does not rewrite those instructions.

Next question:
What review record should this loop keep?`,
28:`Open the engineering review in run 1.
The rehearsal records Codex as the reviewer and identifies the review as automated.
It is not a human approval.

The reviewer checked the patch and regression tests.
The local decision selected the measured worktree as the next baseline.
It did not merge or deploy the change.
It did not approve answer quality.

In a learner run, the responsible person should record their own decision and reason.
Use the answer-review form separately when judging the answer.

Next question:
What stops a new question from interrupting an unfinished review?`,
29:`The watcher notices changes in the source or question set.
While a candidate awaits review, it makes no model calls.
It keeps new questions queued.

After the review is resolved, the next permitted run measures all active questions again.
If a check fails, the runner can request another bounded repair.
At the goal, it waits for changed inputs.
Unchanged inputs do not cause more model calls.
Ctrl+C stops the watcher.

Next question:
Can we see it continue after review with a genuinely new question?`,
30:`Switch to the full run history.
The first run checked six questions and proposed the shared correction.
A seventh question arrived while review was pending.
The runner waited.

The engineering review was resolved.
After that decision, we added D08, a new usage-export follow-up.
It asks which dates cover one complete calendar month.

The watcher detected the changed question set.
The second run measured all eight active questions using the accepted local baseline.
Every expected article ranked first in all three checks.
No further code change was needed.
A second watch pass with unchanged inputs made zero model calls.

Keep the six-question and eight-question runs separate in the history.
Do not present their totals as one before-and-after comparison.

Use watch for ongoing monitoring.
Use --once --retrieval-only for a bounded source-check rehearsal.
Use the after-review-question.json fixture for the new question.

The loop took over the next measurement and the decision to wait.
If the new question had failed, it would have evidence for another repair.

Next question after the break:
Where would this save work in your team?`,
31:`Pause here.
Resume with a task learners recognize from their own work.`,
32:`Think of a task you have repeated recently.
Choose something small enough to inspect today.

We will compare three familiar cases.
Then you will write a prompt for one task of your own.

Next question:
How do we tell whether another attempt will be useful?`,
33:`Ask these three questions about the task.
Can we check progress?
Does the last result help choose the next attempt?
Can we contain the changes and stop?

Use these to discuss a concrete task.
They are a quick decision aid, not a scoring system.

Next question:
Would you let a loop work on a slow test suite?`,
34:`Ask learners for a vote before revealing your explanation.

The same suite and runner give us a comparison.
The timing profile points toward the next cause.
A small scope and a review boundary contain the work.

Protect the tests and repeat the measurements.
A single fast run is weak evidence.

Next question:
Would the same freedom work for documentation?`,
35:`Ask learners which parts can run automatically.

A build and link check can reject some mistakes.
They cannot fully judge whether a product claim is true.

The loop can work through confirmed mismatches.
Unclear claims wait for a person.
That makes this useful with a review boundary.

Next question:
What happens when the request has no shared finish line?`,
36:`Ask what "better UX" means here.
There is no agreed task or check.
Another edit may only create another opinion.
The scope could cover the whole product.

Narrow it to one ticket-search keyboard trap.
Now we can check focus movement and Escape behavior.
A clearer task can change whether a loop is useful.

Next question:
What will you keep fixed before your own run?`,
37:`Bring the choices back to one task.
Name the allowed change.
Keep the check outside that change.
Choose the limit and the review point.

This is the same agreement we saw in the prompts and the RAG loop.
We are now applying it to your work.

Next question:
Which exercise can you complete with the setup you have today?`,
38:`This is the learner exercise handoff, not the session ending.
Slides 39 to 41 guide the work on other screens.

If you have a prepared repository, write and run one bounded goal.
If you have the RAG demo configured, add a question after resolving review and watch the new check.
If you have no model access, inspect the saved two-run replay and explain the next decision.

All three paths ask you to connect evidence to the next action.
Use a fresh run ID for a new live rehearsal.
Do not reuse the proof run for experiments.

Next question:
What instructions does your chosen loop need?`,
39:`Replace the highlighted fields with details from your task.
Name an outcome you can check.
Name the trigger and one allowed change.
Say which check runs after every attempt.
Say what gets saved and when the loop stops or waits.

For the RAG exercise, the automatic goal covers the expected approved source.
Keep answer-quality review separate.

Next question:
Could your instructions allow a bad change to pass?`,
40:`Swap prompts with a partner.
Ask what would reject a bad change.

Could the agent remove tests?
Could it change the expected answer?
Could it declare a task done without running the check?

Use the stronger prompt to make those boundaries clear.
Keep the goal and the limits appropriate for your task.

Next question:
What will you save from the run so someone else can review it?`,
41:`Move to the terminal, controller, or replay for the learner exercise.
Run only within your prepared scope.
Save the starting state, attempted change, check result, and next decision.

For a prepared RAG continuation, resolve any pending review first.
Add the new question.
Run one bounded watch pass and inspect the fresh baseline.

A saved replay is read-only and makes no model calls.
If live setup blocks progress, use that path to explain what the loop should do next.
Stop at the chosen limit and return for the debrief.

Next question:
Which work did the loop take over, and which decision stayed with you?`,
42:`Invite two or three learners to share one example.

What check ran without another prompt?
What evidence changed the next action?
Where did the loop wait for someone?
What would make it run again?

Ask for the next saved input or event, rather than a broad claim about productivity.
That makes the value of the loop concrete.

Next question:
Which small piece of repeated work will you automate next?`,
43:`Return to the engineering work we started with.
A failed question used to create another round of manual checking and prompting.
Now there is an explicit path from evidence to action, review, and the next input.

Choose one useful task.
Make its check clear.
Run it with limits.
Review what happened.
Then decide whether it should keep watching for more work.`
};

export async function updateDeck({presentation:p,input={}}){
 if(p.slides.items.length!==43)throw new Error('Expected the current 43-slide source.');
 const start=input.start??1,end=input.end??43;
 const active=n=>n>=start&&n<=end;
 const slide=n=>p.slides.items[n-1];
 let s;
 if(active(1)){
  s=slide(1);byText(s,'Choose the next step. Check the work. Stop safely.').text='Let the last result guide the next step.';
  byText(s,'Hands-on workshop').text='A workshop for everyday engineering work';
 }
 if(active(2)){
  s=slide(2);
  for(const sh of [...s.shapes.items]){const f=sh.toSnapshot().frame;if(f.top>=550&&f.top<640&&f.left>=490)sh.delete();}
  for(const im of [...s.images.items]){if(im.toSnapshot().frame.top>=550)im.delete();}
  byText(s,'I focus on useful results, not polished demos.').text='I focus on systems people can inspect and improve.';
 }
 if(active(3)){
  s=slide(3);base(s,3,'Why did the assistant lose the topic?');
  text(s,'customer','“How should we handle duplicate webhook deliveries?”',72,200,1136,72,34,true);
  text(s,'follow-up','“What should I do next?”',72,291,1136,60,37,true,C.teal);
  pic(s,'before-answer.jpg',72,388,1136,189,'Real saved response for the webhook follow-up before the retrieval correction.');
  text(s,'problem','The approved webhook article exists. The search misses it.',72,608,1136,48,28,true,C.copper);
 }
 if(active(4)){
  s=slide(4);base(s,4,'What work does that failure create?');
  row(s,'inspect','Understand the failure','Read the question, the search query, and the returned sources.',205);
  row(s,'change','Request a change','Ask the coding agent for a small fix. Run the checks again.',337);
  row(s,'return','Do it again later','Review the patch. Repeat the checking when a new question arrives.',469);
 }
 if(active(5)){
  s=slide(5);base(s,5,'What are we engineering around the agent?');
  text(s,'definition','A way to use the last result\nto choose the next allowed action.',72,212,1136,136,43,true);
  row(s,'evidence','Give it evidence','A check that shows what changed and what still needs work.',386);
  text(s,'boundary','Decide when it should try again, wait for review, or stop.',72,564,1136,74,31,true,C.teal);
 }
 if(active(6))set(slide(6),'headline','How does a result guide the next attempt?');
 if(active(7))set(slide(7),'headline','When should the work start again?');
 if(active(8)){
  s=slide(8);base(s,8,'Which loop are we building?');
  row(s,'assistant','The support assistant','Find approved articles and answer a customer.',211);
  row(s,'engineering','The engineering loop','Check examples. Request a code change. Check again. Wait for review.',367);
  text(s,'return','A new question starts a fresh check of that same system.',72,578,1136,66,31,true,C.teal);
 }
 if(active(9)){
  s=slide(9);set(s,'headline','What would count as better?');set(s,'left-heading','Checks with a clear rule');set(s,'right-heading','Checks that need judgment');
  set(s,'item-72-1','The expected article ranks first.');set(s,'item-680-2','A judge agrees with reviewed examples.');
 }
 if(active(10)){
  s=slide(10);set(s,'headline','Where does another attempt help?');
  set(s,'start-0','Timing evidence');set(s,'start-1','Mismatch list');set(s,'start-2','Remaining errors');
 }
 if(active(11)){
  s=slide(11);set(s,'headline','What must the loop know before it starts?');
  set(s,'next-decision','Five choices for the run. Next, we will connect them through feedback.');
 }
 if(active(12))set(slide(12),'headline','How would you ask for a faster test suite?');
 if(active(13))set(slide(13),'headline','How would the docs loop find new work?');
 if(active(14))set(slide(14),'headline','How would a loop work through errors?');
 if(active(15))set(slide(15),'headline','How does feedback guide the next action?');
 if(active(16)){
  s=slide(16);set(s,'headline','How will we run this around RelayDesk?');
  find(s,'feedback').delete();find(s,'disturbances').delete();
  rich(s,'prepare-command','pnpm rag:demo prepare --id [workshop-01]',72,581,1136,35,23);
  rich(s,'run-command','pnpm rag:demo run --id [workshop-01]',72,624,1136,35,23);
 }
 const concepts={
 17:['What does the loop need to see first?','Save the evidence that makes a failure understandable.'],
 19:['What must keep working after a change?','Use the same checks before and after each attempt.'],
 21:['Which problem should the agent work on next?','Turn one failed check into a small, testable job.'],
 23:['How does the next idea become a code change?','Give Codex a bounded task in a separate worktree.'],
 25:['Who carries the work from one attempt to the next?','Let the runner handle the work between decisions.'],
 27:['What can a reviewer add to the next attempt?','Keep a clear decision and a reason the next run can use.'],
 29:['When should the loop run, wait, or stop?','Watch for new work and respect an unfinished review.']
 };
 for(const [n,[question,principle]]of Object.entries(concepts))if(active(Number(n))){s=slide(Number(n));set(s,'step-question',question);set(s,'step-principle',principle);}
 if(active(18)){
  s=slide(18);base(s,18,'What did the search actually receive?');
  pic(s,'initial-search.jpg',72,209,1136,331,'Real D03 baseline query and returned sources. The expected webhook article is missing.');
  text(s,'clue','The follow-up reached search without the earlier topic.',72,583,1136,70,30,true,C.teal);
 }
 if(active(20))set(slide(20),'headline','What does a check need for each question?');
 if(active(22)){
  s=slide(22);base(s,22,'What do the failed questions have in common?');
  text(s,'case-one','D01: knowledge access',72,202,540,55,31,true,C.teal);
  text(s,'case-two','D03: webhook deliveries',668,202,540,55,31,true,C.teal);
  text(s,'same-query','Both reach search as:\n“What should I do next?”',72,293,1136,132,40,true);
  text(s,'job','Inspect how the earlier user topic reaches the search query.',72,482,1136,81,31,true);
  text(s,'selection','The runner selected D01 first. D03 shows the same missing-context clue.',72,606,1136,48,24,false,C.muted);
 }
 if(active(24))set(slide(24),'headline','What did the small correction change?');
 if(active(26)){
  s=slide(26);set(s,'headline','What did the runner do without another prompt?');
  for(const name of ['prepare-label','prepare-command','run-label','run-command','repeat','open-review'])find(s,name).delete();
  pic(s,'initial-run-events.jpg',72,328,1136,288,'Real run events from baseline measurement through the pause for engineering review.');
  text(s,'handoff','The runner carried each check and handoff forward.',72,628,1136,37,26,true,C.teal);
 }
 if(active(28)){
  s=slide(28);base(s,28,'What should a reviewer decide?');
  pic(s,'engineering-review.jpg',72,206,1136,214,'Actual review record explicitly attributed to Codex as an automated engineering review.');
  row(s,'code','Code decision','Accept this patch as the next local baseline, or explain a rejection.',455);
  text(s,'answer','Answer quality has its own review. This record does not approve a release.',72,606,1136,54,25,false,C.copper);
 }
 if(active(30)){
  s=slide(30);set(s,'headline','What happens when a new question arrives?');
  set(s,'waiting-label','Resolve the review');set(s,'waiting-detail','Keep the decision and reason');
  set(s,'gate-label','Add a new question');set(s,'gate-detail','A usage-export follow-up');
  set(s,'resume-label','Check all eight');set(s,'resume-detail','Continue from the new state');
  for(const im of [...s.images.items])im.delete();
  pic(s,'continued-history.jpg',72,352,1136,155,'Actual two-run history. The second run checks eight questions after the first patch review.');
  find(s,'watch-command').delete();find(s,'continuous-value').delete();
  rich(s,'watch-command','pnpm rag:demo watch --id [workshop-01]',72,546,1136,43,28);
  text(s,'continuation','The new set passed. The watcher waited. No extra patch was needed.',72,610,1136,52,27,true,C.teal);
 }
 if(active(32)){
  s=slide(32);set(s,'headline','Where would this save work in your team?');
  set(s,'concrete-question','Think of one task you have\nhad to check more than once.');
  set(s,'case-promise','We will test three familiar cases, then design your own loop.');
 }
 if(active(33))set(slide(33),'headline','How can we tell whether a loop will help?');
 if(active(34))set(slide(34),'headline','Would you loop on a slow test suite?');
 if(active(35))set(slide(35),'headline','How much of docs maintenance can run alone?');
 if(active(36))set(slide(36),'headline','Would you loop on “make the UX better”?');
 if(active(37)){
  s=slide(37);base(s,37,'What will you keep fixed before the run?');
  row(s,'scope','The allowed change','Name the files and one unit of work the agent may change.',204);
  row(s,'check','The check','Keep the tests, expected evidence, and checking rule outside that change.',337);
  row(s,'stop','The boundary','Choose a limit and the decision that needs a reviewer.',470);
 }
 if(active(38)){
  s=slide(38);base(s,38,'What will your first loop do?');
  row(s,'own','Use your repository','Write one bounded goal for a task you can check today.',204);
  row(s,'rag','Continue the RAG loop','Resolve review. Add a question. Watch the fresh check.',337);
  row(s,'replay','Use the saved replay','Inspect both runs and explain the next decision. No model access needed.',470);
 }
 if(active(39))set(slide(39),'headline','What instructions does your loop need?');
 if(active(40))set(slide(40),'headline','What could make a bad change pass?');
 if(active(41)){
  s=slide(41);base(s,41,'What will you save from the run?');
  text(s,'activity','Run your prepared loop, or inspect the saved replay.',72,196,1136,65,33,true);
  row(s,'before','Starting state','The input and the check before any change.',292);
  row(s,'attempt','Attempt and evidence','The allowed change, the check result, and any rejection.',415);
  text(s,'decision','Save the next decision: try again, wait for review, or wait for new work.',72,567,1136,83,30,true,C.teal);
 }
 if(active(42)){
  s=slide(42);base(s,42,'What work did your loop take over?');
  row(s,'check','What ran on its own?','Name one check or handoff you no longer had to prompt.',204);
  row(s,'evidence','What changed the next action?','Point to the result the loop used.',337);
  row(s,'new-work','What would make it run again?','Name the next question, changed input, or review decision.',470);
 }
 if(active(43)){
  s=slide(43);base(s,43,'What will you automate next?');
  text(s,'closing','Choose one piece of repeated work.\nGive it a check and a clear boundary.',72,222,1136,148,44,true);
  text(s,'return','Let the evidence guide the next action.',72,442,1136,65,36,true,C.teal);
  text(s,'follow','Review the change. Then let new work start the loop again.',72,572,1136,73,28);
 }
 for(let n=start;n<=end;n++){
  const body=notes[n];if(!body)throw new Error('Missing notes for slide '+n);
  if(/\u2014|https?:\/\/|\bSources?:/i.test(body))throw new Error('Learner notes contain provenance on '+n);
  slide(n).speakerNotes.text=body;
 }
 fixDiagramRoutes(p,start,end);
 removePhotoCaption(p,start,end);
 refreshStorylineNotes(p,start,end);
 if(input.render)await p.render({slide:Array.from({length:end-start+1},(_,i)=>start+i-1)});
 if(start===1&&end===43)await fs.writeFile(path.join(here,'slide-text.json'),JSON.stringify(p.slides.items.map((s,i)=>({number:i+1,title:s.toSnapshot().title,text:s.shapes.items.map(sh=>sh.toSnapshot().text).join('\n'),notes:s.speakerNotes.text})),null,2));
 return {slideCount:43,updated:[start,end],handsOn:[17,30]};
}

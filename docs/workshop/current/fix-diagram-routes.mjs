import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const ink='#253D36',teal='#356C64';

function segment(slide,name,a,b,color,arrow=false){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 if(dx!==0&&dy!==0)throw new Error('Feedback segments must be horizontal or vertical.');
 return slide.shapes.add({name,geometry:'connector',kind:'straight',position:{left:Math.min(a[0],b[0]),top:Math.min(a[1],b[1]),width:Math.abs(dx),height:Math.abs(dy),horizontalFlip:dx<0,verticalFlip:dy<0},line:{fill:color,width:2.8},head:{type:'none'},tail:{type:arrow?'triangle':'none',width:'med',length:'med'}});
}
function route(slide,name,points,color){
 for(let i=1;i<points.length;i++)segment(slide,name+'-'+i,points[i-1],points[i],color,i===points.length-1);
}
export function fixDiagramRoutes(p,start=1,end=43){
 const changed=[];
 for(const n of [6,15,16]){
  if(n<start||n>end)continue;
  const s=p.slides.items[n-1];
  for(const sh of [...s.shapes.items])if(sh.name?.startsWith('feedback-route-'))sh.delete();
  const named=name=>{const sh=s.shapes.items.find(x=>x.name===name);if(!sh)throw new Error('Missing diagram shape '+name+' on slide '+n);return sh;};
  const id=name=>named(name).id;
  const pairs=n===6?[[id('recheck'),id('measure')]]:[[id('system'),id('sensor')],[id('sensor'),id('gap-point')]];
  for(const sh of [...s.shapes.items])if(sh.connector&&pairs.some(([from,to])=>sh.connector.fromElementId===from&&sh.connector.toElementId===to))sh.delete();
  if(n===6){
   route(s,'feedback-route-recheck',[[1073,449],[1073,484],[207,484],[207,449]],teal);
  }else{
   route(s,'feedback-route-system',[[1084,356],[1084,392],[928,392],[928,506.5],[895,506.5]],ink);
   route(s,'feedback-route-sensor',[[360,506.5],[292,506.5],[292,308]],teal);
  }
  changed.push(n);
 }
 return changed;
}
export function refreshStorylineNotes(p,start=1,end=43){
 const story=JSON.parse(readFileSync(path.join(here,'session-storyline.json'),'utf8'));
 if(story.length!==43||p.slides.items.length!==43)throw new Error('The storyline and deck must both have 43 slides.');
 for(const s of story){
  if(s.number<start||s.number>end)continue;
  const parts=[...s.spoken];
  if(s.bridge)parts.push('Next slide:\n'+s.bridge);
  if(s.cue)parts.push('Presenter cue:\n'+s.cue);
  if(s.learnerCheck)parts.push('Learner check:\n'+s.learnerCheck.prompt+'\n'+s.learnerCheck.time+'\nExpected reasoning:\n'+s.learnerCheck.expected);
  p.slides.items[s.number-1].speakerNotes.text=parts.join('\n\n');
 }
}
export function removePhotoCaption(p,start=1,end=43){
 if(start>2||end<2)return false;
 const slide=p.slides.items[1];
 for(const sh of [...slide.shapes.items]){
  const snap=sh.toSnapshot(),f=snap.frame;
  if(snap.text==='I build useful agent systems.'||(Math.abs(f.left-72)<1&&Math.abs(f.top-538)<1&&Math.abs(f.width-370)<1&&Math.abs(f.height-64)<1))sh.delete();
  else if(Math.abs(f.left-72)<1&&Math.abs(f.top-128)<1&&Math.abs(f.width-370)<1&&Math.abs(f.height-474)<1)sh.frame={...f,height:424};
 }
 return true;
}
export async function updateCurrentDeck({presentation:p,input={}}){
 const changed=fixDiagramRoutes(p);
 removePhotoCaption(p);
 refreshStorylineNotes(p);
 if(input.render)await p.render({slide:[1,...changed.map(n=>n-1)]});
 return {slides:p.slides.items.length,diagramSlides:changed,storylineNotes:43,photoCaptionRemoved:true};
}

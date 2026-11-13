import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {updateDeck} from './update-deck.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf('--'+name);if(i<0||!args[i+1])throw new Error('Provide --'+name);return path.resolve(args[i+1]);}
const runtime=arg('runtime-modules'),skill=arg('skill-dir'),python=arg('python'),out=arg('out');
process.env.RUNTIME_NODE_MODULES=runtime;
const stage=path.join(path.dirname(out),'.'+path.basename(out)+'-build');
await fs.mkdir(stage,{recursive:true});await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(runtime,'resolver.cjs'));
const {FileBlob,PresentationFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const p=await PresentationFile.importPptx(await FileBlob.load(path.join(here,'source.pptx')));
await updateDeck({presentation:p});
const draft=path.join(stage,'candidate.pptx'),final=path.join(out,'Loop_Engineering_Workshop_Deck.pptx');
await (await PresentationFile.exportPptx(p)).save(draft);
execFileSync(python,[path.join(here,'validate-content.py'),draft],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(here,'finalize.mjs'),'--candidate',draft,'--out',final,'--receipt',path.join(stage,'validation.json'),'--skill-dir',skill,'--python',python],{stdio:'inherit'});
const renders=path.join(stage,'renders');await fs.mkdir(renders,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(renders,`slide-${i+1}.png`),new Uint8Array(await blob.arrayBuffer()));
}
execFileSync(python,[path.join(here,'build-html.py'),'--pptx',final,'--renders',renders,'--out',path.join(out,'loop-engineering-workshop.html')],{stdio:'inherit'});
for(const name of ['rag-hands-on.html','practical-prompts.html'])await fs.copyFile(path.join(here,name),path.join(out,name));
await fs.copyFile(path.join(here,'../../evidence/rag-continuation/report.html'),path.join(out,'rag-demo-replay.html'));
console.info(JSON.stringify({pptx:final,html:path.join(out,'loop-engineering-workshop.html'),slides:43}));

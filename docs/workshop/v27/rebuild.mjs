import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {updateDeck} from './update-deck.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf('--'+name);if(i<0||!args[i+1])throw new Error('Provide --'+name);return path.resolve(args[i+1]);}
const runtime=arg('runtime-modules'),skill=arg('skill-dir'),python=arg('python'),out=arg('out');
process.env.RUNTIME_NODE_MODULES=runtime;
const workspace=path.dirname(out),staging=path.join(workspace,'.'+path.basename(out)+'-build');
const source=path.join(here,'source-v26.pptx'),draft=path.join(staging,'candidate.pptx');
const final=path.join(out,'Loop_Engineering_Workshop_Deck_learner_edition_v27.pptx');
await fs.mkdir(path.dirname(draft),{recursive:true});
await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(runtime,'resolver.cjs'));
const {FileBlob,PresentationFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const p=await PresentationFile.importPptx(await FileBlob.load(source));
await updateDeck({presentation:p});
await (await PresentationFile.exportPptx(p)).save(draft);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:workspace,candidatePath:draft,finalPath:final,explicitTotalSlideCount:43,pythonExecutable:python,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','20'],requiredNativeTableOwnerSlides:[20],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'reference',families:['Calibri'],referencePath:source,referenceSha256:createHash('sha256').update(await fs.readFile(source)).digest('hex')},verifyArtifactToolImport:true,receiptPath:path.join(staging,'validation.json')});
const renders=path.join(staging,'renders');await fs.mkdir(renders,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(renders,`slide-${i+1}.png`),new Uint8Array(await blob.arrayBuffer()));
}
execFileSync(python,[path.join(here,'build-html.py'),'--pptx',final,'--renders',renders,'--out',path.join(out,'loop-engineering-workshop-v27.html')],{stdio:'inherit'});
for(const name of ['loop-engineering-rag-hands-on-v27.html','loop-engineering-practical-prompts.html'])await fs.copyFile(path.join(here,name),path.join(out,name));
console.info(JSON.stringify({pptx:final,html:path.join(out,'loop-engineering-workshop-v27.html'),slideCount:43}));

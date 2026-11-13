import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf('--'+name);if(i<0||!args[i+1])throw new Error('Provide --'+name);return path.resolve(args[i+1]);}
const skill=arg('skill-dir'),python=arg('python'),candidate=arg('candidate'),out=arg('out'),receipt=arg('receipt');
const source=path.join(here,'source.pptx');
await fs.mkdir(path.dirname(out),{recursive:true});
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:path.dirname(path.dirname(out)),candidatePath:candidate,finalPath:out,explicitTotalSlideCount:43,pythonExecutable:python,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','20'],requiredNativeTableOwnerSlides:[20],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'reference',families:['Calibri'],referencePath:source,referenceSha256:createHash('sha256').update(await fs.readFile(source)).digest('hex')},verifyArtifactToolImport:true,receiptPath:receipt});

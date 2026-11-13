import {execFileSync} from "node:child_process";
import {mkdtemp,mkdir,writeFile,symlink,unlink,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {describe,it,expect} from "vitest";
import {workspaceFileHashes,requireTrustedDependencies,requireRegularCandidateFiles} from "../evaluations/rag-lab/worktree";
describe("candidate worktree integrity",()=>{
 it("handles the ignored dependency symlink without reading a directory",async()=>{
  const base=await mkdtemp(path.join(os.tmpdir(),"rag-tree-")),root=path.join(base,"candidate"),deps=path.join(base,"dependencies");
  try{await mkdir(root);await mkdir(deps);execFileSync("git",["init","-q",root]);await writeFile(path.join(root,".gitignore"),"node_modules/\n");await writeFile(path.join(root,"product.ts"),"export const value=1;\n");execFileSync("git",["-C",root,"add","product.ts"]);await symlink(deps,path.join(root,"node_modules"),"dir");
   expect(await workspaceFileHashes(root)).toHaveProperty("product.ts");expect(await workspaceFileHashes(root)).not.toHaveProperty("node_modules");await expect(requireTrustedDependencies(root,deps)).resolves.toBeUndefined();await unlink(path.join(root,"product.ts"));expect((await workspaceFileHashes(root))["product.ts"]).toBe("missing");
  }finally{await rm(base,{recursive:true,force:true})}
 });
 it("rejects replaced dependencies and links disguised as permitted source files",async()=>{
  const base=await mkdtemp(path.join(os.tmpdir(),"rag-link-")),root=path.join(base,"candidate"),deps=path.join(base,"dependencies");
  try{await mkdir(root);await mkdir(deps);execFileSync("git",["init","-q",root]);await symlink(deps,path.join(root,"source.ts"));await expect(requireRegularCandidateFiles(root,["source.ts"])).rejects.toThrow("regular file");await symlink(base,path.join(root,"node_modules"),"dir");await expect(requireTrustedDependencies(root,deps)).rejects.toThrow("dependency link");expect((await workspaceFileHashes(root))["source.ts"]).toBeTypeOf("string");
  }finally{await rm(base,{recursive:true,force:true})}
 });
});

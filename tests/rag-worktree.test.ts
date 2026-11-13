import {execFileSync} from "node:child_process";
import {mkdtemp,mkdir,writeFile,symlink,unlink,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {describe,it,expect} from "vitest";
import {workspaceFileHashes,requireTrustedDependencies,requireRegularCandidateFiles,productTestEnvironment,productCandidatePatch} from "../evaluations/rag-lab/worktree";
describe("candidate worktree integrity",()=>{
 it("includes new regression tests in a portable review patch",async()=>{
  const base=await mkdtemp(path.join(os.tmpdir(),"rag-patch-")),before=path.join(base,"before"),after=path.join(base,"after");
  try{await mkdir(before);await mkdir(after);await writeFile(path.join(before,"product.ts"),"export const context=false;\n");await writeFile(path.join(after,"product.ts"),"export const context=true;\n");await writeFile(path.join(after,"regression.test.ts"),"expect(context).toBe(true);\n");
   const patch=await productCandidatePatch(before,after,["product.ts","regression.test.ts"]);
   expect(patch).toContain("+export const context=true;");expect(patch).toContain("--- /dev/null\n+++ b/regression.test.ts");expect(patch).toContain("+expect(context).toBe(true);");expect(patch).not.toContain(base);
   execFileSync("git",["apply","--check","-"],{cwd:before,input:patch});
  }finally{await rm(base,{recursive:true,force:true})}
 });
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

describe("isolated product test environment",()=>{it("keeps OS paths while excluding live data, model access, and app overrides",()=>{const source={PATH:"/test/bin",HOME:"/test/home",DATABASE_URL:"postgres://private",OPENROUTER_API_KEY:"test-not-a-real-key",RELAYDESK_HELP_EMBEDDING_MODE:"gateway",LANGSMITH_API_KEY:"test-not-a-real-key",NODE_OPTIONS:"--require=live-loader"};expect(productTestEnvironment(source)).toEqual({PATH:"/test/bin",HOME:"/test/home",NODE_ENV:"test",CI:"1"});expect(source.DATABASE_URL).toBe("postgres://private")})});

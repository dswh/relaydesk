import { execFileSync } from "node:child_process";
import { lstat, readFile, readlink } from "node:fs/promises";
import path from "node:path";
import { sha } from "./store";

// Hash symlinks as links. Never follow an agent-created link into another tree.
export async function workspaceFileHashes(root: string) {
  const names = execFileSync("git", ["-C", root, "ls-files", "-c", "-o", "--exclude-standard"], { encoding: "utf8" })
    .split("\n").filter(name => name && name !== "node_modules" && !name.startsWith("node_modules/"));
  return Object.fromEntries(await Promise.all([...new Set(names)].sort().map(async name => {
    const file = path.join(root, name);
    try {
      const stat = await lstat(file);
      const hash = stat.isSymbolicLink() ? sha(`symlink:${await readlink(file)}`)
        : stat.isFile() ? sha(await readFile(file)) : sha("directory");
      return [name, hash];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [name, "missing"];
      throw error;
    }
  })));
}

export async function requireTrustedDependencies(root: string, trustedModules: string) {
  const file = path.join(root, "node_modules");
  const stat = await lstat(file);
  if (!stat.isSymbolicLink() || path.resolve(root, await readlink(file)) !== path.resolve(trustedModules)) {
    throw new Error("The candidate changed its trusted dependency link.");
  }
}

export async function requireRegularCandidateFiles(root: string, files: string[]) {
  for (const name of files) {
    if (!(await lstat(path.join(root, name))).isFile()) {
      throw new Error(`Candidate file ${name} must remain a regular file.`);
    }
  }
}

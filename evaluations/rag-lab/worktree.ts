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

export function codexRepairArguments(root: string) {
  return ["exec", "--ignore-user-config", "--json", "--ephemeral", "--sandbox", "workspace-write", "-C", root, "-"];
}

export async function productCandidatePatch(beforeRoot: string, afterRoot: string, files: string[]) {
  const patches: string[] = [];
  for (const file of files) {
    const previous = path.join(beforeRoot, file);
    const exists = await lstat(previous).then(() => true, error => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    });
    let diff = "";
    try {
      diff = execFileSync("git", ["diff", "--no-index", "--", exists ? previous : "/dev/null", path.join(afterRoot, file)], {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]});
    } catch (error) {
      const result = error as {status?: number; stdout?: string};
      if (result.status !== 1 || !result.stdout) throw error;
      diff = result.stdout;
    }
    patches.push(diff.split("\n").map(line => {
      if (line.startsWith("diff --git ")) return `diff --git a/${file} b/${file}`;
      if (line.startsWith("--- ")) return `--- ${exists ? `a/${file}` : "/dev/null"}`;
      if (line.startsWith("+++ ")) return `+++ b/${file}`;
      return line;
    }).join("\n"));
  }
  return patches.join("\n");
}

export function productTestEnvironment(source: Record<string,string|undefined>) {
  const safe = Object.fromEntries(Object.entries(source).filter(([key, value]) =>
    value !== undefined && /^(PATH|HOME|USER|LOGNAME|TMPDIR|TEMP|TMP|SYSTEMROOT|COMSPEC|PATHEXT|LANG|LC_.+|TERM|NO_COLOR)$/i.test(key),
  ));
  return { ...safe, NODE_ENV: "test" as const, CI: "1" };
}

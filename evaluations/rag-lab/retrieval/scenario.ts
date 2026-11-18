import {execFileSync} from "node:child_process";
import {access, mkdir, readFile, symlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {labRoot, sha} from "../store";

const git = (root: string, args: string[]) => execFileSync("git", ["-C", root, ...args], {encoding: "utf8"}).trim();

export async function prepareRetrievalScenario(root: string, id: string) {
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) throw new Error("Use a short lowercase ID with letters, digits, and hyphens.");
    if (git(root, ["status", "--porcelain"])) throw new Error("Commit or save local changes before creating the scenario.");
    const destination = path.join(root, ".worktrees", `rag-${id}`);
    if (await access(destination).then(() => true, () => false)) throw new Error("This scenario already exists. Choose a new ID.");
    await access(path.join(root, "node_modules"));
    const provenance = JSON.parse(await readFile(path.join(labRoot, "retrieval/historical-config.json"), "utf8")) as {source: string; sha256: string};
    if (sha(provenance.source) !== provenance.sha256) throw new Error("Historical configuration provenance changed.");
    const relative = "src/lib/help-chat-config.ts";
    let source = await readFile(path.join(root, relative), "utf8");
    const context = /(process\.env\.RELAYDESK_HELP_INCLUDE_CONTEXT,\s*)true/;
    if (!context.test(source) || !source.includes("process.env.RELAYDESK_HELP_TOP_K, 5")) throw new Error("The healthy configuration changed. Review the scenario before preparing it.");
    source = source.replace(context, "$1false").replace("process.env.RELAYDESK_HELP_TOP_K, 5", "process.env.RELAYDESK_HELP_TOP_K, 2");
    await mkdir(path.dirname(destination), {recursive: true});
    git(root, ["worktree", "add", "--detach", destination, "HEAD"]);
    try {
        await symlink(path.join(root, "node_modules"), path.join(destination, "node_modules"), "dir");
        await writeFile(path.join(destination, relative), source);
    } catch (error) {
        git(root, ["worktree", "remove", "--force", destination]);
        throw error;
    }
    return {product: destination, sourceCommit: git(root, ["rev-parse", "HEAD"]), note: "Created an isolated historical product state. No model calls or repair agent were started."};
}

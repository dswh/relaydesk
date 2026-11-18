import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile, realpath} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {describe, expect, it} from "vitest";
import {prepareRetrievalScenario} from "../evaluations/rag-lab/retrieval/scenario";

async function repository() {
    const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "rag-scenario-")));
    execFileSync("git", ["init", "-q", root]);
    await mkdir(path.join(root, "src/lib"), {recursive: true});
    await mkdir(path.join(root, "node_modules"));
    await writeFile(path.join(root, ".gitignore"), ".worktrees/\nnode_modules/\n.env.local\n");
    const source = "includeConversationContext: booleanValue(process.env.RELAYDESK_HELP_INCLUDE_CONTEXT,\n      true),\ntopK: numberValue(process.env.RELAYDESK_HELP_TOP_K, 5)\n";
    await writeFile(path.join(root, "src/lib/help-chat-config.ts"), source);
    await writeFile(path.join(root, ".env.local"), "RELAYDESK_MODEL_BUDGET_FILE=/private/shared-ledger.json\n");
    execFileSync("git", ["-C", root, "add", ".gitignore", "src"]);
    execFileSync("git", ["-C", root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "Healthy product"]);
    return {root, source};
}

describe("isolated retrieval scenario", () => {
    it("restores the historical state without editing the source or copying credentials", async () => {
        const {root, source} = await repository();
        try {
            const scenario = await prepareRetrievalScenario(root, "context-01");
            expect(await readFile(path.join(root, "src/lib/help-chat-config.ts"), "utf8")).toBe(source);
            const historical = await readFile(path.join(scenario.product, "src/lib/help-chat-config.ts"), "utf8");
            expect(historical).toContain("CONTEXT,\n      false");
            expect(historical).toContain("TOP_K, 2");
            expect(execFileSync("git", ["-C", root, "status", "--porcelain"], {encoding: "utf8"})).toBe("");
            expect(await realpath(path.join(scenario.product, "node_modules"))).toBe(path.join(root, "node_modules"));
            await expect(readFile(path.join(scenario.product, ".env.local"))).rejects.toThrow();
            expect(await readFile(path.join(root, ".env.local"), "utf8")).toContain("/private/shared-ledger.json");
            await expect(prepareRetrievalScenario(root, "context-01")).rejects.toThrow("already exists");
        } finally { await rm(root, {recursive: true, force: true}); }
    });

    it("refuses dirty input and path-like identifiers before making a worktree", async () => {
        const {root} = await repository();
        try {
            await expect(prepareRetrievalScenario(root, "../outside")).rejects.toThrow("lowercase ID");
            await writeFile(path.join(root, "src/lib/help-chat-config.ts"), "local work\n");
            await expect(prepareRetrievalScenario(root, "context-02")).rejects.toThrow("local changes");
            expect(execFileSync("git", ["-C", root, "worktree", "list", "--porcelain"], {encoding: "utf8"}).match(/^worktree /gm)).toHaveLength(1);
        } finally { await rm(root, {recursive: true, force: true}); }
    });
});

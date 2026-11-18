import {spawnSync} from "node:child_process";
import path from "node:path";
import {labRoot} from "../store";

const args = process.argv.slice(2);
const index = args.indexOf("--product");
const selected = index < 0 ? "." : args[index + 1];
if (!selected || selected.startsWith("--")) {
    console.error("Provide a product directory after --product.");
    process.exitCode = 1;
} else {
    const root = path.resolve(labRoot, "../..");
    const product = path.resolve(selected);
    // Resolve product aliases inside the selected worktree during this single measurement.
    const result = spawnSync(process.execPath, [
        path.join(root, "node_modules/tsx/dist/cli.mjs"),
        "--tsconfig", path.join(product, "tsconfig.json"),
        path.join(labRoot, "retrieval/check.ts"), ...args,
    ], {cwd: root, env: process.env, stdio: "inherit"});
    if (result.error) console.error(result.error.message);
    process.exitCode = result.status ?? 1;
}

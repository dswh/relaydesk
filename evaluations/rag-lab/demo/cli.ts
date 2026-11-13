import { config as env } from "dotenv";
import {exportDemo} from "./export";
import { closeDatabase } from "../../../src/lib/db";
import { prepareDemo, runDemo, demoState, addDemoQuestion, reviewDemo, watchDemo } from "./runner";
env({ path: ".env.local", quiet: true });
const [command = "help", ...args] = process.argv.slice(2);
const value = (name: string) => { const i = args.indexOf(`--${name}`); if (i < 0 || !args[i + 1])
    throw new Error(`Provide --${name}.`); return args[i + 1]!; };
async function main() {
    let result: unknown;
    if(command==="export")result=await exportDemo(value("id"),value("out"));
    else if (command === "prepare")
        result = await prepareDemo(value("id"));
    else if (command === "watch") {
        const state=await watchDemo(value("id"),{once:args.includes("--once"),answers:!args.includes("--retrieval-only")});
        if(state)console.info(JSON.stringify(state,null,2));
        return;
    }
    else if (command === "run")
        result = await runDemo(value("id"), { answers: !args.includes("--retrieval-only") });
    else if (command === "status")
        result = await demoState(args.includes("--id") ? value("id") : undefined);
    else if (command === "add-question")
        result = await addDemoQuestion(value("id"), value("file"));
    else if (command === "accept" || command === "reject")
        result = await reviewDemo(value("id"), command === "accept",{reviewer:value("reviewer"),reviewerType:value("reviewer-type"),rationale:value("reason")});
    else
        result = { commands: ["prepare --id <run-id>", "run --id <run-id> [--retrieval-only]", "status [--id <run-id>]", "watch --id <run-id> [--once] [--retrieval-only]", "add-question --id <run-id> --file <question.json>", "accept|reject --id <run-id> --reviewer <name> --reviewer-type human|assistant --reason <review-rationale>", "export --id <run-id> --out docs/evidence/<directory>"], scope: "Retrieval-ranking proof. Answer quality remains unscored until human review and judge calibration." };
    console.info(JSON.stringify(result, null, 2));
    if ((result as {
        phase?: string;
    })?.phase === "needs_input")
        process.exitCode = 2;
}
main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; }).finally(closeDatabase);


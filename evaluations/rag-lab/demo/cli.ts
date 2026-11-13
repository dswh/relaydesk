import { config as env } from "dotenv";
import { closeDatabase } from "../../../src/lib/db";
import { prepareDemo, runDemo, demoState, addDemoQuestion, reviewDemo, watchDemo } from "./runner";
env({ path: ".env.local", quiet: true });
const [command = "help", ...args] = process.argv.slice(2);
const value = (name: string) => { const i = args.indexOf(`--${name}`); if (i < 0 || !args[i + 1])
    throw new Error(`Provide --${name}.`); return args[i + 1]!; };
async function main() {
    let result: unknown;
    if (command === "prepare")
        result = await prepareDemo(value("id"));
    else if (command === "watch") {
        await watchDemo(value("id"));
        return;
    }
    else if (command === "run")
        result = await runDemo(value("id"), { answers: !args.includes("--retrieval-only") });
    else if (command === "status")
        result = await demoState(args.includes("--id") ? value("id") : undefined);
    else if (command === "add-question")
        result = await addDemoQuestion(value("id"), value("file"));
    else if (command === "accept" || command === "reject")
        result = await reviewDemo(value("id"), command === "accept");
    else
        result = { commands: ["prepare --id <run-id>", "run --id <run-id>", "status", "add-question --id <run-id> --file evaluations/rag-lab/demo/new-question.json", "accept --id <run-id>", "reject --id <run-id>"], scope: "Retrieval-ranking proof. Answer quality remains unscored until human review and judge calibration." };
    console.info(JSON.stringify(result, null, 2));
    if ((result as {
        phase?: string;
    })?.phase === "needs_input")
        process.exitCode = 2;
}
main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; }).finally(closeDatabase);


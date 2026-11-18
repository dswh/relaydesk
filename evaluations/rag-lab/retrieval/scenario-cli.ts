import path from "node:path";
import {prepareRetrievalScenario} from "./scenario";

const args = process.argv.slice(2);
const index = args.indexOf("--id");
const id = index >= 0 ? args[index + 1] : undefined;
if (!id) {
    console.error("Use pnpm rag:scenario --id <new-id>.");
    process.exitCode = 1;
} else {
    prepareRetrievalScenario(path.resolve("."), id).then(result => console.info(JSON.stringify(result, null, 2))).catch(error => {
        console.error(error instanceof Error ? error.message : "Scenario preparation failed.");
        process.exitCode = 1;
    });
}

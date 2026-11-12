import { loadHelpChatDataset } from "../help-chat/dataset";
import path from "node:path";

export const loadLabTasks = () => loadHelpChatDataset(process.env.RELAYDESK_RAG_DATASET_FILE || path.join(import.meta.dirname,"questions.yaml"));

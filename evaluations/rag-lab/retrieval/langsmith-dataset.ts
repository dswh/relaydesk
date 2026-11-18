import type { Client } from "langsmith";

import { connection, stableId } from "../langsmith";
import { sha } from "../store";
import { questionSchema, questionsSchema, type RetrievalQuestion } from "./contract";

async function listQuestions(client: Client, datasetId: string) {
  const questions: RetrievalQuestion[] = [];
  for await (const example of client.listExamples({ datasetId })) {
    questions.push(questionSchema.parse({
      id: example.inputs.caseId,
      family: example.inputs.family,
      question: example.inputs.question,
      followUp: example.inputs.followUp,
      expectedSource: example.outputs?.expectedSource,
    }));
  }
  return questions.sort((a, b) => a.id.localeCompare(b.id));
}

export async function readRetrievalDataset(client: Client, name: string) {
  const dataset = await client.readDataset({ datasetName: name });
  return questionsSchema.parse(await listQuestions(client, dataset.id));
}

export async function publishRetrievalDataset(questions: RetrievalQuestion[]) {
  const { client, agent } = connection()!;
  const ordered = [...questions].sort((a, b) => a.id.localeCompare(b.id));
  const hash = sha(ordered);
  const name = `relaydesk-retrieval-${hash.slice(0, 12)}`;
  let dataset;
  if (await client.hasDataset({ datasetName: name })) {
    dataset = await client.readDataset({ datasetName: name });
  } else {
    const tag = agent ? (await client.agents.retrieve(agent)).tag_value_id : undefined;
    dataset = await client.createDataset(name, {
      description: "Synthetic RelayDesk search questions and their expected approved articles.",
      metadata: { datasetHash: hash },
      tagValueIds: tag ? [tag] : undefined,
    });
  }

  const byId = new Map(ordered.map((question) => [question.id, question]));
  const existing = await listQuestions(client, dataset.id);
  if (existing.some((question) => {
    const original = byId.get(question.id);
    return !original || sha(question) !== sha(original);
  })) {
    throw new Error("The LangSmith dataset differs from this version of the question set.");
  }
  const present = new Set(existing.map((question) => question.id));
  if (present.size !== existing.length) throw new Error("The LangSmith dataset has duplicate case IDs.");
  const missing = ordered.filter((question) => !present.has(question.id));
  if (missing.length) {
    await client.createExamples(missing.map(({ id, family, question, followUp, expectedSource }) => ({
      id: stableId(`${dataset.id}:${id}`),
      dataset_id: dataset.id,
      inputs: { caseId: id, family, question, ...(followUp ? { followUp } : {}) },
      outputs: { expectedSource },
      metadata: { synthetic: true },
    })));
  }
  const published = await readRetrievalDataset(client, name);
  if (sha(published) !== hash) throw new Error("The published question set could not be verified.");
  return { name, examples: published.length, url: await client.getDatasetUrl({ datasetId: dataset.id }) };
}

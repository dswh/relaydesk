import { query } from "../../src/lib/db";
import { publicKnowledgeArticles } from "../../src/lib/knowledge";
import { sha } from "./store";

export async function corpusSnapshot(embeddingModel: string) {
  const documents = await query<{id:string;content_hash:string}>("select id, content_hash from help_knowledge_documents where visibility='public' and status='approved' order by id");
  const expected = new Map(publicKnowledgeArticles.map(a=>[a.id,sha(a)]));
  if(documents.rows.length!==expected.size||documents.rows.some(d=>expected.get(d.id)!==d.content_hash))throw new Error("The approved source files and vector index differ. Reindex before establishing a new baseline.");
  const chunks = await query("select id, source_id, heading, content, embedding_model, md5(embedding::text) as vector_hash from help_knowledge_chunks order by id");
  if(!chunks.rows.length||chunks.rows.some(c=>c.embedding_model!==embeddingModel))throw new Error("The vector index and query embedding models differ. Reindex before capture.");
  return {hash:sha({documents:documents.rows,chunks:chunks.rows}),documents:documents.rows.length,chunks:chunks.rows.length};
}

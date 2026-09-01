import { query } from "@/lib/db";
import { createHelpEmbedding, vectorLiteral } from "@/lib/ai/help-embeddings";
import {
  getHelpChatConfig,
  type HelpChatConfig,
} from "@/lib/help-chat-config";

export type RetrievedHelpChunk = {
  collection: string;
  content: string;
  documentId: string;
  heading: string;
  score: number;
  slug: string;
  sourceId: string;
  title: string;
};

type RetrievedHelpChunkRow = {
  collection: string;
  content: string;
  document_id: string;
  heading: string;
  score: number | string;
  slug: string;
  source_id: string;
  title: string;
};

export async function retrieveHelpKnowledge(
  searchText: string,
  config: HelpChatConfig = getHelpChatConfig(),
): Promise<RetrievedHelpChunk[]> {
  const embedded = await createHelpEmbedding(searchText, config);
  const result = await query<RetrievedHelpChunkRow>(
    `
      with ranked as (
        select
          c.document_id,
          c.source_id,
          c.heading,
          c.content,
          d.slug,
          d.title,
          d.collection,
          1 - (c.embedding <=> $1::vector) as vector_similarity,
          ts_rank_cd(c.search_vector, websearch_to_tsquery('english', $2)) as lexical_rank
        from help_knowledge_chunks c
        join help_knowledge_documents d on d.id = c.document_id
        where d.visibility = 'public'
          and d.status = 'approved'
          and c.embedding_model = $3
      )
      select
        document_id,
        source_id,
        heading,
        content,
        slug,
        title,
        collection,
        ($4::double precision * vector_similarity) +
          ($5::double precision * (lexical_rank / (1 + lexical_rank))) as score
      from ranked
      order by score desc, source_id, heading
      limit $6
    `,
    [
      vectorLiteral(embedded.vector),
      searchText,
      embedded.model,
      config.vectorWeight,
      config.lexicalWeight,
      config.topK,
    ],
  );

  return result.rows.map((row) => ({
    collection: row.collection,
    content: row.content,
    documentId: row.document_id,
    heading: row.heading,
    score: Number(row.score),
    slug: row.slug,
    sourceId: row.source_id,
    title: row.title,
  }));
}

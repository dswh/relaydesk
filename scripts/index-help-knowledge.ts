import { createHash } from "node:crypto";
import { Pool } from "pg";

import { createHelpEmbeddings, vectorLiteral } from "../src/lib/ai/help-embeddings";
import { getHelpChatConfig } from "../src/lib/help-chat-config";
import { publicKnowledgeArticles } from "../src/lib/knowledge";
import { requireDatabaseUrl } from "./database-environment";

const pool = new Pool({ connectionString: requireDatabaseUrl() });

function articleHash(article: (typeof publicKnowledgeArticles)[number]) {
  return createHash("sha256").update(JSON.stringify(article)).digest("hex");
}

function articleChunks(article: (typeof publicKnowledgeArticles)[number]) {
  return article.sections.map((section, index) => ({
    content: [
      article.title,
      article.description,
      `Keywords: ${article.keywords.join(", ")}`,
      section.heading,
      ...section.paragraphs,
      ...(section.steps ?? []),
    ].join("\n"),
    heading: section.heading,
    index,
  }));
}

async function indexKnowledge() {
  const config = getHelpChatConfig();
  const client = await pool.connect();

  try {
    await client.query("begin");
    let chunkCount = 0;

    for (const article of publicKnowledgeArticles) {
      const hash = articleHash(article);
      const chunks = articleChunks(article);
      const embedded = await createHelpEmbeddings(
        chunks.map((chunk) => chunk.content),
        config,
      );

      await client.query(
        `
          insert into help_knowledge_documents (
            id, slug, title, collection, visibility, status, content_hash,
            updated_at, metadata, indexed_at
          ) values ($1, $2, $3, $4, 'public', 'approved', $5, $6, $7::jsonb, now())
          on conflict (id) do update set
            slug = excluded.slug,
            title = excluded.title,
            collection = excluded.collection,
            visibility = excluded.visibility,
            status = excluded.status,
            content_hash = excluded.content_hash,
            updated_at = excluded.updated_at,
            metadata = excluded.metadata,
            indexed_at = now()
        `,
        [
          article.id,
          article.slug,
          article.title,
          article.collection,
          hash,
          article.updatedAt,
          JSON.stringify({ publishedAt: article.publishedAt }),
        ],
      );

      await client.query("delete from help_knowledge_chunks where document_id = $1", [article.id]);

      for (const [index, chunk] of chunks.entries()) {
        const vector = embedded.vectors[index];
        if (!vector) throw new Error(`Embedding missing for ${article.id} chunk ${index}.`);

        await client.query(
          `
            insert into help_knowledge_chunks (
              id, document_id, source_id, heading, content, chunk_index,
              embedding_model, embedding, metadata
            ) values ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9::jsonb)
          `,
          [
            `${article.id}:${index}:${hash.slice(0, 12)}`,
            article.id,
            article.id,
            chunk.heading,
            chunk.content,
            index,
            embedded.model,
            vectorLiteral(vector),
            JSON.stringify({ contentHash: hash, sectionIndex: index }),
          ],
        );
        chunkCount += 1;
      }
    }

    await client.query("analyze help_knowledge_chunks");
    await client.query("commit");
    console.info(
      `Indexed ${chunkCount} approved public chunks with ${config.embeddingModel}.`,
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await indexKnowledge();
} finally {
  await pool.end();
}

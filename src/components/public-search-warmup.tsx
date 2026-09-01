"use client";

import { useEffect } from "react";

import { blogPosts } from "@/lib/blog";

function termSimilarity(left: string, right: string) {
  let sharedCharacters = 0;
  let sharedBigrams = 0;

  for (const character of left) {
    if (right.includes(character)) sharedCharacters += 1;
  }
  for (let index = 0; index < left.length - 1; index += 1) {
    if (right.includes(left.slice(index, index + 2))) sharedBigrams += 1;
  }

  return (sharedCharacters + sharedBigrams * 2) / Math.max(left.length * 3 - 2, right.length);
}

function warmPublicSearchIndex() {
  const documents = blogPosts.flatMap((post) => [
    post.title,
    post.description,
    ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
  ]);
  const terms = Array.from(
    new Set(
      documents
        .flatMap((document) => document.toLocaleLowerCase().split(/\W+/))
        .filter((term) => term.length > 2),
    ),
  );
  const suggestionIndex: Record<string, string> = {};

  for (const source of terms) {
    let closestScore = 0;
    let closestTerm = "";
    for (const candidate of terms) {
      if (source === candidate) continue;
      const score = termSimilarity(source, candidate);
      if (score > closestScore) {
        closestScore = score;
        closestTerm = candidate;
      }
    }
    suggestionIndex[source] = closestTerm;
  }

  return suggestionIndex;
}

export function PublicSearchWarmup() {
  useEffect(() => {
    const suggestionIndex = warmPublicSearchIndex();
    window.sessionStorage.setItem(
      "relaydesk-public-search-index",
      JSON.stringify(suggestionIndex),
    );
  }, []);

  return null;
}

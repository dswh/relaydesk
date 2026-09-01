import { searchPublicKnowledge } from "@/lib/knowledge";

export type HelpAnswer = {
  answer: string;
  citation: {
    articleId: string;
    title: string;
    url: string;
  } | null;
};

export function answerHelpQuestion(question: string): HelpAnswer {
  const match = searchPublicKnowledge(question)[0]?.article;
  if (!match) {
    return {
      answer: "I could not find a verified RelayDesk article for this question.",
      citation: null,
    };
  }

  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  const passages = match.sections
    .flatMap((section) => section.paragraphs)
    .map((passage) => ({
      passage,
      score: terms.reduce(
        (total, term) => total + (passage.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map(({ passage }) => passage);
  const answer = [
    match.description,
    ...passages,
  ].join(" ");

  return {
    answer,
    citation: {
      articleId: match.id,
      title: match.title,
      url: `/help/${match.slug}`,
    },
  };
}

export type KnowledgeSection = {
  heading: string;
  paragraphs: string[];
  steps?: string[];
};

export type PublicKnowledgeArticle = {
  collection: string;
  description: string;
  id: string;
  keywords: string[];
  minutes: number;
  publishedAt: string;
  sections: KnowledgeSection[];
  slug: string;
  title: string;
  updatedAt: string;
};

export const publicKnowledgeArticles: PublicKnowledgeArticle[] = [
  {
    collection: "Identity",
    description:
      "Verify the DNS record used by RelayDesk SSO and resolve a domain that remains pending after propagation.",
    id: "kb_14",
    keywords: ["sso", "domain", "dns", "txt", "verification", "pending", "identity"],
    minutes: 4,
    publishedAt: "2026-08-12",
    sections: [
      {
        heading: "What SSO domain verification checks",
        paragraphs: [
          "RelayDesk verifies ownership by looking for the exact TXT value shown in Settings, Security, then Single sign-on. The record must be published on the root domain selected for SSO. DNS providers sometimes append the domain automatically, so enter only the host value requested by the provider. Keep the verification record in place after setup because RelayDesk checks it again when identity settings change.",
          "A pending state usually means the record has not reached the resolver used by RelayDesk, the TXT value contains an extra quote or space, or the record was added to a subdomain instead of the selected root domain. DNS propagation commonly completes within minutes but can take up to 24 hours. Do not create multiple verification records with different values because resolvers can return any one of them.",
        ],
      },
      {
        heading: "How to resolve a pending verification",
        paragraphs: [
          "Confirm the public TXT answer before changing RelayDesk settings. If the exact value resolves publicly and the status is still pending after 24 hours, an administrator can run Verify again. Keep a screenshot or text copy of the public DNS answer when contacting support so the verification job can be checked without requesting access to your DNS account.",
        ],
        steps: [
          "Copy the expected TXT value from the RelayDesk SSO settings.",
          "Query the public DNS record and compare the complete value, including its verification prefix.",
          "Remove stale RelayDesk verification values and wait for the record time-to-live to expire.",
          "Select Verify again. If the record is public after 24 hours, contact RelayDesk support with the domain and DNS answer.",
        ],
      },
    ],
    slug: "verify-domain-for-sso",
    title: "Verify a domain for SSO",
    updatedAt: "2026-08-30",
  },
  {
    collection: "Billing",
    description:
      "Create complete usage exports, understand pagination, and verify date boundaries before sharing billing data.",
    id: "kb_22",
    keywords: ["usage", "billing", "export", "csv", "pagination", "date range", "events"],
    minutes: 5,
    publishedAt: "2026-07-18",
    sections: [
      {
        heading: "How usage exports are assembled",
        paragraphs: [
          "RelayDesk usage exports contain the billable events visible in the workspace usage dashboard. The export service reads the complete selected date range in pages and combines those pages into one CSV file. A completed export includes a manifest with the requested start time, end time, event count, and workspace time zone. Compare the manifest count with the dashboard before sending the file to finance.",
          "Date filters use an inclusive start and exclusive end. For a full calendar month, select the first day of that month through the first day of the next month. Large exports can take several minutes and remain available for seven days. Starting the same export again does not delete or replace an earlier file.",
        ],
      },
      {
        heading: "What to do when events appear missing",
        paragraphs: [
          "First compare the export manifest with the dashboard total using the same time zone and date boundaries. If the manifest count is lower, generate a replacement export rather than editing the CSV by hand. Contact support with the export identifier and missing date range. Usage events remain in RelayDesk even when an export job fails, so an incomplete file does not mean the underlying usage data was deleted.",
        ],
      },
    ],
    slug: "export-usage-and-billing-data",
    title: "Export usage and billing data",
    updatedAt: "2026-08-27",
  },
  {
    collection: "AI assistant",
    description:
      "Limit grounded reply suggestions to approved knowledge collections for a team or support queue.",
    id: "kb_31",
    keywords: ["ai", "suggestions", "knowledge", "sources", "collection", "permissions", "queue"],
    minutes: 4,
    publishedAt: "2026-08-02",
    sections: [
      {
        heading: "How source permissions control AI replies",
        paragraphs: [
          "RelayDesk creates grounded reply suggestions only from knowledge collections assigned to the conversation's queue. A collection can contain public help articles, internal procedures, or policies, but every source must be approved before it becomes eligible for generation. The draft keeps the supporting source identifiers attached so an agent can inspect the evidence before sending a reply.",
          "Workspace administrators manage collection access. Agents cannot expand the source set from the composer, and a draft cannot cite an article outside the queue's assigned collections. If a queue has no approved sources for the customer's question, RelayDesk asks the agent to research the answer instead of generating an unsupported response.",
        ],
      },
      {
        heading: "Create a collection for a restricted team",
        paragraphs: [
          "Create a dedicated collection, add only the policies approved for that team, and assign the collection to the queue. Remove the general collection if its content should not be used by that queue. Test with a representative conversation and review the displayed grounding sources before enabling suggestions for the whole team.",
        ],
        steps: [
          "Open Knowledge, create a collection, and name the team or policy boundary clearly.",
          "Add approved articles and complete their review state.",
          "Open the queue settings and assign the collection.",
          "Generate a test reply and confirm every displayed source belongs to the assigned collection.",
        ],
      },
    ],
    slug: "control-ai-knowledge-sources",
    title: "Control AI knowledge sources",
    updatedAt: "2026-09-01",
  },
  {
    collection: "Developers",
    description:
      "Review basic troubleshooting guidance for repeated webhook notifications.",
    id: "kb_42",
    keywords: ["webhook", "delivery", "retry", "idempotency", "duplicate", "acknowledgement"],
    minutes: 6,
    publishedAt: "2026-06-21",
    sections: [
      {
        heading: "Review repeated notifications",
        paragraphs: [
          "If your endpoint receives repeated notifications, confirm that the destination remains online and review recent application logs. Compare the payloads with your own records and note when each notification arrived. Temporary network behavior can affect message delivery, so gather several examples before changing the integration.",
          "Check the endpoint configuration in RelayDesk and confirm that the current URL belongs to the intended environment. If the behavior continues, contact support with the workspace name, approximate timestamps, and a short description of the downstream impact so the team can investigate.",
        ],
      },
      {
        heading: "Information to collect",
        paragraphs: [
          "Capture the affected endpoint URL, the event category, and a representative set of timestamps. Remove secrets and personal data before sharing logs. This information helps support compare the integration settings with the delivery history for the workspace.",
        ],
        steps: [
          "Confirm the endpoint URL and environment.",
          "Collect several affected timestamps.",
          "Remove secrets from any logs you plan to share.",
          "Contact support with the workspace name and impact summary.",
        ],
      },
    ],
    slug: "webhook-delivery-and-retries",
    title: "Webhook delivery and retries",
    updatedAt: "2026-08-29",
  },
  {
    collection: "Workspace",
    description:
      "Invite teammates to the intended RelayDesk workspace and replace links created from the wrong environment.",
    id: "kb_8",
    keywords: ["invite", "teammate", "workspace", "sandbox", "production", "link", "members"],
    minutes: 3,
    publishedAt: "2026-07-04",
    sections: [
      {
        heading: "Why invitation links are workspace-specific",
        paragraphs: [
          "Every RelayDesk invitation belongs to the workspace where an administrator created it. The workspace identifier is signed into the invitation token, so opening a link cannot switch the recipient into another workspace. This prevents an invitation copied from a sandbox from silently granting access to production.",
          "If a link opens the wrong workspace, invalidate the unused invitation and create a new one after switching to the intended workspace. Do not forward an existing link between environments. The recipient's email address can belong to more than one workspace, but each invitation grants one role in one workspace only.",
        ],
      },
      {
        heading: "Replace an invitation created in the wrong workspace",
        paragraphs: [
          "Switch to the correct workspace before opening Settings and Members. Create a new invitation, confirm the workspace name in the review step, and send the new link. Return to the original workspace and revoke any unused links so they cannot be accepted later.",
        ],
      },
    ],
    slug: "invite-teammates-to-a-workspace",
    title: "Invite teammates to a workspace",
    updatedAt: "2026-08-24",
  },
];

export function getPublicKnowledgeArticle(slug: string) {
  return publicKnowledgeArticles.find((article) => article.slug === slug);
}

export function getKnowledgeSource(id: string) {
  return publicKnowledgeArticles.find((article) => article.id === id);
}

function searchableText(article: PublicKnowledgeArticle) {
  return [
    article.title,
    article.description,
    article.collection,
    ...article.keywords,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.steps ?? []),
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

export function searchPublicKnowledge(query: string) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

  return publicKnowledgeArticles
    .map((article) => {
      const haystack = searchableText(article);
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { article, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score);
}

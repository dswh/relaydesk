export type BlogTable = {
  headers: string[];
  rows: string[][];
};

export type BlogSection = {
  bullets?: string[];
  code?: string;
  heading: string;
  paragraphs: string[];
  table?: BlogTable;
};

export type BlogPost = {
  author: string;
  category: string;
  description: string;
  featured?: boolean;
  id: string;
  publishedAt: string;
  readingMinutes: number;
  sections: BlogSection[];
  slug: string;
  takeaways: string[];
  title: string;
  updatedAt: string;
};

export const blogPosts: BlogPost[] = [
  {
    author: "Mara Ellis",
    category: "Support operations",
    description:
      "A practical blueprint for turning queues, knowledge, automation, and human judgment into one measurable support operating system.",
    featured: true,
    id: "blog_1",
    publishedAt: "2026-08-05",
    readingMinutes: 12,
    slug: "designing-a-support-operations-system",
    takeaways: [
      "Model the decision path, not only the ticket lifecycle.",
      "Give every queue an owner, a service promise, and an evidence policy.",
      "Measure speed together with correctness, customer effort, and repeat work.",
    ],
    title: "Designing a support operations system that scales with judgment",
    updatedAt: "2026-08-30",
    sections: [
      {
        heading: "A queue is not an operating system",
        paragraphs: [
          "Most support teams begin with a queue, a set of macros, and a few dashboards. That is enough while the product is simple and the people who built it are sitting close to the customers. It stops being enough when channels multiply, ownership becomes ambiguous, and the same question receives a different answer depending on which agent opens it. The queue records demand, but it does not define how the organization should make a reliable decision.",
          "An operating system connects the signal to the accountable next action. It defines what context should arrive with a conversation, which evidence an agent may trust, who owns a decision, what service promise applies, and how the outcome returns to the product team. The objective is not maximum automation. The objective is a repeatable path from customer uncertainty to a defensible response, with enough evidence that another person can understand what happened later.",
        ],
      },
      {
        heading: "Start with the decision path",
        paragraphs: [
          "Map one high-volume request from arrival to resolution. Write down the customer signal, the account context required to interpret it, the policy or product knowledge used, the person allowed to act, and the evidence that proves the action succeeded. This exercise usually exposes invisible handoffs. An agent may need to search three tools, ask an engineer for state, and copy a private message into the ticket before replying. Each handoff adds delay and creates another place where meaning can be lost.",
          "Then separate facts from decisions. Facts include plan, region, feature state, recent events, and contract terms. Decisions include priority, escalation, workaround, and the wording of the response. Facts should be joined automatically when possible. Decisions should carry explicit policy and ownership. When the distinction is clear, automation can collect evidence without silently taking authority that belongs to a person. This is the foundation for safe agentic support systems.",
        ],
        bullets: [
          "Capture the minimum facts required to understand the request.",
          "Name the policy or source that constrains the response.",
          "Assign one owner for the next action and one observable completion signal.",
        ],
      },
      {
        heading: "Design queues around service promises",
        paragraphs: [
          "A useful queue is more than a filter. It represents a service promise for a recognizable class of work. An identity queue might promise a first response within one hour and require evidence from approved setup documentation. A billing queue might allow only a smaller group to issue corrections. A developer queue may need request identifiers and logs before an escalation is accepted. These differences belong in the operating model, not in tribal knowledge passed between agents.",
          "Give each queue an entry rule, an owner, a response target, a resolution definition, and an escalation path. Keep the number of queues small enough that routing remains understandable. If a conversation could reasonably belong in five places, the taxonomy is serving the reporting system rather than the customer. The strongest teams use queues to focus expertise and authority, then use tags and analytics for secondary classification.",
        ],
        table: {
          headers: ["Queue element", "Question it answers", "Example"],
          rows: [
            ["Entry rule", "Why is this work here?", "SSO, SCIM, or workspace access"],
            ["Service promise", "How quickly will we respond?", "One-hour first response"],
            ["Evidence policy", "What may support the answer?", "Approved identity collection"],
            ["Completion signal", "How do we know it worked?", "Verification status becomes active"],
          ],
        },
      },
      {
        heading: "Put knowledge at the point of decision",
        paragraphs: [
          "A knowledge base only improves support when the right source appears during the decision. Search quality matters, but source governance matters just as much. Every operational answer should make it possible to identify where the claim came from, how recently that source was reviewed, and whether the source applies to the customer in front of the agent. A highly ranked article from the wrong plan or region is still a poor answer.",
          "Treat knowledge as a controlled input. Create collections for product guidance, policies, incident procedures, and internal runbooks. Attach ownership and review dates. Limit sensitive collections to the queues that need them. When an AI system drafts a response, preserve the source identifiers with the draft so the agent can inspect the evidence before sending. This makes speed compatible with review instead of asking the team to choose between them.",
        ],
      },
      {
        heading: "Measure the system, not one team",
        paragraphs: [
          "First-response time is useful, but it can reward fast acknowledgment without useful progress. Resolution time can punish teams that correctly wait for a customer or a third party. Customer satisfaction is valuable, but sparse responses make it a noisy operational signal. A balanced scorecard combines service speed, decision quality, repeat contact, customer effort, and the amount of work that returns because the first resolution was incomplete.",
          "Instrument the path between those measures. Track how often agents find an approved source, how often a draft is heavily edited, which queues exceed their service promise, and which contact reasons lead to another ticket within seven days. These signals show where the system is weak. A slow queue may need staffing, but it may also need better context, a clearer policy, or a product fix that removes the demand entirely.",
        ],
        table: {
          headers: ["Metric", "Useful question", "Common misread"],
          rows: [
            ["First response", "Did the customer receive useful direction quickly?", "Treating any acknowledgment as progress"],
            ["Repeat contact", "Did the first resolution hold?", "Blaming the agent without checking product defects"],
            ["Source coverage", "Could the team find approved evidence?", "Assuming more articles always improve coverage"],
            ["Edit distance", "How much did the agent change the draft?", "Treating a low edit rate as automatic quality"],
          ],
        },
      },
      {
        heading: "Improve through bounded loops",
        paragraphs: [
          "Once the operating model is explicit, improvement can happen through bounded loops. Choose one measurable failure, freeze the evaluator, make one evidence-backed change, and run the same evaluation again. A database loop can target queue latency. A content loop can target answer coverage and citations. A prompt loop can target groundedness and required actions. The scope stays small enough to understand, while the evaluator prevents the work from drifting toward a visually impressive but unmeasured result.",
          "A strong stop condition protects the system. It should include the primary target and the qualities that must not regress. Improving page speed should not remove accessible navigation. Improving response speed should not reduce citation accuracy. Improving routing should not send sensitive work to a broader team. The final artifact is not only a changed implementation. It is a before-and-after record that explains why the change is trustworthy and when the same loop should run again.",
        ],
      },
    ],
  },
  {
    author: "Noah Williams",
    category: "Service design",
    description:
      "Reduce first-response time by removing uncertainty and handoffs while protecting answer quality and customer trust.",
    id: "blog_2",
    publishedAt: "2026-07-22",
    readingMinutes: 10,
    slug: "reduce-first-response-time-without-sacrificing-quality",
    takeaways: [
      "Measure useful first response, not acknowledgement speed.",
      "Join account context before asking agents to search for it.",
      "Use queues and escalation rules to remove ownership ambiguity.",
    ],
    title: "Reduce first-response time without sacrificing answer quality",
    updatedAt: "2026-08-26",
    sections: [
      {
        heading: "Define a useful first response",
        paragraphs: [
          "A fast first response matters because uncertainty is expensive for customers. The metric becomes harmful when teams optimize it by sending a greeting that contains no diagnosis, next action, or expectation. That message may stop a timer while leaving the customer in exactly the same position. Before changing staffing or automation, define what counts as useful progress for each major contact reason.",
          "For a simple request, a useful response may solve the problem immediately. For an incident, it may confirm impact, identify the owner, request one missing diagnostic, and provide the next update time. For a policy question, it should answer from the current approved source and explain any constraint. This definition lets the team improve speed without treating every conversation as interchangeable.",
        ],
      },
      {
        heading: "Measure where the minutes go",
        paragraphs: [
          "Split first-response time into waiting time and handling time. Waiting time reveals capacity, scheduling, and routing problems. Handling time reveals missing context, unclear policy, and tool friction. Looking only at the combined number can lead to the wrong intervention. Hiring more people will not fix a workflow where every identity question requires a manual database lookup and a private message to an engineer.",
          "Sample conversations from the slowest contact reasons and reconstruct the path an agent followed. Count searches, tool changes, internal questions, and moments where ownership changed. Record whether the needed evidence existed and whether it was discoverable. A small sample often reveals a repeated delay that can be removed for thousands of future conversations.",
        ],
        bullets: [
          "Separate queue wait from active handling time.",
          "Measure the number of handoffs and tool changes.",
          "Track which facts or approvals were missing at first touch.",
          "Confirm whether the first response created real customer progress.",
        ],
      },
      {
        heading: "Bring context to the conversation",
        paragraphs: [
          "Agents should not begin every ticket by reconstructing the customer. Join stable account facts such as plan, region, contract tier, enabled features, and recent service events before the conversation reaches the queue. Present those facts with timestamps and sources so the agent knows what is current. Context should shorten investigation, not create a new panel of unexplained data.",
          "Be selective. Too much context increases scanning time and can expose information that does not belong in the workflow. Start with the facts required by the most common decisions, then add evidence when a repeated gap appears. For example, an SSO queue may need domain state and verification history, while a billing queue needs export identifiers and invoice periods. The right context depends on the decision, not the availability of data.",
        ],
      },
      {
        heading: "Remove routing ambiguity",
        paragraphs: [
          "A conversation that moves between teams is waiting even when every team responds quickly. Define a small set of queues with clear entry rules and visible owners. When automation proposes a route, preserve the reason so an agent can correct it. Corrections should become evaluation examples, not disappear into a reporting label. The system improves when routing errors are treated as product feedback.",
          "Escalation should also be explicit. Define which evidence must accompany an escalation, who receives it, and what response the support agent can give while the investigation continues. This prevents the familiar pattern where a ticket is transferred to engineering with no usable context and the customer receives repeated requests for information already provided.",
        ],
        table: {
          headers: ["Delay", "Operational signal", "Likely intervention"],
          rows: [
            ["Long queue wait", "Backlog grows by hour or region", "Coverage or routing change"],
            ["Long handling", "Many searches and tool changes", "Context join or knowledge repair"],
            ["Repeated transfers", "Ownership changes before first action", "Queue and escalation redesign"],
            ["Fast reply, repeat contact", "Customer returns with same issue", "Raise the useful-response standard"],
          ],
        },
      },
      {
        heading: "Use automation as preparation",
        paragraphs: [
          "Automation is most reliable when it prepares a decision. It can summarize the conversation, retrieve approved sources, identify missing evidence, and draft a response that cites its inputs. The agent remains responsible for checking whether the evidence applies and whether the proposed action is allowed. This division removes repetitive work without hiding judgment inside an opaque workflow.",
          "Evaluate automation on more than acceptance rate. A draft that agents send unchanged can still be wrong. Measure citation precision, required-action recall, policy compliance, and repeat contact after the response. Review cases where agents made large edits, because those changes often reveal missing context or a weak source. The improvement loop should repair the system that produced the draft, not pressure agents to accept it.",
        ],
      },
      {
        heading: "Run a controlled improvement cycle",
        paragraphs: [
          "Freeze a representative set of conversations and record the current response times, quality checks, and repeat-contact rate. Choose one bottleneck, make one change, and rerun the same evaluation. If the change reduces handling time but lowers source coverage, it has not passed. If it helps only one queue while creating transfers elsewhere, the system needs another design.",
          "Roll out a successful change gradually and compare similar cohorts. Keep a visible rollback point. Explain the mechanism behind the gain so the team can recognize when conditions change. Sustainable speed comes from removing uncertainty and repeated work. It does not come from asking people to type faster or rewarding them for closing the timer before the customer has a useful next step.",
        ],
      },
      {
        heading: "Protect the improvement after launch",
        paragraphs: [
          "A faster workflow can drift as products, teams, and contact reasons change. Keep the evaluator close to the operating process. Review the slowest tail each week, compare the mix of work, and watch whether new tools add searches or handoffs that were not present in the original baseline. Recheck the definition of a useful first response when policy or customer expectations change. The target should remain stable during an improvement cycle, but the operating contract still needs deliberate review over time.",
          "Share the before-and-after evidence with agents and partner teams. Explain which delay was removed and which quality measures protected the result. This prevents a local improvement from being mistaken for a general instruction to respond faster. It also gives the team language for identifying the next constraint. Sustainable performance comes from a sequence of understood system changes, each with an owner, a measurable result, and a way to detect regression.",
        ],
      },
    ],
  },
  {
    author: "Priya Raman",
    category: "Applied AI",
    description:
      "Build support reply systems that stay grounded in approved evidence, surface uncertainty, and remain measurable over time.",
    featured: true,
    id: "blog_3",
    publishedAt: "2026-07-10",
    readingMinutes: 12,
    slug: "building-grounded-ai-replies",
    takeaways: [
      "Retrieval quality and source governance are separate responsibilities.",
      "Preserve citations with every draft so humans can inspect the evidence.",
      "Use frozen cases, deterministic rules, and a blinded judge together.",
    ],
    title: "Building grounded AI replies that support teams can trust",
    updatedAt: "2026-08-28",
    sections: [
      {
        heading: "Grounding is a system property",
        paragraphs: [
          "A prompt that says be accurate does not make a support reply grounded. Grounding depends on the complete path from source approval to retrieval, prompt construction, generation, citation handling, agent review, and post-send evaluation. A failure at any stage can produce a confident answer that looks helpful but is not supported by the evidence available to the team.",
          "Treat the model as one component inside a controlled decision system. Define what sources are eligible, how they are selected for a conversation, which claims require citations, and what the model should do when evidence is missing. Preserve the source identifiers after generation. The agent should be able to inspect the exact material that supports a suggested action before sending it to a customer.",
        ],
      },
      {
        heading: "Govern the source set",
        paragraphs: [
          "A large knowledge base is not automatically a good grounding corpus. Old release notes, regional policies, internal discussion, and public instructions may contradict one another. Create approved collections with owners, review dates, audience labels, and product scope. Assign collections to teams or queues so a legal-support conversation cannot accidentally retrieve a general sales article as operational policy.",
          "Record why a source is approved and when it should be reviewed. Remove superseded documents from retrieval without deleting their audit history. If a source is sensitive, restrict both retrieval and display. Grounding should never become a path for exposing internal information simply because the text was available to an embedding job.",
        ],
        bullets: [
          "Give every source an owner and review date.",
          "Separate public guidance, internal procedures, and restricted policy.",
          "Filter by product, region, plan, and queue before semantic ranking.",
          "Keep source identifiers attached to generated drafts and evaluations.",
        ],
      },
      {
        heading: "Construct evidence before the prompt",
        paragraphs: [
          "Retrieve a small, relevant evidence set and make its boundaries obvious. Include stable identifiers, titles, applicable sections, and enough surrounding text to preserve meaning. Avoid assembling isolated sentences that remove a condition or exception. The prompt should distinguish customer-provided facts, system facts, and approved guidance so the model does not treat every piece of text as equally authoritative.",
          "Ask the generator to use only that evidence, state uncertainty when the evidence is incomplete, avoid inventing actions or timelines, and attach source markers to factual paragraphs. Make the output format simple enough to validate. A customer-ready answer plus a separate citation list is often easier to test and render than a large free-form object with many optional fields.",
        ],
        code: `Hard rules:\n- Use only the conversation and approved sources.\n- Do not invent actions, timelines, refunds, or investigation results.\n- State uncertainty when evidence is incomplete.\n- Cite every factual paragraph with an approved source identifier.`,
      },
      {
        heading: "Evaluate multiple dimensions",
        paragraphs: [
          "One aggregate score hides the reason a reply failed. Separate prompt integrity, hard-policy compliance, citation precision, required-action recall, and helpfulness. Deterministic checks should protect requirements that must never move. A model-based judge can assess clarity and completeness after those hard gates pass. This ordering prevents a fluent answer from compensating for an unsupported claim.",
          "Build a frozen set of conversations that represents different products, customer emotions, evidence shapes, and risk levels. Include cases where the correct behavior is to express uncertainty or ask for one missing fact. Keep the test data and thresholds fixed during the optimization loop. Otherwise the system can appear to improve because the evaluation moved closer to the latest output.",
        ],
        table: {
          headers: ["Metric", "Purpose", "Preferred evaluator"],
          rows: [
            ["Prompt integrity", "Required grounding rules remain present", "Deterministic assertion"],
            ["Citation precision", "Every cited source is approved", "Identifier comparison"],
            ["Action recall", "The answer includes required next steps", "Frozen phrase or semantic rubric"],
            ["Helpfulness", "The reply is clear and complete", "Blinded LLM judge"],
          ],
        },
      },
      {
        heading: "Design human review intentionally",
        paragraphs: [
          "A review button is not a review process. Show the evidence close to the draft, highlight the sources actually cited, and make uncertainty visible. Give the agent an easy way to reject the draft or report a weak source. Capture edits in a privacy-conscious form so recurring changes can become evaluation cases. The interface should help a person exercise judgment, not simply encourage acceptance.",
          "Match review depth to risk. A password-reset explanation and a contractual refund decision should not share the same approval path. High-risk actions may require a specialist or a structured confirmation. Lower-risk informational replies can move faster when citations and policy checks pass. The system should make authority explicit instead of assuming the model or the first agent owns every decision.",
        ],
      },
      {
        heading: "Operate the quality loop",
        paragraphs: [
          "Run deterministic evaluations on every change to prompts, retrieval, source content, and model configuration. Run live model evaluations across multiple uncached attempts before releases because generation is variable. Compare failures by metric and customer segment. A model change that improves average helpfulness but reduces citation precision for billing questions is not a safe global upgrade.",
          "In production, monitor source coverage, edit patterns, rejected drafts, policy incidents, and repeat contact. Feed representative failures back into the frozen suite only through a reviewed process. The goal is not a prompt that never changes. The goal is an evidence system where changes are bounded, measurable, and reversible, and where a support leader can explain why the current behavior is trusted.",
        ],
      },
      {
        heading: "Manage model and source change separately",
        paragraphs: [
          "A model upgrade and a knowledge change are different interventions. Test them separately so the team can understand which change produced a new behavior. Pin the model, provider settings, prompt, and source snapshot for release evaluation. When sources change frequently, record the identifiers and versions used by each case. Without that trace, a reply can regress and leave the team guessing whether generation, retrieval, or content caused the failure.",
          "Use a small canary before changing the default model or retrieval policy. Compare the same customer intents, review metric-level failures, and keep a rollback path. Cost and latency belong in the scorecard alongside answer quality because a system that is accurate but too slow or expensive may not support the intended workflow. The release decision should make those tradeoffs explicit rather than hiding them inside a provider change.",
        ],
      },
    ],
  },
  {
    author: "Theo Martin",
    category: "Developer experience",
    description:
      "A production playbook for signatures, acknowledgements, retries, idempotency, queues, and observable webhook recovery.",
    id: "blog_4",
    publishedAt: "2026-06-25",
    readingMinutes: 11,
    slug: "webhook-retry-playbook",
    takeaways: [
      "Acknowledge quickly and move slow work to a durable queue.",
      "Use the delivery identifier as the idempotency key.",
      "Make replay and recovery observable before an incident occurs.",
    ],
    title: "The webhook retry playbook for reliable integrations",
    updatedAt: "2026-08-20",
    sections: [
      {
        heading: "Assume every delivery can repeat",
        paragraphs: [
          "Webhooks cross networks, load balancers, runtimes, and application code that fail independently. A provider can send an event, receive no response, and retry even though the consumer completed the work. A consumer can acknowledge the request and crash before storing the event. Reliable integration design begins with the assumption that a logical event may arrive more than once and that attempts may arrive later than expected.",
          "Exactly-once delivery is not a useful promise at this boundary. Build for at-least-once delivery and make processing idempotent. The provider should preserve a stable delivery or event identifier. The consumer should record that identifier atomically with the state change or before dispatching the durable work. When the identifier appears again, the consumer can acknowledge it without repeating the business effect.",
        ],
      },
      {
        heading: "Verify before parsing",
        paragraphs: [
          "Verify the request signature against the raw body before transforming it. Parsing and reserializing JSON can change whitespace or ordering, which breaks signatures that were calculated from the original bytes. Check the timestamp included in the signature to reduce replay risk, and compare signatures using a constant-time function supplied by the platform runtime or a trusted library.",
          "Reject invalid signatures without exposing details that help an attacker. Rotate secrets through an overlap period so both the previous and current secrets work briefly. Record which secret version verified the request, but never log the secret itself. A clear rotation procedure is part of reliability because emergency secret changes should not require improvising during an incident.",
        ],
        code: `const rawBody = await request.text();\nverifySignature(rawBody, request.headers);\nconst event = JSON.parse(rawBody);\nawait acceptDelivery(event.deliveryId, rawBody);`,
      },
      {
        heading: "Acknowledge before slow work",
        paragraphs: [
          "The request path should validate, persist, enqueue, and acknowledge. It should not call several downstream services, generate a report, or wait for a large database transaction. Slow work increases the chance that the provider times out and sends another attempt while the first process is still running. A durable queue gives the consumer control over concurrency, backoff, and recovery after the HTTP request has ended.",
          "Choose a response deadline shorter than the provider timeout and monitor it directly. A successful response means the consumer accepted responsibility for the delivery, not necessarily that all downstream work finished. If persistence or enqueueing fails, return a non-success response so the provider can try again. Do not acknowledge work that exists only in process memory.",
        ],
      },
      {
        heading: "Make processing idempotent",
        paragraphs: [
          "Store the stable delivery identifier in a table with a unique constraint. Insert it in the same transaction as the state transition when possible. If the insert conflicts, read the existing status and decide whether to acknowledge completed work or resume an interrupted operation. Avoid using arrival time, payload hashes, or a short cache as the only deduplication mechanism because those approaches can fail when payloads change slightly or retries arrive late.",
          "Some operations require domain-level idempotency in addition to delivery-level deduplication. An invoice-paid event should not grant the same entitlement twice even if two different upstream events describe the same payment. Use a business key where the consequence demands it. Keep the webhook delivery record for observability, then enforce the domain invariant at the system that owns the state.",
        ],
        table: {
          headers: ["Record", "Purpose", "Retention"],
          rows: [
            ["Delivery identifier", "Deduplicate transport attempts", "Longer than provider retry window"],
            ["Event identifier", "Trace the logical event", "Aligned with audit policy"],
            ["Processing status", "Resume or investigate incomplete work", "Until final state is verified"],
            ["Business key", "Protect the domain effect", "Defined by the owning system"],
          ],
        },
      },
      {
        heading: "Design retries and dead letters",
        paragraphs: [
          "Use exponential backoff with jitter so many failing events do not retry at the same instant. Classify errors. A temporary database outage can be retried, while a malformed payload should move to investigation without consuming repeated attempts. Cap retries and send exhausted work to a dead-letter queue that has an owner, alert, and documented replay procedure.",
          "Replay tooling should preserve the original identifiers and record who initiated the action. Allow operators to select a bounded set, preview the impact, and stop the replay if error rates rise. Never make the only recovery method a manual production script known by one engineer. Recovery is part of the product surface for teams that depend on integrations.",
        ],
      },
      {
        heading: "Observe the delivery lifecycle",
        paragraphs: [
          "Track accepted, processing, completed, retried, and dead-lettered states with stable identifiers. Measure acknowledgement latency, queue delay, processing duration, retry count, and final outcome. Correlate provider attempts with consumer work without logging secrets or full sensitive payloads. A customer-facing delivery log can answer many integration questions before support or engineering becomes involved.",
          "Test the system by delaying responses, returning failures, duplicating events, reordering attempts, and stopping workers mid-operation. The goal is not merely to prove the happy path. It is to demonstrate that the consumer can recover without duplicate effects and that an operator can understand the state from evidence. Reliability becomes credible when failure behavior is designed and exercised before production supplies the test.",
        ],
      },
      {
        heading: "Set clear expectations for integrators",
        paragraphs: [
          "Documentation should define the signature format, acknowledgement deadline, retry window, ordering guarantees, identifier semantics, and support evidence required for investigation. Include examples of a repeated delivery and an out-of-order event. Avoid language that implies exactly-once behavior when the protocol cannot provide it. Clear contracts let consumers design correctly before the first production failure.",
          "Expose a safe delivery history that shows attempt time, response status, and final state without revealing secrets. Let administrators replay a bounded event when policy permits. When support receives a report, the customer and agent should be able to refer to the same delivery identifier. Shared evidence shortens investigation and reduces the temptation to make speculative changes to a working endpoint.",
        ],
        bullets: [
          "Publish stable identifier semantics and the complete retry window.",
          "Document acknowledgement deadlines and event-ordering limitations.",
          "Provide safe replay controls with an operator audit trail.",
          "Give support and customers one shared delivery reference.",
        ],
      },
    ],
  },
  {
    author: "Maya Chen",
    category: "Identity",
    description:
      "Understand SSO domain verification, DNS propagation, safe troubleshooting, and the operational signals that reduce onboarding delays.",
    id: "blog_5",
    publishedAt: "2026-06-12",
    readingMinutes: 10,
    slug: "sso-domain-verification-guide",
    takeaways: [
      "Verify the exact public TXT answer at the selected root domain.",
      "Treat propagation, resolver cache, and job state as separate signals.",
      "Escalate with evidence instead of requesting access to customer DNS.",
    ],
    title: "A practical guide to SSO domain verification",
    updatedAt: "2026-08-18",
    sections: [
      {
        heading: "What domain verification proves",
        paragraphs: [
          "Domain verification proves that an administrator controls the DNS zone for the domain being connected to an identity configuration. It does not prove ownership of every user account, validate an identity provider configuration, or activate single sign-on by itself. Keeping these boundaries clear helps teams troubleshoot the right layer instead of treating a pending domain as a general SSO failure.",
          "A typical flow generates a unique TXT value, asks the administrator to publish it at a selected domain, queries public DNS, and records the verified state. The value should be scoped to the workspace and should not contain a reusable secret. Once verified, changes to identity settings may still require separate validation, policy approval, or metadata exchange with the identity provider.",
        ],
      },
      {
        heading: "Publish the exact record",
        paragraphs: [
          "Copy the record name and value exactly. DNS control panels often append the zone name automatically, so entering the full domain can create a duplicated name. Some providers display quotation marks around TXT values even though the quotes are not part of the value. Extra spaces, multiple active verification values, and records created under a subdomain are common causes of a public answer that looks close but does not match.",
          "Confirm the selected root domain in the application before publishing. A verification for example.com should not be placed under login.example.com unless the product explicitly asks for that host. Use a public DNS lookup to inspect the answer outside the administrator's local network. This separates authoritative DNS state from a local resolver cache or browser display.",
        ],
        bullets: [
          "Match the record name and workspace-specific value exactly.",
          "Check whether the DNS provider appends the zone automatically.",
          "Remove superseded verification records with different values.",
          "Inspect the public answer from more than one resolver when diagnosing propagation.",
        ],
      },
      {
        heading: "Understand propagation",
        paragraphs: [
          "DNS changes do not appear everywhere at the same moment. Authoritative servers may update quickly while recursive resolvers continue serving a cached answer until its time to live expires. A control panel can show the new value before public resolvers return it. Conversely, one resolver may show the correct value while another still has the previous answer. This is expected behavior during propagation.",
          "Record the time of the change and the configured time to live. Avoid repeatedly deleting and recreating the record because each change makes the troubleshooting timeline harder to interpret. If the correct value is visible publicly, rerun verification after the application retry interval. If the state remains pending beyond the documented window, collect evidence for support rather than granting access to the DNS account.",
        ],
      },
      {
        heading: "Separate DNS state from job state",
        paragraphs: [
          "A correct public record and a pending application status can coexist when a verification job has not rerun, a resolver used by the service still has an older answer, or a job failed after the lookup. Expose the last check time and a safe summary of the result so administrators know whether they are waiting for DNS or for the application. A generic pending label hides the evidence needed to act.",
          "Support teams should be able to restart a verification job through an audited action, not an undocumented script. The action should preserve the original request, record who initiated it, and show the resulting state. If a job repeatedly fails after the public value is confirmed, route the case with the domain, workspace, timestamps, and job identifier so engineering can inspect the correct execution.",
        ],
        table: {
          headers: ["Signal", "What it suggests", "Next action"],
          rows: [
            ["No public TXT answer", "Record missing or wrong host", "Check provider name and zone"],
            ["Old public value", "Cache or superseded record", "Wait for TTL and remove conflicts"],
            ["Correct value, never checked", "Verification job did not run", "Run Verify again"],
            ["Correct value, job error", "Application-side failure", "Escalate with job identifier"],
          ],
        },
      },
      {
        heading: "Troubleshoot without collecting secrets",
        paragraphs: [
          "A verification TXT value is intended to be public, but DNS accounts, identity-provider credentials, and private keys are not. Support should never ask a customer to share a registrar password, screen-control session, or full zone export when a public lookup can confirm the required record. Request only the domain, expected public value, approximate change time, and screenshots or text from a public resolver.",
          "Redact unrelated DNS records from screenshots. Store diagnostic evidence according to the support data policy and remove it when no longer needed. The safest troubleshooting process gives the support team enough information to distinguish propagation from job failure without expanding access to infrastructure that is outside the product boundary.",
        ],
      },
      {
        heading: "Build a better onboarding experience",
        paragraphs: [
          "Show provider-aware examples, explain whether the root domain is appended automatically, and display the last verification attempt. Offer a copy button that copies the exact value without decorative quotation marks. Link to a public lookup and describe the expected waiting window. Small interface details prevent many onboarding tickets because they remove ambiguity before the customer changes DNS.",
          "Measure completion time, repeated verification attempts, support contact rate, and the failure reason distribution. Use those signals to improve instructions and job reliability. A good verification flow does not merely succeed when every step is perfect. It helps an administrator understand the current state, recover from a common mistake, and escalate with useful evidence when the system itself needs attention.",
        ],
      },
      {
        heading: "Operate verification at scale",
        paragraphs: [
          "Large customers may manage several domains, environments, and identity connections. Give each verification request a stable identifier and show which workspace and configuration it belongs to. Prevent a value generated in a sandbox from being presented as proof for production. When a domain is reused across configurations, make the ownership and security policy explicit rather than relying on an accidental first verification.",
          "Monitor verification-job latency, resolver failures, repeated attempts, and age of pending requests. Alert on system-wide changes instead of waiting for many customers to report the same symptom. Keep the support action bounded and audited. At scale, a reliable operational path matters as much as the DNS protocol because most customer frustration comes from an unexplained state rather than from publishing the record itself.",
        ],
      },
    ],
  },
  {
    author: "Elena Brooks",
    category: "Knowledge systems",
    description:
      "Create a customer support knowledge base that remains accurate, discoverable, citable, and useful to both people and AI systems.",
    featured: true,
    id: "blog_6",
    publishedAt: "2026-05-28",
    readingMinutes: 11,
    slug: "customer-support-knowledge-base",
    takeaways: [
      "Organize knowledge around customer decisions and tasks.",
      "Assign ownership, evidence, and review expectations to every article.",
      "Measure answer coverage and successful use, not article count.",
    ],
    title: "How to build a customer support knowledge base people can trust",
    updatedAt: "2026-08-24",
    sections: [
      {
        heading: "Start with customer decisions",
        paragraphs: [
          "Knowledge bases often mirror the company org chart. Customers do not think in those boundaries. They arrive with a task, a symptom, or a decision: connect an identity provider, understand a charge, recover a failed export, or decide whether an integration behavior is expected. Organize the primary information architecture around those needs, then use product and team labels as supporting metadata.",
          "Review search queries, ticket reasons, onboarding steps, and repeated agent explanations. Group them by the outcome the customer wants. A strong article should help a reader recognize the situation, understand the important constraint, complete a safe action, and know what evidence to collect if the action fails. This structure serves both direct readers and answer systems that retrieve passages for a specific question.",
        ],
      },
      {
        heading: "Give every article an operating contract",
        paragraphs: [
          "An article needs an owner, audience, product scope, evidence source, review expectation, and visible update date. Ownership should belong to the team that can verify the behavior, not simply the person who first wrote the page. When product behavior changes, the release process should identify affected articles and create review work before customers discover the contradiction.",
          "Use status deliberately. Draft content should not appear in customer search or AI retrieval. Approved content should record who reviewed it. Superseded content may need an archive for audit purposes, but it should not compete with current guidance. A clear lifecycle prevents the corpus from becoming a mixture of useful instructions, historical explanation, and unverified notes.",
        ],
        table: {
          headers: ["Field", "Why it matters", "Example"],
          rows: [
            ["Audience", "Controls language and access", "Workspace administrator"],
            ["Product scope", "Prevents wrong-version answers", "Enterprise identity"],
            ["Evidence", "Supports factual claims", "Current product behavior and policy"],
            ["Review date", "Creates maintenance accountability", "Quarterly or release-triggered"],
          ],
        },
      },
      {
        heading: "Write for scanning and retrieval",
        paragraphs: [
          "Use a specific title that matches the customer task. Begin with a direct answer and the conditions that change it. Break the procedure into meaningful headings and steps. Keep warnings close to the action they constrain. Define unfamiliar terms when they first appear. Readers under pressure scan headings and first sentences, while retrieval systems rely on the same structure to select a coherent passage.",
          "Avoid hiding critical behavior in an image or video. Media can demonstrate a workflow, but the essential instruction should remain in server-rendered text with useful alternative text and captions. Use tables when readers need to compare states or options. Include exact interface labels, but describe the goal as well so the article remains understandable after minor visual changes.",
        ],
        bullets: [
          "Answer the main question near the beginning.",
          "Use headings that describe tasks or decisions.",
          "Keep each procedure bounded and observable.",
          "Explain what success looks like and what evidence to collect on failure.",
        ],
      },
      {
        heading: "Make discovery part of quality",
        paragraphs: [
          "A correct article that nobody can find does not reduce customer effort. Add self-referencing canonicals, descriptive metadata, stable URLs, structured data, and sitemap entries. Link from relevant product surfaces and related articles. Ensure important content exists in the initial HTML so crawlers and constrained clients do not depend on application JavaScript to discover the answer.",
          "Internal search should evaluate intent and successful outcomes, not only keyword overlap. Record queries with no result, reformulations, and cases where a reader opens an article then contacts support with the same question. These signals identify vocabulary gaps, missing content, and pages that rank well but fail to resolve the task.",
        ],
      },
      {
        heading: "Prepare content for grounded answers",
        paragraphs: [
          "AI answer systems make source quality more important, not less. Separate public guidance from internal procedures and restricted policy. Preserve article identifiers, headings, and update dates in the retrieval index. Filter the eligible corpus by audience and product scope before ranking passages. A semantically similar paragraph from the wrong policy is still an unsupported answer.",
          "Evaluate answers against frozen high-intent questions. Check whether the response covers required concepts, cites the expected approved source, remains self-contained, and avoids unsupported certainty. When a case fails, determine whether the problem is missing content, weak structure, poor retrieval, or answer construction. Editing the prompt cannot repair an article that never states the required behavior.",
        ],
      },
      {
        heading: "Measure coverage and maintenance",
        paragraphs: [
          "Article count is not a useful north-star metric. Measure coverage of important questions, successful search sessions, self-service completion, repeat contact, citation use, and time since verified review. Segment by product area and customer journey. A small set of complete, maintained articles can outperform a large corpus of overlapping pages that disagree.",
          "Run a regular maintenance loop. Select the highest-impact gap, freeze the question and quality rubric, improve the content or retrieval path, and rerun the same evaluation. Protect crawlability, accessibility, and page performance while content changes. The knowledge base becomes trustworthy when its quality is observable and when every important page has a team responsible for keeping that evidence current.",
        ],
      },
      {
        heading: "Create a dependable publishing workflow",
        paragraphs: [
          "Publishing should include content review, technical validation, and an observable release. Check headings, links, metadata, structured data, accessibility, and the final server-rendered HTML. Preview the article at mobile and desktop widths. A long page can be readable and fast when layout, images, fonts, and client-side behavior are treated as part of content quality instead of concerns left for a later platform project.",
          "After publication, verify the canonical URL, sitemap entry, internal links, and search visibility. Run representative answer questions against the updated source. Record the healthy baseline so future changes have a comparison point. This workflow turns an article from a document into a maintained product surface with clear evidence that people and machines can discover, understand, and use it.",
        ],
        bullets: [
          "Review content accuracy with the team that owns the behavior.",
          "Validate metadata, schema, links, accessibility, and initial HTML.",
          "Measure representative page performance before publishing.",
          "Recheck retrieval and answer quality after the source changes.",
          "Archive the verified result with the publishing record.",
        ],
      },
    ],
  },
  {
    author: "Jon Bell",
    category: "Analytics",
    description:
      "Choose support metrics that explain customer outcomes, expose system bottlenecks, and lead to better operational decisions.",
    id: "blog_7",
    publishedAt: "2026-05-14",
    readingMinutes: 10,
    slug: "support-metrics-that-drive-decisions",
    takeaways: [
      "Connect every operational metric to a customer or business decision.",
      "Pair speed with correctness, effort, and repeat work.",
      "Use distributions and segments instead of relying on one average.",
    ],
    title: "Support metrics that lead to better decisions",
    updatedAt: "2026-08-16",
    sections: [
      {
        heading: "Begin with the decision",
        paragraphs: [
          "A dashboard becomes useful when a leader can name the decision each metric informs. Backlog by queue can guide staffing or routing. Repeat contact can reveal incomplete resolutions or product defects. Source coverage can guide knowledge investment. A number without a decision often becomes decoration or, worse, a target that teams optimize without improving the customer experience.",
          "Write the operational question before selecting the measure. Ask what action could follow a high or low value, who owns that action, and what additional evidence prevents a misleading conclusion. If no one would act differently, remove the metric from the primary dashboard. The data may still support analysis, but it should not compete for attention during daily operations.",
        ],
      },
      {
        heading: "Pair speed with outcome quality",
        paragraphs: [
          "Speed metrics are easy to understand and easy to game. First-response time can improve through empty acknowledgments. Resolution time can improve when agents close tickets that later reopen. Handle time can fall when difficult conversations are transferred. Pair each speed measure with a quality or durability signal so the system rewards real progress.",
          "Useful pairs include first-response time with useful-response review, resolution time with seven-day repeat contact, automation rate with policy compliance, and self-service rate with successful completion. These combinations make tradeoffs visible. A team can decide to accept a small increase in handling time if it produces fewer repeat contacts and more correct first resolutions.",
        ],
        table: {
          headers: ["Speed measure", "Balancing measure", "Question"],
          rows: [
            ["First response", "Useful-response rate", "Did the reply create progress?"],
            ["Resolution time", "Repeat contact", "Did the outcome hold?"],
            ["Handle time", "Transfer rate", "Was work completed or moved?"],
            ["Automation rate", "Policy and citation compliance", "Was automated output trustworthy?"],
          ],
        },
      },
      {
        heading: "Prefer distributions to averages",
        paragraphs: [
          "An average can look stable while urgent customers wait far too long. Report percentiles and distributions for time-based metrics. The median describes the common experience, while the 90th or 95th percentile reveals the tail. Track the share that breaches a clear promise. These views make operational risk visible and prevent a large volume of easy work from hiding a smaller group of painful failures.",
          "Segment carefully by queue, channel, plan, region, contact reason, and time of day. Choose segments connected to a plausible intervention. Avoid slicing until every group is too small to interpret. When a gap appears, check volume, mix, and process before assigning cause. A high enterprise resolution time may reflect more complex work rather than lower performance.",
        ],
      },
      {
        heading: "Measure demand, not only throughput",
        paragraphs: [
          "Support volume is partly a product signal. Classify demand by customer intent and identify which contacts could have been prevented through product reliability, clearer onboarding, better documentation, or account communication. Count repeated contacts from the same underlying issue. A team that closes more tickets may be working efficiently while the organization continues producing unnecessary demand.",
          "Connect contact reasons to product releases, incidents, billing events, and lifecycle stages. Share the evidence with the teams that can remove the cause. Track the volume after a fix to confirm the expected reduction. This creates a path from support operations to product improvement and prevents deflection from becoming the only strategy for managing volume.",
        ],
        bullets: [
          "Separate value-creating assistance from preventable failure demand.",
          "Link repeated contacts to a common product or process cause.",
          "Assign an owner outside support when another team controls the cause.",
          "Verify that the demand falls after the correction ships.",
        ],
      },
      {
        heading: "Treat AI metrics as quality metrics",
        paragraphs: [
          "Acceptance rate and automation rate do not prove that AI output is good. Agents may accept a weak draft under time pressure, and customers may not immediately report an unsupported claim. Measure the properties that make the output safe and useful: approved citation precision, required-action recall, policy compliance, uncertainty behavior, edit distance, and post-response repeat contact.",
          "Use frozen evaluation cases for release decisions and production signals for monitoring. Keep deterministic safety gates separate from model-based helpfulness judgments. Segment failures by queue and evidence type. A model may perform well on procedural setup questions while struggling with account-specific incidents. An aggregate score can hide exactly the risk the evaluation should expose.",
        ],
      },
      {
        heading: "Build an operating cadence",
        paragraphs: [
          "Use a small daily view for queue health, a weekly review for trends and bottlenecks, and a monthly review for system changes. Every review should end with an owner, a bounded hypothesis, and a measure that can confirm the result. Avoid creating a new dashboard for each question. Keep definitions stable and annotate major changes so historical comparisons remain meaningful.",
          "Metrics should make learning faster. When a measure moves, investigate the mechanism before celebrating or reacting. Record the baseline, change one part of the system, and compare the same cohort or frozen evaluation. A useful metric does not merely describe the past. It helps the team choose the next improvement and know whether that decision worked.",
        ],
      },
      {
        heading: "Protect metric definitions and trust",
        paragraphs: [
          "Write each definition with its source, filters, time zone, inclusion rules, owner, and known limitations. Version material changes and annotate dashboards when collection changes. A silent definition change can create a convincing trend that reflects instrumentation rather than customer experience. Analysts and operators should be able to trace a headline number back to the underlying events and reproduce it for a bounded period.",
          "Review access and privacy as part of the metric design. Use aggregated views for broad operational decisions and restrict conversation-level data to people who need it. Remove sensitive text from exported examples. Trust grows when teams know both what a metric means and how responsibly it was produced. Without that trust, even accurate dashboards stop influencing decisions.",
        ],
        bullets: [
          "Version definitions when filters or source events change.",
          "Annotate dashboards at the time of collection changes.",
          "Keep owners and known limitations visible beside the metric.",
          "Test that a bounded historical result can be reproduced.",
          "Keep privacy review inside the measurement workflow.",
        ],
      },
    ],
  },
  {
    author: "Arun Sharma",
    category: "Reliability",
    description:
      "Connect production errors, customer conversations, observability evidence, fixes, and regression tests in one accountable correction loop.",
    id: "blog_8",
    publishedAt: "2026-04-30",
    readingMinutes: 11,
    slug: "from-support-ticket-to-verified-fix",
    takeaways: [
      "Preserve the path from customer impact to technical evidence.",
      "Reproduce the failure before changing implementation.",
      "Close the loop only after the customer outcome and regression gate are verified.",
    ],
    title: "From support ticket to verified product fix",
    updatedAt: "2026-08-14",
    sections: [
      {
        heading: "Treat the conversation as an operational signal",
        paragraphs: [
          "A customer report often contains evidence that monitoring missed: the workflow they attempted, the state they expected, the time the failure occurred, and the business consequence. Preserve that context when the issue moves from support to engineering. A summary should reduce repetition without replacing the original message. The customer impact is part of the incident, not a note attached after the technical work begins.",
          "Classify the signal by product area, severity, scope, and reproducibility. Link similar conversations so teams can see whether an isolated report is becoming a pattern. Do not wait for perfect certainty before recording the relationship. A lightweight suspected-incident link can be reviewed later and is more useful than forcing every agent to rediscover the same cluster independently.",
        ],
      },
      {
        heading: "Create an evidence package",
        paragraphs: [
          "An escalation should include a bounded description of expected and observed behavior, safe identifiers, timestamps with time zone, environment, recent changes, and the checks already performed. Attach logs or traces through approved systems rather than pasting sensitive payloads into the ticket. Name the customer-facing workaround, if one exists, and the next update commitment.",
          "Standardization reduces back-and-forth, but the form should match the failure. An API timeout needs request and trace identifiers. A data export gap needs the export identifier, date range, and manifest counts. An identity problem needs the domain state and verification job. Ask for evidence that distinguishes likely causes, not every field the organization can collect.",
        ],
        bullets: [
          "Expected behavior and observed behavior",
          "Customer impact and current workaround",
          "Safe identifiers and precise timestamps",
          "Reproduction steps and checks already completed",
          "Owner and next customer update time",
        ],
      },
      {
        heading: "Reproduce before repairing",
        paragraphs: [
          "A reproducible failing case protects the team from fixing the wrong problem. Build the smallest scenario that preserves the customer-visible failure. Use production-like data volume and configuration when those factors matter. Record the evaluator, baseline result, and environmental assumptions. Run it more than once to distinguish a stable regression from noise.",
          "If the failure cannot be reproduced, continue gathering evidence rather than making broad speculative changes. A trace, query plan, browser audit, or frozen conversation can become the evaluator. The goal is not always a unit test. The goal is an observable signal that fails for the current behavior and can prove that the correction works without relying on memory or visual confidence.",
        ],
      },
      {
        heading: "Use a bounded correction loop",
        paragraphs: [
          "State one bottleneck hypothesis, make one measured change, and rerun the frozen evaluator. Keep the iteration small enough that the result can be attributed to the change. Protect correctness, accessibility, policy, and other system qualities with additional gates. A faster query that returns incomplete tickets or a higher-scoring page that removes meaningful content is not a valid correction.",
          "Define the stop condition before work begins. It may include a latency percentile, zero evaluator failures, a required execution plan, or a quality score across several cases. Add a time or iteration bound and an escalation condition for genuine ambiguity. Bounded loops let an agent work autonomously without granting unlimited freedom to redefine success.",
        ],
        code: `Observe the failing signal.\nForm one evidence-backed hypothesis.\nMake one bounded change.\nRun the same evaluator.\nKeep, revert, or escalate based on the result.`,
      },
      {
        heading: "Verify the customer outcome",
        paragraphs: [
          "A green technical test is necessary but not always sufficient. Confirm that the customer-visible workflow now succeeds and that the original impact is resolved. If the fix changes data or account state, verify the affected record carefully and preserve an audit trail. Communicate what changed, what the customer should do next, and any limitation that remains.",
          "Watch the relevant production signals after release. Compare error rate, latency, repeat contact, and new conversations with the same intent. A correction can pass a narrow test while shifting failure elsewhere. Time-bound monitoring and a rollback plan turn deployment into part of the verification rather than treating merge as the finish line.",
        ],
        table: {
          headers: ["Layer", "Verification", "Evidence"],
          rows: [
            ["Implementation", "Regression evaluator passes", "Test or benchmark result"],
            ["Workflow", "Original user path succeeds", "Browser or API check"],
            ["Customer", "Impact is resolved", "Confirmed state and communication"],
            ["Production", "No harmful secondary effect", "Monitored error and latency signals"],
          ],
        },
      },
      {
        heading: "Return learning to the system",
        paragraphs: [
          "Keep the reproduction as a regression gate and connect it to the original customer signal. Update the relevant article, runbook, alert, or escalation template. If detection arrived through support before monitoring, decide whether an observable product signal can catch the condition earlier. Share the mechanism of failure rather than only the patch so other teams can recognize related risks.",
          "Close ownership explicitly. Support confirms the customer outcome, engineering owns the correction, and the relevant product or operations team owns prevention. The loop is complete when the system has changed, the outcome is verified, and the same failure would be detected sooner next time. That is how individual tickets become durable product improvement instead of isolated acts of recovery.",
        ],
      },
      {
        heading: "Communicate without overpromising",
        paragraphs: [
          "Customer communication should separate confirmed facts, current actions, and remaining uncertainty. State the observed impact and what the team has verified. Give a realistic next update commitment instead of a speculative resolution time. When a workaround exists, explain its limitation. A precise update maintains trust even when the technical investigation is incomplete.",
          "After the correction, describe the behavior that changed and the step the customer should take, if any. Avoid exposing internal details that do not help them act. Confirm the outcome before declaring the issue resolved. Good communication is part of the verification path because it aligns the technical state, the support record, and the customer's understanding of what happens next.",
        ],
        bullets: [
          "Separate confirmed facts from active investigation and uncertainty.",
          "Give the next update time, not an invented resolution promise.",
          "Explain workaround limits and any required customer action.",
          "Confirm the original workflow before closing the conversation.",
          "Preserve the evidence that supports the final update.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function blogPostWordCount(post: BlogPost) {
  const text = [
    post.title,
    post.description,
    ...post.takeaways,
    ...post.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
      ...(section.table?.headers ?? []),
      ...(section.table?.rows.flat() ?? []),
      section.code ?? "",
    ]),
  ].join(" ");

  return text.trim().split(/\s+/).length;
}

// Topic pages: which articles a topic takes, and their counts.
// Written before the code, from the ways it can go wrong:
// - a company topic takes an article about another company that only mentions it (several subjects,
//   its name nowhere in the title), or drops one about it whose title names it in English, in another
//   case, next to Chinese text, or only by a product (it is the article's only subject);
// - a Latin name matches inside another word ("Lillypad" is not Lilly); a headline naming a company
//   that is not a subject of the article gets in;
// - a treatment-area topic stops taking its tags;
// - withdrawn or not yet released articles appear in a list or a count;
// - an article or story page names a topic its reports do not belong to;
// - a topic without content has no page, or an unknown slug or a page past the end has one.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { publishArticle } from "@aihot/backend/publication/publish";
import { TOPICS, loadTopicPage, listTopicSummaries, topicsOfStory } from "@aihot/backend/publication/topics";
import { buildApp } from "../apps/api/src/app.ts";

const T = tag();
const OFFICIAL = `test-topics-official-${T}`;
const MEDIA = `test-topics-media-${T}`;
const app = await buildApp();

before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, first_party, next_fetch_at) VALUES
    (${OFFICIAL}, 'Official', 'rss', 'T1', 'editorial', true, '2100-01-01'),
    (${MEDIA}, 'Media', 'rss', 'T2', 'editorial', false, '2100-01-01')`;
});
after(async () => {
  await app.close();
  await stopBoss();
  await closeDb();
});

let n = 0;
interface Report {
  source?: string;
  at: Date;
  title: string;
  originalTitle?: string;
  subjects?: string[];
  tags?: string[];
  score?: number;
  selected?: boolean;
  fact?: number;
  category?: string;
}

/** A published report; `fact` links it to a fact before publishing, as grouping would. */
async function report(r: Report): Promise<string> {
  n += 1;
  const { articleId } = await upsertMaterial({
    sourceId: r.source ?? MEDIA, url: `https://example.com/topics-${T}-${n}`, title: r.originalTitle ?? r.title, bodyText: "body", bodyHtml: "<p>body</p>", bodyStatus: "ok", via: "fetch", publishedAt: r.at,
  });
  await sql`UPDATE articles SET discovered_at = ${r.at}, timeline_at = ${r.at}, grouped_at = now() WHERE id = ${articleId}`;
  await sql`INSERT INTO analyses (article_id, input_revision, origin, relevance, category, title_zh, summary_zh, score, selected, subjects, tags)
            VALUES (${articleId}, 1, 'rule', 'pass', ${r.category ?? "drug-approval"}, ${r.title}, ${`摘要 ${n}`}, ${r.score ?? 80}, ${r.selected ?? true}, ${r.subjects ?? []}, ${[r.category === "device-digital" ? "器械/产品" : r.category === "clinical-research" ? "临床结果" : r.category === "guideline" ? "指南/共识" : r.category === "industry" ? "企业动态" : r.category === "opinion" ? "观点/访谈" : "新药获批", ...(r.tags ?? [])]})`;
  if (r.fact) await sql`INSERT INTO fact_articles (fact_id, article_id, role) VALUES (${r.fact}, ${articleId}, 'report')`;
  await publishArticle(articleId, { releasedAt: new Date(r.at.getTime() + 60_000) });
  return articleId;
}

async function story(title: string): Promise<{ id: number; publicId: string }> {
  const publicId = randomUUID();
  const [s] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title, first_report_at, latest_at) VALUES (${publicId}, ${title}, now(), now()) RETURNING id`;
  return { id: s!.id, publicId };
}

async function fact(storyId: number | null, title: string): Promise<number> {
  const [f] = await sql<{ id: number }[]>`INSERT INTO facts (public_id, story_id, title) VALUES (${`f-${T}-${randomUUID()}`}, ${storyId}, ${title}) RETURNING id`;
  return f!.id;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const ids = (items: Array<{ id: string }>) => items.map((i) => i.id);
const page = async (slug: string, p = 1) => {
  const data = await loadTopicPage(slug, p, new Date());
  assert.ok(data, `${slug} page ${p}`);
  return data;
};
/** Every article of a topic, over all its pages. */
async function members(slug: string): Promise<string[]> {
  const first = await page(slug);
  const out = ids(first.items);
  for (let p = 2; p <= first.pageCount; p++) out.push(...ids((await page(slug, p)).items));
  return out;
}

test("a company topic takes the articles about it, not the ones that only mention it", async () => {
  const about = await report({ at: hoursAgo(30), title: `百济神州 ADC 新药获批 ${T}`, subjects: ["beigene"], tags: ["ADC"] });
  const product = await report({ at: hoursAgo(31), title: `替雷利珠单抗新适应症获批 ${T}`, subjects: ["beigene"] });
  const english = await report({ at: hoursAgo(32), title: `BeOne Medicines reports phase 3 data ${T}`, subjects: ["beigene", "pfizer"] });
  const mentionOnly = await report({ at: hoursAgo(33), title: `辉瑞宣布新的合作 ${T}`, subjects: ["pfizer", "beigene"] });
  const lowerCase = await report({ at: hoursAgo(34), title: `pfizer 公布新的安全数据 ${T}`, subjects: ["pfizer", "beigene"] });
  const pact = await report({ at: hoursAgo(35), title: `二十余家药企签署临床数据共享协议 ${T}`, subjects: ["pfizer", "beigene", "novartis"] });
  const lillypad = await report({ at: hoursAgo(36), title: `Lillypad 应用上线，辉瑞参与 ${T}`, subjects: ["lilly", "pfizer"] });
  const adjacent = await report({ at: hoursAgo(37), title: `发布Lilly的新药 ${T}`, subjects: ["lilly", "pfizer"] });
  const headline = await report({ at: hoursAgo(38), title: `Pfizer 被一篇盘点提到 ${T}`, subjects: ["novartis"] });
  const adc = await report({ at: hoursAgo(39), title: `ADC 联合疗法公布数据 ${T}`, tags: ["ADC"] });

  const beigene = await members("beigene");
  for (const id of [about, product, english]) assert.ok(beigene.includes(id), "about BeiGene");
  for (const id of [mentionOnly, lowerCase, pact, headline]) assert.ok(!beigene.includes(id), "only mentions BeiGene");
  const pfizer = await members("pfizer");
  for (const id of [mentionOnly, lowerCase, lillypad]) assert.ok(pfizer.includes(id), "about Pfizer");
  for (const id of [english, pact, adjacent, headline]) assert.ok(!pfizer.includes(id), "only mentions Pfizer");
  const lilly = await members("lilly");
  assert.ok(lilly.includes(adjacent), "Lilly next to Chinese text");
  assert.ok(!lilly.includes(lillypad), "Lillypad is not Lilly");
  assert.ok((await members("adc")).includes(adc), "a treatment-area topic takes its tag");

  // The article page names the topics it belongs to.
  const topicsOf = async (id: string) => {
    const res = await app.inject({ method: "GET", url: `/api/site/items/${id}` });
    return (JSON.parse(res.body) as { topics: Array<{ slug: string }> }).topics.map((t) => t.slug);
  };
  assert.deepEqual(await topicsOf(about), ["beigene", "adc", "approvals"]);
  assert.deepEqual(await topicsOf(mentionOnly), ["pfizer", "approvals"]);
  assert.deepEqual(await topicsOf(pact), ["approvals"]);
  assert.deepEqual(await topicsOf(adc), ["adc", "approvals"]);
});

test("renaming a company topic keeps its old full name usable for search", async () => {
  const id = await report({at: hoursAgo(2), title: `百济神州泽布替尼新数据 ${T}`, subjects: ['beigene'], selected: false});
  for (const query of ['BeiGene', 'BeOne Medicines']) {
    const res = await app.inject({method: 'GET', url: `/api/site/pool?q=${encodeURIComponent(query)}`});
    assert.equal(res.statusCode, 200);
    assert.ok(ids(JSON.parse(res.body).items).includes(id), 'full company names must still find subject-tagged reports');
  }
});

test("a story page names the topics of its reports", async () => {
  const trial = await story(`ADC 联合疗法 III 期结果 ${T}`);
  await report({ source: OFFICIAL, at: hoursAgo(26), title: `ADC 联合疗法 III 期结果 ${T}`, tags: ["ADC"], category: "clinical-research", fact: await fact(trial.id, "III 期结果") });
  assert.deepEqual(await topicsOfStory(trial.id), [{ slug: "adc", name: "ADC" }, { slug: "clinical-data", name: "临床结果" }]);
});

test("withdrawn articles stay out of lists and counts", async () => {
  const kept = await report({ at: hoursAgo(5), title: `信达生物信迪利单抗新数据 ${T}`, subjects: ["innovent"] });
  const withdrawn = await report({ at: hoursAgo(4), title: `信达生物撤回的消息 ${T}`, subjects: ["innovent"] });
  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${withdrawn}`;

  const data = await page("innovent");
  assert.deepEqual(ids(data.items), [kept]);
  assert.equal(data.topic.total, 1);
  const summary = (await listTopicSummaries()).topics.find((t) => t.slug === "innovent")!;
  assert.equal(summary.latest?.title, `信达生物信迪利单抗新数据 ${T}`, "the index shows the newest public article");
});

test("every topic has a page; unknown topics and pages past the end have none", async () => {
  const empty = await page("roche");
  assert.equal(empty.topic.indexable, false, "a topic without content is not indexed");
  assert.deepEqual(empty.items, []);
  assert.equal(await loadTopicPage("not-a-topic", 1, new Date()), null);
  assert.equal(await loadTopicPage("roche", 2, new Date()), null);
  const index = await app.inject({ method: "GET", url: "/api/site/topics" });
  const body = JSON.parse(index.body) as { groups: Array<{ key: string }>; topics: Array<{ slug: string }> };
  assert.deepEqual(body.groups.map((g) => g.key), ["company", "field", "genre"]);
  assert.deepEqual(body.topics.map((t) => t.slug).sort(), TOPICS.map((t) => t.slug).sort(), "the index lists every topic");
});

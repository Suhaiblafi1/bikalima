import { expect, test } from "../fixtures/auth";

/**
 * The suggestion box is a public form that writes to the database, so the
 * things worth naming are the ones that fail quietly: an anonymous write, a
 * link to somewhere that is not a talk, and the same link twice.
 */
const YT = "https://www.youtube.com/watch?v=abc12345";

test("a signed-in visitor can suggest a speech, with or without an opinion", async ({ learner }) => {
  const withOpinion = await learner.request.post("/api/speech-suggestions", {
    data: { videoUrl: YT, opinion: "افتتاحيته سؤال بقي معي بعد انتهاء الخطاب." },
  });
  expect(withOpinion.status()).toBe(201);
  const body = (await withOpinion.json()) as { suggestion: { videoUrl: string; opinion: string | null; status: string } };
  expect(body.suggestion.videoUrl).toContain("youtube.com");
  expect(body.suggestion.opinion).toContain("افتتاحيته");
  expect(body.suggestion.status).toBe("new");

  // The opinion is optional on purpose: a bare link is still a useful pointer.
  const bare = await learner.request.post("/api/speech-suggestions", {
    data: { videoUrl: "https://youtu.be/zz9999" },
  });
  expect(bare.status()).toBe(201);
  expect(((await bare.json()) as { suggestion: { opinion: string | null } }).suggestion.opinion).toBeNull();
});

test("the same link twice updates the one row instead of piling up", async ({ learner }) => {
  const again = await learner.request.post("/api/speech-suggestions", {
    data: { videoUrl: YT, opinion: "رأي منقّح." },
  });
  expect(again.status()).toBe(200);
  expect(((await again.json()) as { updated: boolean }).updated).toBe(true);

  const mine = await learner.request.get("/api/speech-suggestions/mine");
  const { suggestions } = (await mine.json()) as { suggestions: Array<{ videoUrl: string; opinion: string | null }> };
  const forThisLink = suggestions.filter((s) => s.videoUrl.includes("v=abc12345"));
  expect(forThisLink).toHaveLength(1);
  expect(forThisLink[0].opinion).toBe("رأي منقّح.");
});

test("an anonymous visitor cannot write to it", async ({ anon }) => {
  // The box carries the suggester's name; without one there is nobody to ask
  // a follow-up question and nothing to distinguish it from link spam.
  const res = await anon.request.post("/api/speech-suggestions", { data: { videoUrl: YT } });
  expect(res.status()).toBe(401);
  expect((await anon.request.get("/api/speech-suggestions/mine")).status()).toBe(401);
});

test("a link that is not a talk is refused", async ({ learner }) => {
  for (const url of [
    "https://example.com/buy-my-thing",
    "javascript:alert(1)",
    "not-a-url",
    "https://youtube.com.evil.example/watch?v=1",
  ]) {
    const res = await learner.request.post("/api/speech-suggestions", { data: { videoUrl: url } });
    expect(res.status(), `should refuse ${url}`).toBe(400);
  }

  // Vimeo and TED are the same thing to someone studying a speech.
  for (const url of ["https://vimeo.com/12345", "https://www.ted.com/talks/x"]) {
    const res = await learner.request.post("/api/speech-suggestions", { data: { videoUrl: url } });
    expect([200, 201], `should accept ${url}`).toContain(res.status());
  }
});

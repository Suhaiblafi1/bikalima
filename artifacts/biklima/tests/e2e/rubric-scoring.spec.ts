import { expect, test } from "@playwright/test";
import {
  TEXT_RUBRIC,
  VIDEO_RUBRIC,
  distributeSkillPoints,
  rubricSkills,
  scoreRubric,
  settleSkillPoints,
} from "@workspace/assessment";
import type { Rubric } from "@workspace/assessment";

/**
 * The arithmetic behind every skill point a workbook exercise awards.
 *
 * It gets its own file because none of it needs a browser or a database, and
 * because an off-by-one here is invisible: a learner whose four criteria each
 * rounded up by a point sees a plausible number on their skills map and has no
 * way to know it is wrong.
 */

const RUBRICS: Rubric[] = [TEXT_RUBRIC, VIDEO_RUBRIC];
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const all = (r: Rubric, level: number) =>
  Object.fromEntries(r.criteria.map((c) => [c.key, level]));

test.describe("rubric definitions", () => {
  for (const rubric of RUBRICS) {
    test(`${rubric.key}: every cell is written and no two say the same thing`, () => {
      // A rubric whose lower levels read "less than the level above" buys none
      // of the agreement between graders it exists for, so the descriptors are
      // asserted to be real, distinct prose in both languages.
      const seen = new Set<string>();
      for (const c of rubric.criteria) {
        expect(c.levels, `${c.key} must offer four levels`).toHaveLength(4);
        expect(c.weight).toBeGreaterThan(0);
        for (const level of c.levels) {
          for (const text of [level.descriptorAr, level.descriptorEn]) {
            expect(text.trim().length, `${c.key}/${level.value} descriptor`).toBeGreaterThan(30);
            expect(text).not.toMatch(/TBD|كما سبق|same as above/i);
            expect(seen.has(text), `duplicate descriptor: ${text}`).toBe(false);
            seen.add(text);
          }
        }
        expect(c.levels.map((l) => l.value)).toEqual([1, 2, 3, 4]);
      }
      // 3-6 criteria: fewer cannot describe a speech, more than six and graders
      // stop distinguishing them.
      expect(rubric.criteria.length).toBeGreaterThanOrEqual(3);
      expect(rubric.criteria.length).toBeLessThanOrEqual(6);
    });

    test(`${rubric.key}: criterion keys are unique`, () => {
      const keys = rubric.criteria.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  }

  test("a recording credits the four skills it actually shows", () => {
    expect(rubricSkills(VIDEO_RUBRIC)).toEqual(["voice", "body", "impact", "confidence"]);
    expect(rubricSkills(TEXT_RUBRIC)).toEqual(["idea", "structure", "impact"]);
  });
});

test.describe("scoring", () => {
  for (const rubric of RUBRICS) {
    test(`${rubric.key}: level 3 across the board passes, level 2 does not`, () => {
      expect(scoreRubric(rubric, all(rubric, 3)).suggestedDecision).toBe("pass");
      expect(scoreRubric(rubric, all(rubric, 2)).suggestedDecision).toBe("needs_revision");
      expect(scoreRubric(rubric, all(rubric, 4)).percent).toBe(100);
      expect(scoreRubric(rubric, all(rubric, 1)).percent).toBe(0);
    });

    test(`${rubric.key}: missing, unknown and out-of-range marks are all caught`, () => {
      const partial = { [rubric.criteria[0].key]: 4 };
      const s = scoreRubric(rubric, partial);
      expect(s.complete).toBe(false);
      expect(s.missing).toHaveLength(rubric.criteria.length - 1);

      expect(scoreRubric(rubric, { ...all(rubric, 3), nonsense: 3 }).unexpected).toEqual(["nonsense"]);
      expect(scoreRubric(rubric, { ...all(rubric, 3), [rubric.criteria[0].key]: 5 }).invalid).toEqual([
        rubric.criteria[0].key,
      ]);
    });
  }

  test("one criterion at the bottom level blocks a pass however high the total", () => {
    // Delivered beautifully, says nothing. An average would call this a pass.
    const s = scoreRubric(VIDEO_RUBRIC, { voice: 4, body: 4, impact: 1, composure: 4 });
    expect(s.percent).toBeGreaterThan(VIDEO_RUBRIC.passThreshold * 100);
    expect(s.hasFloorLevel).toBe(true);
    expect(s.suggestedDecision).toBe("needs_revision");
  });
});

test.describe("point distribution", () => {
  for (const rubric of RUBRICS) {
    test(`${rubric.key}: full marks pay exactly the page's points, at every size`, () => {
      for (const pot of [1, 3, 7, 10, 15, 20, 23, 50, 99, 100]) {
        expect(sum(distributeSkillPoints(rubric, all(rubric, 4), pot)), `pot ${pot}`).toBe(pot);
      }
    });

    test(`${rubric.key}: no combination of marks ever overpays`, () => {
      // Exhaustive: 4^criteria level combinations against three pot sizes.
      const n = rubric.criteria.length;
      for (let mask = 0; mask < 4 ** n; mask++) {
        const marks: Record<string, number> = {};
        let m = mask;
        for (const c of rubric.criteria) {
          marks[c.key] = (m % 4) + 1;
          m = Math.floor(m / 4);
        }
        const score = scoreRubric(rubric, marks);
        for (const pot of [7, 20, 23]) {
          const paid = sum(distributeSkillPoints(rubric, marks, pot));
          const earned = Math.round((pot * score.earnedUnits) / score.maxUnits);
          expect(paid, `${JSON.stringify(marks)} @ ${pot}`).toBeLessThanOrEqual(earned);
          expect(paid).toBeLessThanOrEqual(pot);
        }
      }
    });

    test(`${rubric.key}: an incomplete rubric pays nothing at all`, () => {
      expect(distributeSkillPoints(rubric, { [rubric.criteria[0].key]: 4 }, 20)).toEqual({});
      expect(distributeSkillPoints(rubric, all(rubric, 1), 20)).toEqual({});
      expect(distributeSkillPoints(rubric, all(rubric, 4), 0)).toEqual({});
    });
  }

  test("ignoring the brief costs marks but is not itself a skill", () => {
    const met = distributeSkillPoints(TEXT_RUBRIC, { idea_clarity: 4, structure: 4, impact: 4, brief: 4 }, 20);
    const ignored = distributeSkillPoints(TEXT_RUBRIC, { idea_clarity: 4, structure: 4, impact: 4, brief: 1 }, 20);
    expect(sum(met)).toBe(20);
    expect(sum(ignored)).toBeLessThan(20);
    expect(Object.keys(met)).not.toContain("brief");
  });
});

test.describe("re-review settlement", () => {
  const first = distributeSkillPoints(VIDEO_RUBRIC, { voice: 4, body: 3, impact: 3, composure: 2 }, 15);

  test("the same verdict twice moves nothing", () => {
    expect(settleSkillPoints(first, first)).toEqual({});
  });

  test("a downgrade takes back exactly what the pass paid, per skill", () => {
    const back = settleSkillPoints(first, {});
    for (const [key, points] of Object.entries(first)) expect(back[key]).toBe(-points);
  });

  test("raising the marks pays only the difference", () => {
    const raised = distributeSkillPoints(VIDEO_RUBRIC, all(VIDEO_RUBRIC, 4), 15);
    expect(sum(settleSkillPoints(first, raised))).toBe(sum(raised) - sum(first));
  });
});

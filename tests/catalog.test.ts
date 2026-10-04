import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogWhere } from "../src/lib/catalog";
test("filter groups combine as AND, edible categories as OR", () => {
  const w = catalogWhere(
    new URLSearchParams(
      "edibility=EDIBLE,CONDITIONAL&collection=REGIONAL&month=8&q=Boletus&difficulty=2",
    ),
  );
  assert.deepEqual(w.edibility, { in: ["EDIBLE", "CONDITIONAL"] });
  assert.equal(w.collectionStatus, "REGIONAL");
  assert.deepEqual(w.seasonMonths, { has: 8 });
  assert.equal(w.difficulty, 2);
  assert.ok(w.OR);
});
test("published only, ignore malformed enum and month", () => {
  const w = catalogWhere(
    new URLSearchParams("edibility=INVALID&month=99&difficulty=0"),
  );
  assert.equal(w.isPublished, true);
  assert.equal(w.edibility, undefined);
  assert.equal(w.seasonMonths, undefined);
  assert.equal(w.difficulty, undefined);
});
test("account progress filter is scoped to the current user", () => {
  assert.deepEqual(
    catalogWhere(new URLSearchParams("progress=studied"), "u1").progress,
    { some: { userId: "u1", status: "STUDIED" } },
  );
  assert.equal(
    catalogWhere(new URLSearchParams("progress=studied")).progress,
    undefined,
  );
});

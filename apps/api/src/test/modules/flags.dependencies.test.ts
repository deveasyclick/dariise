import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "../../modules/flags/flags.dependencies.js";

const ACTIVE = [
  { key: "a", status: "active" },
  { key: "b", status: "active" },
  { key: "c", status: "archived" },
];

describe("buildDependencyGraph", () => {
  it("evaluates upstream first, then the flag, then its dependents", () => {
    const graph = buildDependencyGraph(
      "b",
      [
        { key: "b", requires: "a", referencedIn: null },
        { key: "c", requires: "b", referencedIn: null },
      ],
      ACTIVE,
    );

    expect(graph.upstream).toEqual(["a"]);
    expect(graph.downstream).toEqual(["c"]);
    expect(graph.evaluationOrder.map((node) => node.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(graph.evaluationOrder[1]).toMatchObject({
      key: "b",
      isSelf: true,
    });
    expect(graph.evaluationOrder[2]?.status).toBe("archived");
    expect(graph.summary).toMatchObject({
      upstream: 1,
      downstream: 1,
      circular: false,
      maxDepth: 1,
    });
  });

  it("reports a cycle without recursing forever", () => {
    const graph = buildDependencyGraph(
      "a",
      [
        { key: "a", requires: "b", referencedIn: null },
        { key: "b", requires: "a", referencedIn: null },
      ],
      ACTIVE,
    );

    expect(graph.summary.circular).toBe(true);
    expect(graph.upstream).toContain("b");
    expect(graph.evaluationOrder.map((node) => node.key)).toContain("a");
  });

  it("is an empty graph when nothing references the flag", () => {
    const graph = buildDependencyGraph("a", [], ACTIVE);

    expect(graph.upstream).toEqual([]);
    expect(graph.downstream).toEqual([]);
    expect(graph.summary.maxDepth).toBe(0);
    expect(graph.evaluationOrder).toEqual([
      { key: "a", status: "active", isSelf: true },
    ]);
  });

  it("counts depth through a chain rather than the number of nodes", () => {
    const graph = buildDependencyGraph(
      "c",
      [
        { key: "b", requires: "a", referencedIn: null },
        { key: "c", requires: "b", referencedIn: null },
      ],
      ACTIVE,
    );

    expect(graph.upstream).toEqual(["a", "b"]);
    expect(graph.summary.maxDepth).toBe(2);
    expect(graph.evaluationOrder.map((node) => node.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

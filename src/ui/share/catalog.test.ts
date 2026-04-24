import { describe, expect, test } from "bun:test";
import { buildResumeAliases, buildSharedResumeCatalog, findSharedResume } from "./catalog";

describe("buildResumeAliases", () => {
  test("creates both kebab and compact aliases", () => {
    expect(buildResumeAliases("dik-rana.mdx")).toEqual(["dik-rana", "dikrana"]);
  });

  test("creates a legacy resume alias for my-resume", () => {
    expect(buildResumeAliases("my-resume.mdx")).toEqual(["my-resume", "myresume", "resume"]);
  });
});

describe("buildSharedResumeCatalog", () => {
  test("adds a default resume alias when only one resume exists", () => {
    const catalog = buildSharedResumeCatalog({
      "../../../docs/dik-rana.mdx": "---\nname: Dik\n---",
    });

    expect(catalog[0]?.aliases).toContain("resume");
  });
});

describe("findSharedResume", () => {
  const catalog = buildSharedResumeCatalog({
    "../../../docs/dik-rana.mdx": "---\nname: Dik\n---",
    "../../../docs/my-resume.mdx": "---\nname: Other\n---",
  });

  test("matches by compact alias", () => {
    expect(findSharedResume(catalog, "dikrana")?.fileName).toBe("dik-rana.mdx");
  });

  test("matches the legacy default resume alias", () => {
    expect(findSharedResume(catalog, "resume")?.fileName).toBe("my-resume.mdx");
  });

  test("returns null for an unknown slug", () => {
    expect(findSharedResume(catalog, "missing")).toBeNull();
  });
});

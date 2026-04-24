import { describe, expect, test } from "bun:test";
import { normalizeResumeSlug, resolveAppRoute } from "./mode";

describe("normalizeResumeSlug", () => {
  test("normalizes filenames and route segments into a slug", () => {
    expect(normalizeResumeSlug(" Dik_Rana.mdx ")).toBe("dik-rana");
  });
});

describe("resolveAppRoute", () => {
  test("uses the default editor mode on the root URL", () => {
    expect(resolveAppRoute({ pathname: "/", search: "", hash: "" })).toEqual({ mode: "editor" });
  });

  test("reads a simple hash route slug", () => {
    expect(resolveAppRoute({ pathname: "/", search: "", hash: "#/dikrana" }))
      .toEqual({ mode: "shared-resume", slug: "dikrana" });
  });

  test("reads a nested hash route slug after /resume", () => {
    expect(resolveAppRoute({ pathname: "/", search: "", hash: "#/resume/dik-rana" }))
      .toEqual({ mode: "shared-resume", slug: "dik-rana" });
  });

  test("reads a resume pathname slug", () => {
    expect(resolveAppRoute({ pathname: "/portfolio/resume/dikrana", search: "", hash: "" }))
      .toEqual({ mode: "shared-resume", slug: "dikrana" });
  });

  test("reads a resume query param", () => {
    expect(resolveAppRoute({ pathname: "/", search: "?resume=dikrana", hash: "" }))
      .toEqual({ mode: "shared-resume", slug: "dikrana" });
  });
});

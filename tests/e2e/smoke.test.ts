import { test, expect } from "bun:test";

test.skip("e2e smoke: run via agent-browser skill", () => {
  // Execution runs via the agent-browser skill:
  //   1. bun run scripts/e2e.ts (keeps server alive)
  //   2. agent-browser skill:
  //      - navigate to URL
  //      - click "See example"
  //      - assert the preview <img> has non-empty src
  //      - click Export PDF; assert a download is triggered
  //      - switch to MDX tab; assert frontmatter is present
  //      - switch to Import tab; paste fixtures/maximal.mdx; confirm Form tab repopulates
  //   3. Assert no console errors.
  expect(true).toBe(true);
});

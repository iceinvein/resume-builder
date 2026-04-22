import { z } from "zod";
import { ResumeSchema } from "../src/schema/resume";

const schema = {
  title: "Resume",
  description:
    "Canonical shape of a resume as parsed from MDX by this tool. See docs/mdx-format.md for the JSX dialect that produces this shape.",
  ...z.toJSONSchema(ResumeSchema),
};

const out = new URL("../public/resume.schema.json", import.meta.url);
await Bun.write(out, JSON.stringify(schema, null, 2) + "\n");
console.log(`wrote ${out.pathname}`);

import { z } from "zod";

export type InlineNode =
  | { t: "text"; v: string }
  | { t: "strong"; c: InlineNode[] }
  | { t: "em"; c: InlineNode[] }
  | { t: "code"; v: string }
  | { t: "link"; u: string; c: InlineNode[] };

export const InlineNodeSchema: z.ZodType<InlineNode> = z.lazy(() =>
  z.union([
    z.object({ t: z.literal("text"), v: z.string() }),
    z.object({ t: z.literal("strong"), c: z.array(InlineNodeSchema) }),
    z.object({ t: z.literal("em"), c: z.array(InlineNodeSchema) }),
    z.object({ t: z.literal("code"), v: z.string() }),
    z.object({ t: z.literal("link"), u: z.string(), c: z.array(InlineNodeSchema) }),
  ]),
);

export const InlineNodesSchema = z.array(InlineNodeSchema);

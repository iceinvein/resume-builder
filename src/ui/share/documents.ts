import { buildSharedResumeCatalog } from "./catalog";

const sharedResumeFiles = import.meta.glob("../../../docs/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const SHARED_RESUME_DOCUMENTS = buildSharedResumeCatalog(sharedResumeFiles);

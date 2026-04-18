import { useEffect, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { parseMdxToResume } from "../../mdx/parse";
import { serializeResumeToMdx } from "../../mdx/serialize";

export type MdxBridge = { text: string; setText: (t: string) => void; error: string | null };

export function useMdxBridge(): MdxBridge {
  const resume = useResumeStore((s) => s.resume);
  const [text, setText] = useState(() => serializeResumeToMdx(resume));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setText(serializeResumeToMdx(resume)); }, [resume]);

  const update = (t: string) => {
    setText(t);
    parseMdxToResume(t)
      .then((r) => { setError(null); resumeStore.setState({ resume: r }); })
      .catch((e: Error) => setError(e.message));
  };

  return { text, setText: update, error };
}

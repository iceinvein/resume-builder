import { useEffect, useState } from "react";
import { TypstClient } from "../typst/client";
import { SvgPage } from "./preview/svg-page";
import { DEFAULT_TEMPLATE_SOURCE } from "../templates/default";
import { exampleResume } from "../schema/defaults";

export function App() {
  const [pages, setPages] = useState<string[]>([]);
  const [err, setErr] = useState<string>("");
  useEffect(() => {
    const c = new TypstClient();
    c.compile(DEFAULT_TEMPLATE_SOURCE, JSON.stringify(exampleResume))
      .then((r) => setPages(r.svgPages))
      .catch((e) => setErr((e as Error).message));
    return () => c.terminate();
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Resume Builder</h1>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {pages.map((svg, i) => <SvgPage key={i} svg={svg} zoom={1} />)}
    </div>
  );
}

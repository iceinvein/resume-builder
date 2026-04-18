import { useEffect, useState } from "react";
import { TypstClient } from "../typst/client";
import { SvgPage } from "./preview/svg-page";

const HELLO = `#set page(width: 4in, height: 2in)\n= Hello Typst`;

export function App() {
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  useEffect(() => {
    const c = new TypstClient();
    c.compile(HELLO, "{}")
      .then((r) => setSvg(r.svgPages[0] ?? ""))
      .catch((e) => setErr((e as Error).message));
    return () => c.terminate();
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Resume Builder</h1>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {svg && <SvgPage svg={svg} zoom={1} />}
    </div>
  );
}

import { useState } from "react";
import { parseMdxToResume } from "../../mdx/parse";
import { resumeStore } from "../../state/store";

export function ImportTab() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOk] = useState<string | null>(null);

  const handleImport = async (source: string) => {
    try {
      const resume = await parseMdxToResume(source);
      resumeStore.setState({ resume, tab: "form" });
      setOk("Imported. Switched to Form tab.");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOk(null);
    }
  };

  const onFile = async (f: File) => {
    const src = await f.text();
    setText(src);
    await handleImport(src);
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        style={{ border: "2px dashed #d9d6ce", padding: 32, textAlign: "center", borderRadius: 6 }}
      >
        Drop an .mdx file here
        <div>
          <input type="file" accept=".mdx,.md,text/markdown" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
      </div>
      <div>or paste MDX below:</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: 240, fontFamily: "ui-monospace, monospace", fontSize: 13 }}
      />
      <div><button onClick={() => handleImport(text)}>Import pasted MDX</button></div>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {okMessage && <div style={{ color: "green" }}>{okMessage}</div>}
    </div>
  );
}

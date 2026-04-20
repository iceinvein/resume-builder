import { useState } from "react";
import { parseMdxToResume } from "../../mdx/parse";
import { resumeStore } from "../../state/store";
import { emptyResume } from "../../schema/defaults";
import type { Resume } from "../../schema/resume";
import { Button } from "../primitives/button";

function isResumeDirty(r: Resume): boolean {
  return JSON.stringify(r) !== JSON.stringify(emptyResume);
}

type PendingReplace = { resume: Resume; summary: string };

export function ImportTab() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingReplace | null>(null);

  const commit = (resume: Resume, source: string) => {
    resumeStore.setState({ resume, tab: "form" });
    setText(source);
    setOk("Imported. Switched to Form tab.");
    setError(null);
    setPending(null);
  };

  const attemptImport = async (source: string) => {
    try {
      const resume = await parseMdxToResume(source);
      const current = resumeStore.getState().resume;
      if (isResumeDirty(current)) {
        const expCount = resume.experience.length;
        const summary = `${resume.meta.name || "Unnamed resume"}, ${expCount} experience ${expCount === 1 ? "entry" : "entries"}.`;
        setPending({ resume, summary });
        setError(null);
        setOk(null);
        return;
      }
      commit(resume, source);
    } catch (e) {
      setError((e as Error).message);
      setOk(null);
      setPending(null);
    }
  };

  const onFile = async (f: File) => {
    const src = await f.text();
    setText(src);
    await attemptImport(src);
  };

  return (
    <div style={{ padding: "var(--space-lg)", display: "grid", gap: "var(--space-md)" }}>
      {pending && (
        <div
          role="alertdialog"
          aria-label="Replace current draft"
          className="card"
          style={{ display: "grid", gap: "var(--space-sm)", background: "var(--color-warning-soft)", borderColor: "transparent", color: "var(--color-warning-soft-text)" }}
        >
          <strong style={{ fontWeight: "var(--weight-semibold)" }}>Replace current draft?</strong>
          <p className="caption" style={{ color: "inherit" }}>
            Your current draft will be overwritten with: {pending.summary}
          </p>
          <div style={{ display: "flex", gap: "var(--space-xs)" }}>
            <Button variant="primary" size="sm" onClick={() => commit(pending.resume, text)}>
              Replace draft
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Keep current
            </Button>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        style={{
          border: "var(--border-strong) dashed var(--color-border)",
          padding: "var(--space-xl)",
          textAlign: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface-muted)",
          color: "var(--color-text-secondary)",
        }}
      >
        Drop an .mdx file here
        <div style={{ marginTop: "var(--space-xs)" }}>
          <input
            type="file"
            accept=".mdx,.md,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>
      </div>
      <div style={{ color: "var(--color-text-secondary)" }}>or paste MDX below:</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono"
        style={{ width: "100%", minHeight: 240 }}
      />
      <div>
        <Button variant="primary" onClick={() => attemptImport(text)}>Import pasted MDX</Button>
      </div>
      {error && (
        <div
          role="alert"
          style={{
            color: "var(--color-danger-soft-text)",
            background: "var(--color-danger-soft)",
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-sm)",
            display: "grid",
            gap: "var(--space-2xs)",
          }}
        >
          <strong style={{ fontWeight: "var(--weight-semibold)" }}>
            Couldn't parse that MDX.
          </strong>
          <p className="caption" style={{ color: "inherit" }}>
            Check the file follows the resume MDX format. Details from the parser:
          </p>
          <pre
            className="font-mono"
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: "var(--text-xs)",
              lineHeight: "var(--leading-snug)",
            }}
          >
            {error}
          </pre>
        </div>
      )}
      {okMessage && (
        <div role="status" className="caption" style={{ color: "var(--color-success-soft-text)" }}>
          {okMessage}
        </div>
      )}
    </div>
  );
}

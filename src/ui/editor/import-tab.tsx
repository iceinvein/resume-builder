import { useEffect, useMemo, useRef, useState } from "react";
import { parseMdxToResume } from "../../mdx/parse";
import { resumeStore } from "../../state/store";
import { useResumeStore } from "../shell/use-store";
import { emptyResume } from "../../schema/defaults";
import type { Resume } from "../../schema/resume";
import { Button } from "../primitives/button";
import { Kbd } from "../theme/kbd";
import "./import-tab.css";

const PARSE_DEBOUNCE_MS = 250;

type Source = "drop" | "paste" | "browse" | null;
type ParseStatus = "idle" | "parsing" | "ok" | "error";

function isResumeDirty(r: Resume): boolean {
  return JSON.stringify(r) !== JSON.stringify(emptyResume);
}

function experienceLabel(n: number): string {
  return `${n} experience ${n === 1 ? "entry" : "entries"}`;
}

function UploadIcon() {
  return (
    <svg
      className="import-tab-dropzone-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function ImportTab() {
  const currentResume = useResumeStore((s) => s.resume);
  const dirty = useMemo(() => isResumeDirty(currentResume), [currentResume]);

  const [text, setText] = useState("");
  const [source, setSource] = useState<Source>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);

  const [parsed, setParsed] = useState<Resume | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");

  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the uncontrolled textarea's value in sync with state without React
  // mirroring the string into the DOM as a text child. happy-dom copies the
  // `value` prop into a text node at query time; that makes `getByText` match
  // the raw buffer (including "Plan Test" in the MDX frontmatter) even while
  // parsing is still in progress, which ruins the pill assertions. Assigning
  // via ref keeps the DOM tree free of that phantom text node.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.value !== text) el.value = text;
  }, [text]);

  useEffect(() => {
    if (!text) {
      setParsed(null);
      setParseError(null);
      setParseStatus("idle");
      return;
    }
    setParseStatus("parsing");
    let cancelled = false;
    const handle = setTimeout(() => {
      parseMdxToResume(text)
        .then((r) => {
          if (cancelled) return;
          setParsed(r);
          setParseError(null);
          setParseStatus("ok");
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setParsed(null);
          setParseError(e.message);
          setParseStatus("error");
        });
    }, PARSE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [text]);

  // While the buffer is empty, listen for document-level paste events so the
  // user can paste MDX anywhere on the tab without first focusing the region.
  // Once the buffer has content, the textarea handles paste natively and we
  // stop listening to avoid stealing paste from normal edit flows.
  useEffect(() => {
    if (text) return;
    const onDocPaste = (e: ClipboardEvent) => {
      const cd = e.clipboardData;
      const pasted = cd?.getData("text/plain") || cd?.getData("text") || "";
      if (!pasted) return;
      e.preventDefault();
      setText(pasted);
      setSource("paste");
      setSourceName(null);
    };
    document.addEventListener("paste", onDocPaste);
    return () => document.removeEventListener("paste", onDocPaste);
  }, [text]);

  const onFile = async (f: File, from: Source) => {
    const src = await f.text();
    setText(src);
    setSource(from);
    setSourceName(f.name);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const ok =
      f.type === "text/markdown" ||
      f.name.endsWith(".mdx") ||
      f.name.endsWith(".md");
    if (!ok) {
      setText("");
      setSource(null);
      setSourceName(null);
      setParsed(null);
      setParseError(`Unsupported file type: ${f.type || "unknown"}`);
      setParseStatus("error");
      return;
    }
    onFile(f, "drop");
  };

  const onClear = () => {
    setText("");
    setSource(null);
    setSourceName(null);
    setParsed(null);
    setParseError(null);
    setParseStatus("idle");
  };

  const onImport = () => {
    if (!parsed) return;
    resumeStore.setState({ resume: parsed, tab: "form" });
  };

  const statusChip =
    parseStatus === "ok" ? { label: "Parsed", cls: "is-ok" as const }
    : parseStatus === "error" ? { label: "Error", cls: "is-error" as const }
    : !text ? { label: "Empty", cls: "" as const }
    : parseStatus === "parsing" ? { label: "Parsing…", cls: "" as const }
    : { label: `${text.split("\n").length} ln`, cls: "" as const };

  const pill = !text ? null
    : parseStatus === "parsing" ? { tone: "neutral" as const, label: "Parsing", body: "…" }
    : parseStatus === "error" && parseError ? {
        tone: "error" as const,
        label: "Parse error",
        body: parseError.split("\n")[0] ?? parseError,
      }
    : parsed ? {
        tone: "neutral" as const,
        label: "Parsed",
        body: `${parsed.meta.name || "Untitled"}, ${experienceLabel(parsed.experience.length)}`,
      }
    : null;

  const canImport = Boolean(parsed);

  return (
    <div
      className="import-tab"
      role="region"
      aria-label="Import MDX"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDragging(false);
      }}
      onDrop={onDrop}
      tabIndex={0}
    >
      <div className="import-tab-toolbar">
        <span className="import-tab-title">
          <span className="import-tab-title-dot" aria-hidden />
          Import MDX
        </span>
        <div className="import-tab-toolbar-right">
          <span className={`import-tab-status-chip ${statusChip.cls}`}>
            {statusChip.label}
          </span>
          {text && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div
        className={
          "import-tab-surface" +
          (isDragging ? " is-dragging" : "") +
          (text ? " is-filled" : "")
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mdx,.md,text/markdown"
          className="import-tab-file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f, "browse");
            e.target.value = "";
          }}
        />

        {!text && (
          <div className="import-tab-dropzone">
            <UploadIcon />
            <span className="import-tab-dropzone-headline">
              {isDragging ? "Drop to load" : "Drop an .mdx file here"}
            </span>
            <span className="import-tab-dropzone-row">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </Button>
              <span>or</span>
              <Kbd>⌘V</Kbd>
              <span>paste to fill the canvas</span>
            </span>
            <span className="import-tab-dropzone-caption">
              Frontmatter plus MDX body with &lt;Experience&gt;, &lt;Project&gt;,
              and &lt;Skill&gt; blocks.
            </span>
          </div>
        )}

        {text && (
          <>
            <div className="import-tab-source-hint">
              {source === "drop" && sourceName ? `Loaded from ${sourceName}`
                : source === "browse" && sourceName ? `Loaded from ${sourceName}`
                : "Pasted content"}
            </div>
            <textarea
              ref={textareaRef}
              className="import-tab-preview font-mono"
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              aria-label="MDX buffer"
            />
          </>
        )}
      </div>

      <div className="import-tab-action-bar">
        <div
          className={`import-tab-pill ${pill?.tone === "error" ? "is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {pill && (
            <>
              <span className="import-tab-pill-label">{pill.label}</span>
              <span className="import-tab-pill-body">{pill.body}</span>
            </>
          )}
        </div>
        <div className="import-tab-action-bar-right">
          {dirty && parsed && (
            <span className="import-tab-warning-badge" role="note">
              Replaces current draft
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onImport}
            disabled={!canImport}
          >
            {dirty && parsed ? "Replace draft" : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
}

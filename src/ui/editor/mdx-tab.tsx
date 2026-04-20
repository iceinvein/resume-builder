import { useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import {
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useMdxBridge } from "./use-mdx-bridge";
import "./mdx-editor.css";

type CursorPos = { line: number; col: number };

const highlight = HighlightStyle.define([
  { tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6], class: "tok-heading" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: [t.link, t.url], class: "tok-link" },
  { tag: [t.keyword, t.tagName, t.attributeName, t.modifier], class: "tok-keyword" },
  { tag: [t.string, t.special(t.string), t.regexp], class: "tok-string" },
  { tag: [t.number, t.bool, t.null, t.atom], class: "tok-number" },
  { tag: [t.propertyName, t.definition(t.propertyName), t.variableName], class: "tok-property" },
  { tag: [t.meta, t.processingInstruction, t.annotation], class: "tok-meta" },
  { tag: [t.comment, t.lineComment, t.blockComment], class: "tok-comment" },
  { tag: [t.bracket, t.paren, t.brace, t.squareBracket, t.punctuation, t.separator, t.operator], class: "tok-punct" },
  { tag: t.quote, class: "tok-quote" },
  { tag: [t.monospace, t.special(t.variableName)], class: "tok-monospace" },
]);

function cursorOf(view: EditorView): CursorPos {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  return { line: line.number, col: head - line.from + 1 };
}

export function MdxTab() {
  const { text, setText, error } = useMdxBridge();
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [cursor, setCursor] = useState<CursorPos>({ line: 1, col: 1 });
  const [stats, setStats] = useState({ lines: 1, chars: 0 });

  const extensions = useMemo(
    () => [
      history(),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      placeholderExt("--- \n# Start writing your resume in MDX …"),
      EditorView.lineWrapping,
      syntaxHighlighting(highlight),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
    ],
    [],
  );

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: text,
        extensions: [
          ...extensions,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              setText(v.state.doc.toString());
              setStats({ lines: v.state.doc.lines, chars: v.state.doc.length });
            }
            if (v.docChanged || v.selectionSet) {
              setCursor(cursorOf(v.view));
            }
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    setStats({ lines: view.state.doc.lines, chars: view.state.doc.length });
    setCursor(cursorOf(view));
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === text) return;
    v.dispatch({ changes: { from: 0, to: current.length, insert: text } });
    setStats({ lines: v.state.doc.lines, chars: v.state.doc.length });
  }, [text]);

  return (
    <div className="mdx-editor">
      <div className="mdx-editor-toolbar">
        <span className="mdx-editor-filename">
          <span className="mdx-editor-filename-dot" aria-hidden />
          resume.mdx
          <span className="mdx-editor-filename-path">/ draft</span>
        </span>
        <span className="mdx-editor-meta">
          <span className="mdx-editor-meta-chip">MDX</span>
          <span>{stats.lines.toLocaleString()} ln</span>
          <span>{stats.chars.toLocaleString()} ch</span>
        </span>
      </div>

      {error && (
        <div role="alert" className="mdx-editor-error">
          <span className="mdx-editor-error-label">Parse error</span>
          <span className="mdx-editor-error-body">{error}</span>
        </div>
      )}

      <div ref={hostRef} className="mdx-editor-host" />

      <div className="mdx-editor-status" role="status" aria-live="polite">
        <span className="mdx-editor-status-group">
          <span className="mdx-editor-status-item">
            <span className={`mdx-editor-status-dot${error ? " is-error" : ""}`} aria-hidden />
            {error ? "Invalid" : "In sync"}
          </span>
          <span className="mdx-editor-status-item">
            <strong>Ln</strong> {cursor.line}
            <span className="mdx-editor-status-item-muted">,</span>
            <strong>Col</strong> {cursor.col}
          </span>
        </span>
        <span className="mdx-editor-status-group">
          <span className="mdx-editor-status-item">Markdown + JSX</span>
          <span className="mdx-editor-status-item">UTF-8</span>
          <span className="mdx-editor-status-item">LF</span>
        </span>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { useMdxBridge } from "./use-mdx-bridge";

export function MdxTab() {
  const { text, setText, error } = useMdxBridge();
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: text,
        extensions: [
          history(),
          lineNumbers(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          EditorView.updateListener.of((v) => {
            if (v.docChanged) setText(v.state.doc.toString());
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === text) return;
    v.dispatch({ changes: { from: 0, to: current.length, insert: text } });
  }, [text]);

  return (
    <div style={{ padding: 0, height: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
      {error && (
        <div style={{ background: "#fce5e5", color: "#8a1f1f", padding: "8px 16px", fontSize: 12 }}>
          {error}
        </div>
      )}
      <div ref={hostRef} style={{ height: "100%", fontSize: 13 }} />
    </div>
  );
}

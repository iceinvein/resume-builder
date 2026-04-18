import { useEffect, useRef, useState } from "react";
import { TopBar } from "./shell/top-bar";
import { Tabs } from "./shell/tabs";
import { TwoPane } from "./shell/layout";
import { useResumeStore } from "./shell/use-store";
import { bindAutosave, hydrate } from "../state/persist";
import { resumeStore } from "../state/store";
import { FormTab } from "./form/form-tab";
import { MdxTab } from "./editor/mdx-tab";
import { ImportTab } from "./editor/import-tab";
import { PreviewPane } from "./preview/preview-pane";
import { EmptyState } from "./shell/empty-state";
import { emptyResume } from "../schema/defaults";
import { useShortcuts } from "./shell/shortcuts";

export function App() {
  const tab = useResumeStore((s) => s.tab);
  const resume = useResumeStore((s) => s.resume);
  const isFirstRun = resume.meta.name === emptyResume.meta.name && resume.experience.length === 0;
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const exportRef = useRef<() => Promise<Uint8Array>>(async () => new Uint8Array());

  useShortcuts({ onSave: () => setLastSavedAt(Date.now()) });

  useEffect(() => {
    hydrate(resumeStore).then(() => setLastSavedAt(Date.now()));
    const unsub = resumeStore.subscribe(() => setLastSavedAt(Date.now()));
    const stop = bindAutosave(resumeStore);
    return () => { unsub(); stop(); };
  }, []);

  return (
    <>
      <TopBar onExport={async () => {
        const pdf = await exportRef.current();
        const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${resumeStore.getState().name}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      }} lastSavedAt={lastSavedAt} />
      <Tabs />
      <TwoPane
        left={isFirstRun ? <EmptyState /> : (tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <ImportTab />)}
        right={<PreviewPane onExportReady={(fn) => { exportRef.current = fn; }} />}
      />
    </>
  );
}

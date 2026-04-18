import { useEffect, useState } from "react";
import { TopBar } from "./shell/top-bar";
import { Tabs } from "./shell/tabs";
import { TwoPane } from "./shell/layout";
import { useResumeStore } from "./shell/use-store";
import { bindAutosave, hydrate } from "../state/persist";
import { resumeStore } from "../state/store";
import { FormTab } from "./form/form-tab";
import { MdxTab } from "./editor/mdx-tab";
import { ImportTab } from "./editor/import-tab";

export function App() {
  const tab = useResumeStore((s) => s.tab);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    hydrate(resumeStore).then(() => setLastSavedAt(Date.now()));
    const unsub = resumeStore.subscribe(() => setLastSavedAt(Date.now()));
    const stop = bindAutosave(resumeStore);
    return () => { unsub(); stop(); };
  }, []);

  return (
    <>
      <TopBar onExport={() => {}} lastSavedAt={lastSavedAt} />
      <Tabs />
      <TwoPane
        left={tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <ImportTab />}
        right={<div style={{ padding: 24 }}>Preview goes here</div>}
      />
    </>
  );
}

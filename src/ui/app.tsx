import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { emptyResume, exampleResume } from "../schema/defaults";
import { useShortcuts } from "./shell/shortcuts";
import { probeEnv, type EnvStatus } from "./shell/env-check";
import { ToastPortal } from "./theme/toast-portal";
import { pushToast } from "../state/toasts";
import { safeFilename } from "./shell/filename";
import { CommandPalette, type Command } from "./shell/command-palette";
import { softRemove } from "../state/undo";

export function App() {
  const tab = useResumeStore((s) => s.tab);
  const resume = useResumeStore((s) => s.resume);
  const isFirstRun = resume.meta.name === emptyResume.meta.name && resume.experience.length === 0;
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const [exporting, setExporting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => { probeEnv().then(setEnv); }, []);
  const exportRef = useRef<() => Promise<Uint8Array>>(async () => new Uint8Array());

  const exportPdf = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const pdf = await exportRef.current();
      const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
      const filename = safeFilename(resumeStore.getState().name, "pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      pushToast({
        message: `Exported ${filename}`,
        tone: "success",
        action: {
          label: "Export again",
          run: () => { void exportPdf(); },
        },
      });
    } catch (e) {
      const message = (e as Error)?.message ?? "Unknown error";
      pushToast({
        message: `Export failed: ${message}`,
        tone: "danger",
        ttlMs: 10000,
      });
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  useShortcuts({
    onSave: () => setLastSavedAt(Date.now()),
    onCommandPalette: () => setPaletteOpen((o) => !o),
    onExport: () => { void exportPdf(); },
    onTab1: () => resumeStore.setState({ tab: "form" }),
    onTab2: () => resumeStore.setState({ tab: "mdx" }),
    onTab3: () => resumeStore.setState({ tab: "import" }),
  });

  const commands = useMemo<Command[]>(() => {
    const store = resumeStore.getState;
    return [
      {
        id: "export-pdf",
        title: "Export PDF",
        hint: "Produce and download the resume PDF",
        shortcut: ["⌘", "⇧", "E"],
        run: () => { void exportPdf(); },
      },
      {
        id: "tab-form",
        title: "Go to Form",
        hint: "Structured fields for every section",
        shortcut: ["⌘", "1"],
        run: () => store().setTab("form"),
      },
      {
        id: "tab-mdx",
        title: "Go to MDX",
        hint: "Edit the raw source",
        shortcut: ["⌘", "2"],
        run: () => store().setTab("mdx"),
      },
      {
        id: "tab-import",
        title: "Go to Import",
        hint: "Paste or drop an .mdx file",
        shortcut: ["⌘", "3"],
        run: () => store().setTab("import"),
      },
      {
        id: "add-experience",
        title: "Add experience",
        hint: "Append a new role to the Experience section",
        run: () => {
          store().setTab("form");
          store().addExperience();
        },
      },
      {
        id: "add-education",
        title: "Add education",
        run: () => {
          store().setTab("form");
          store().addEducation();
        },
      },
      {
        id: "add-project",
        title: "Add project",
        run: () => {
          store().setTab("form");
          store().addProject();
        },
      },
      {
        id: "add-skills-group",
        title: "Add skills group",
        run: () => {
          store().setTab("form");
          store().addSkillsGroup();
        },
      },
      {
        id: "add-extra",
        title: "Add additional section",
        hint: "Certifications, awards, and similar",
        run: () => {
          store().setTab("form");
          store().addExtra();
        },
      },
      {
        id: "load-example",
        title: "Load example resume",
        hint: "Replace your draft with a worked example",
        run: () => {
          softRemove("Replaced draft with example", () => {
            resumeStore.setState({ resume: exampleResume, tab: "form" });
          });
        },
      },
      {
        id: "reset-draft",
        title: "Reset draft",
        hint: "Clear the form back to empty",
        run: () => {
          softRemove("Reset draft", () => {
            resumeStore.setState({ resume: emptyResume, tab: "form" });
          });
        },
      },
    ];
  }, [exportPdf]);

  useEffect(() => {
    hydrate(resumeStore).then(() => setLastSavedAt(Date.now()));
    const unsub = resumeStore.subscribe(() => setLastSavedAt(Date.now()));
    const stop = bindAutosave(resumeStore);
    return () => { unsub(); stop(); };
  }, []);

  return (
    <>
      <TopBar onExport={exportPdf} exporting={exporting} lastSavedAt={lastSavedAt} />
      {env && !env.idb && (
        <div
          role="status"
          className="caption"
          style={{
            background: "var(--color-warning-soft)",
            color: "var(--color-warning-soft-text)",
            padding: "var(--space-xs) var(--space-md)",
          }}
        >
          Your browser is blocking local storage. Your resume will not be saved.
        </div>
      )}
      {env && !env.wasm && (
        <div
          role="status"
          className="caption"
          style={{
            background: "var(--color-danger-soft)",
            color: "var(--color-danger-soft-text)",
            padding: "var(--space-xs) var(--space-md)",
          }}
        >
          Your browser can't run the renderer. Please use Chrome, Firefox, or Safari 16+.
        </div>
      )}
      <Tabs />
      <TwoPane
        left={isFirstRun ? <EmptyState /> : (tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <ImportTab />)}
        right={<PreviewPane onExportReady={(fn) => { exportRef.current = fn; }} />}
      />
      <CommandPalette
        open={paletteOpen}
        commands={commands}
        onClose={() => setPaletteOpen(false)}
      />
      <ToastPortal />
    </>
  );
}

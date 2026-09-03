import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SharedTopBar, TopBar } from "./shell/top-bar";
import { Tabs } from "./shell/tabs";
import { TwoPane } from "./shell/layout";
import { useResumeStore } from "./shell/use-store";
import { bindAutosave, hydrate } from "../state/persist";
import { resumeStore, isFirstRun as isFirstRunState } from "../state/store";
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
import { parseMdxToResume } from "../mdx/parse";
import { downloadBlob, downloadTextFile } from "./share/download";
import { resolveAppRoute } from "./share/mode";
import { findSharedResume, type SharedResumeEntry } from "./share/catalog";
import { SHARED_RESUME_DOCUMENTS } from "./share/documents";
import { SharedResumePanel } from "./share/shared-resume-panel";

type SharedResumeStatus = "idle" | "loading" | "ready" | "error";

export function App() {
  const [route, setRoute] = useState(() => resolveAppRoute(window.location));
  const tab = useResumeStore((s) => s.tab);
  const resume = useResumeStore((s) => s.resume);
  const isSharedResume = route.mode === "shared-resume";
  const started = useResumeStore((s) => s.started);
  const isFirstRun = isFirstRunState({ resume, started });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const [exporting, setExporting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sharedResumeStatus, setSharedResumeStatus] = useState<SharedResumeStatus>(
    isSharedResume ? "loading" : "idle",
  );
  const [sharedResumeError, setSharedResumeError] = useState<string | null>(null);
  const [activeSharedResume, setActiveSharedResume] = useState<SharedResumeEntry | null>(null);
  useEffect(() => { probeEnv().then(setEnv); }, []);
  const exportRef = useRef<() => Promise<Uint8Array>>(async () => new Uint8Array());

  const exportPdf = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const pdf = await exportRef.current();
      const blob = new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" });
      const filename = safeFilename(resumeStore.getState().name, "pdf");
      downloadBlob(blob, filename);
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

  const downloadSource = useCallback(() => {
    const source = activeSharedResume?.source;
    const filename = activeSharedResume?.fileName;
    if (!source || !filename) return;
    downloadTextFile(source, filename, "text/markdown;charset=utf-8");
    pushToast({
      message: `Downloaded ${filename}`,
      tone: "success",
    });
  }, [activeSharedResume]);

  useShortcuts({
    onExport: () => { void exportPdf(); },
    ...(isSharedResume ? {} : {
      onSave: () => setLastSavedAt(Date.now()),
      onCommandPalette: () => setPaletteOpen((o) => !o),
      onTab1: () => resumeStore.setState({ tab: "form" }),
      onTab2: () => resumeStore.setState({ tab: "mdx" }),
      onTab3: () => resumeStore.setState({ tab: "import" }),
    }),
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
    const syncRoute = () => setRoute(resolveAppRoute(window.location));
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  useEffect(() => {
    exportRef.current = async () => new Uint8Array();
    let cancelled = false;

    if (isSharedResume) {
      setPaletteOpen(false);
      setLastSavedAt(null);
      setSharedResumeStatus("loading");
      setSharedResumeError(null);
      const requestedSlug = route.mode === "shared-resume" ? route.slug : "";
      const sharedDocument = findSharedResume(SHARED_RESUME_DOCUMENTS, requestedSlug);
      setActiveSharedResume(sharedDocument);
      resumeStore.setState({ resume: emptyResume, name: "Resume", tab: "form" });

      if (!sharedDocument) {
        setSharedResumeStatus("error");
        setSharedResumeError(
          SHARED_RESUME_DOCUMENTS.length > 0
            ? `No shared resume matches "${requestedSlug}".`
            : `No shared resumes were found in docs/*.mdx.`,
        );
        return () => {
          cancelled = true;
        };
      }

      parseMdxToResume(sharedDocument.source)
        .then((parsedResume) => {
          if (cancelled) return;
          const sharedName = parsedResume.meta.name || "Resume";
          resumeStore.setState({ resume: parsedResume, name: sharedName, tab: "form" });
          setSharedResumeStatus("ready");
        })
        .catch((error: Error) => {
          if (cancelled) return;
          setSharedResumeStatus("error");
          setSharedResumeError(error.message);
        });

      return () => {
        cancelled = true;
      };
    }

    setSharedResumeStatus("idle");
    setSharedResumeError(null);
    setActiveSharedResume(null);
    hydrate(resumeStore).then(() => {
      if (!cancelled) setLastSavedAt(Date.now());
    });
    const unsub = resumeStore.subscribe(() => setLastSavedAt(Date.now()));
    const stop = bindAutosave(resumeStore);
    return () => {
      cancelled = true;
      unsub();
      stop();
    };
  }, [isSharedResume, route]);

  const sharedLeft =
    sharedResumeStatus === "error" ? (
      <div style={{ padding: "var(--space-lg)" }}>
        <div className="card" role="alert" style={{ display: "grid", gap: "var(--space-sm)" }}>
          <strong>Couldn&apos;t load the shared resume</strong>
          <span className="caption" style={{ color: "var(--color-danger-soft-text)" }}>
            {sharedResumeError}
          </span>
        </div>
      </div>
    ) : sharedResumeStatus === "ready" ? (
      <SharedResumePanel />
    ) : (
      <div style={{ padding: "var(--space-lg)" }}>
        <div className="card" role="status">Loading shared resume…</div>
      </div>
    );

  const sharedRight =
    sharedResumeStatus === "ready" ? (
      <PreviewPane onExportReady={(fn) => { exportRef.current = fn; }} />
    ) : (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: "var(--space-lg)",
          color: "var(--color-text-secondary)",
        }}
      >
        {sharedResumeStatus === "error" ? "The resume preview could not be prepared." : "Preparing preview…"}
      </div>
    );

  return (
    <>
      {isSharedResume ? (
        <SharedTopBar
          onDownloadSource={downloadSource}
          onExport={() => { void exportPdf(); }}
          exporting={exporting}
          exportDisabled={sharedResumeStatus !== "ready" || !activeSharedResume}
          downloadDisabled={!activeSharedResume}
        />
      ) : (
        <TopBar onExport={exportPdf} exporting={exporting} lastSavedAt={lastSavedAt} />
      )}
      {env && !env.idb && !isSharedResume && (
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
      {!isSharedResume && <Tabs />}
      <TwoPane
        left={
          isSharedResume ? sharedLeft
          : tab === "import" ? <ImportTab />
          : isFirstRun ? <EmptyState />
          : tab === "form" ? <FormTab />
          : <MdxTab />
        }
        right={
          isSharedResume ? sharedRight
          : <PreviewPane onExportReady={(fn) => { exportRef.current = fn; }} />
        }
      />
      {!isSharedResume && (
        <CommandPalette
          open={paletteOpen}
          commands={commands}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      <ToastPortal />
    </>
  );
}

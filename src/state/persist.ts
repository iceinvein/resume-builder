import { get, set } from "idb-keyval";
import type { StoreApi } from "zustand/vanilla";
import type { Resume } from "../schema/resume";
import type { ResumeStore } from "./store";

const KEY = "current-resume";

export type PersistedState = {
  resume: Resume;
  name: string;
  // Absent in drafts saved before the first-run flag existed.
  started?: boolean;
};

export async function hydrate(store: StoreApi<ResumeStore>): Promise<void> {
  try {
    const saved = await get<PersistedState>(KEY);
    if (saved) {
      store.setState({
        resume: saved.resume,
        name: saved.name,
        started: saved.started ?? false,
      });
    }
  } catch {
    // IDB unavailable; proceed with defaults.
  }
}

export function bindAutosave(store: StoreApi<ResumeStore>, debounceMs = 1000): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsub = store.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      set(KEY, {
        resume: state.resume,
        name: state.name,
        started: state.started,
      }).catch(() => {});
    }, debounceMs);
  });
  return () => { unsub(); if (timer) clearTimeout(timer); };
}

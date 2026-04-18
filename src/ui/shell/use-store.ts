import { useSyncExternalStore } from "react";
import { resumeStore, type ResumeStore } from "../../state/store";

export function useResumeStore<T>(selector: (s: ResumeStore) => T): T {
  return useSyncExternalStore(
    resumeStore.subscribe,
    () => selector(resumeStore.getState()),
    () => selector(resumeStore.getState()),
  );
}

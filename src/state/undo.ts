import { resumeStore } from "./store";
import { pushToast } from "./toasts";

/**
 * Perform a destructive resume mutation with an undo affordance. Snapshots
 * the entire resume before the mutation so the undo is always a whole-state
 * rollback (no partial-restore footguns if the removed item referenced
 * sibling state).
 */
export function softRemove(message: string, perform: () => void): void {
  const snapshot = resumeStore.getState().resume;
  perform();
  pushToast({
    message,
    action: {
      label: "Undo",
      run: () => resumeStore.setState({ resume: snapshot }),
    },
  });
}

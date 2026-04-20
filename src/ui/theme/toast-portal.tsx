import { Button } from "./button";
import { dismissToast, pauseToastTimers, useToasts } from "../../state/toasts";

export function ToastPortal() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div
      className="toast-stack"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      onMouseEnter={() => pauseToastTimers(true)}
      onMouseLeave={() => pauseToastTimers(false)}
    >
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role="status">
          <span className="toast-message">{t.message}</span>
          {t.action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                t.action!.run();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}

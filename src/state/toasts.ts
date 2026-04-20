/*
 * Toast queue. Minimal, dependency-free. Used for undo affordances on
 * destructive actions and quiet status confirmations.
 *
 * Toasts have a default TTL of 6 seconds. Auto-dismiss does not fire while
 * the user is hovering the toast stack, preventing the "I was about to click
 * undo and it vanished" footgun.
 */

import { useSyncExternalStore } from "react";

export type ToastAction = {
  label: string;
  run: () => void;
};

export type Toast = {
  id: number;
  message: string;
  action?: ToastAction;
  tone: "neutral" | "success" | "danger";
  createdAt: number;
  ttlMs: number;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];
let paused = false;
let nextId = 1;

function emit() {
  for (const l of listeners) l();
}

function scheduleDismiss(id: number, ttlMs: number) {
  const run = () => {
    if (paused) {
      // Check back shortly; the user may still be hovering.
      window.setTimeout(run, 500);
      return;
    }
    dismissToast(id);
  };
  window.setTimeout(run, ttlMs);
}

export function pushToast(opts: {
  message: string;
  action?: ToastAction;
  tone?: Toast["tone"];
  ttlMs?: number;
}): number {
  const id = nextId++;
  const toast: Toast = {
    id,
    message: opts.message,
    tone: opts.tone ?? "neutral",
    createdAt: Date.now(),
    ttlMs: opts.ttlMs ?? 6000,
    ...(opts.action ? { action: opts.action } : {}),
  };
  toasts = [...toasts, toast];
  emit();
  scheduleDismiss(id, toast.ttlMs);
  return id;
}

export function dismissToast(id: number) {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function pauseToastTimers(next: boolean) {
  paused = next;
}

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return toasts;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

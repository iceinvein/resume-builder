import type { ReactNode } from "react";

export function TwoPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, height: "calc(100vh - 90px)" }}>
      <div style={{ overflow: "auto", borderRight: "1px solid #e6e3dd" }}>{left}</div>
      <div style={{ overflow: "auto", background: "#f3f1ea" }}>{right}</div>
    </div>
  );
}

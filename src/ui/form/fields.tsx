import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

const baseField = {
  display: "block" as const,
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d9d6ce",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "inherit",
};

export function Label({ children }: { children: ReactNode }) {
  return <label style={{ fontSize: 12, color: "#4a4a4a", letterSpacing: "0.04em", textTransform: "uppercase" }}>{children}</label>;
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseField, ...props.style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...baseField, minHeight: 72, resize: "vertical", ...props.style }} />;
}

export function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>{children}</div>;
}

export function Grid({ columns, children }: { columns: number; children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, marginBottom: 12 }}>{children}</div>;
}

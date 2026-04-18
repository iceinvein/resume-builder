import { useMemo } from "react";

export function SvgPage({ svg, zoom }: { svg: string; zoom: number }) {
  const src = useMemo(() => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [svg]);
  return (
    <img
      src={src}
      alt="resume page"
      draggable={false}
      style={{
        display: "block",
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        background: "#fff",
        maxWidth: "none",
      }}
    />
  );
}

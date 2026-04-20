import { useEffect, useRef } from "react";

// The typst-ts SVG output embeds <foreignObject> for text layout plus an
// inline <script> bootstrap. Browsers refuse to decode these when the SVG
// is delivered via <img src="data:..."> (the <img> sandbox strips both and
// marks the image as broken). Parsing the SVG into a detached document and
// importing its root lets the glyph paths paint inline. We also re-create
// the bootstrap <script> so typst.ts can wire up text selection and
// pseudo-links.
//
// Source trust: the SVG string is produced by our own Typst WASM compiler
// in a worker from user resume data. Typst only emits SVG (no arbitrary
// HTML), so we are not forwarding user-supplied markup into the DOM.
export function SvgPage({ svg, zoom }: { svg: string; zoom: number }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    while (host.firstChild) host.removeChild(host.firstChild);

    // Parse through the HTML parser rather than the XML parser. Typst.ts's
    // SVG embeds JavaScript in a <script> body that is not CDATA-wrapped, so
    // bare `&` characters break strict image/svg+xml parsing. The HTML parser
    // is lenient and still produces a usable SVG subtree.
    const parsed = new DOMParser().parseFromString(svg, "text/html");
    const root = parsed.body.querySelector("svg");
    if (!root) return;

    const imported = document.importNode(root, true);
    host.appendChild(imported);

    for (const src of Array.from(host.querySelectorAll("script"))) {
      const next = document.createElement("script");
      for (const attr of Array.from(src.attributes)) {
        next.setAttribute(attr.name, attr.value);
      }
      next.text = src.textContent ?? "";
      src.replaceWith(next);
    }
  }, [svg]);

  return (
    <div
      ref={hostRef}
      aria-label="Resume page"
      style={{
        display: "block",
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        border: "var(--border-hairline) solid var(--color-paper-edge)",
        background: "var(--color-paper)",
        lineHeight: 0,
      }}
    />
  );
}

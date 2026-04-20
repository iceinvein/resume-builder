import { createRoot } from "react-dom/client";
import { App } from "./ui/app";

// Variable fonts. Fontsource handles preload and font-display:swap so the
// fallback system-ui stack renders immediately and is replaced without shift.
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/azeret-mono";

// Theme layer. Order matters: tokens first (color/space/motion), then
// typography (references neither), then components (reference both).
import "./ui/theme/tokens.css";
import "./ui/theme/tailwind.css";
import "./ui/theme/type.css";
import "./ui/theme/components.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");
createRoot(root).render(<App />);

import { createRoot } from "react-dom/client";
import { App } from "./ui/app";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");
createRoot(root).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Content protection — prevent right-click and common copy shortcuts on production
if (import.meta.env.PROD) {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("input, textarea, [contenteditable]")) {
      e.preventDefault();
    }
  });

  document.addEventListener("keydown", (e) => {
    // Block Ctrl+U (view source), Ctrl+S (save), Ctrl+Shift+I (devtools)
    if (
      (e.ctrlKey && e.key === "u") ||
      (e.ctrlKey && e.key === "s") ||
      (e.ctrlKey && e.shiftKey && e.key === "I")
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

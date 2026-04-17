import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { registerAutoSync } from "./lib/syncQueue";

// Suppress known Recharts warning about refs on function components (XAxis/YAxis/CartesianGrid)
// This is an upstream library issue, not a bug in our code.
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("Function components cannot be given refs") &&
      (msg.includes("XAxis") || msg.includes("YAxis") || msg.includes("CartesianGrid") || msg.includes("Recharts"))
    ) {
      return;
    }
    originalError(...args);
  };
}

registerAutoSync();

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event("sw-update-available"));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event("sw-offline-ready"));
  },
});

createRoot(document.getElementById("root")!).render(<App />);

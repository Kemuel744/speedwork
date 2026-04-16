import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { registerAutoSync } from "./lib/syncQueue";

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

import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { registerAutoSync } from "./lib/syncQueue";

const removeLovableBadge = () => {
  const selectors = [
    '[id*="lovable" i]',
    '[class*="lovable" i]',
    '[data-lovable]',
    '[aria-label*="lovable" i]',
    '[title*="lovable" i]',
    'a[href*="lovable" i]',
    'iframe[src*="lovable" i]',
  ].join(",");

  document.querySelectorAll<HTMLElement>(selectors).forEach((element) => {
    if (element.id === "root" || element.closest("#root")) return;
    element.remove();
  });

  document.body.querySelectorAll<HTMLElement>("body > *:not(#root)").forEach((element) => {
    if (element.textContent?.toLowerCase().includes("edit with lovable")) {
      element.remove();
    }
  });
};

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

removeLovableBadge();
new MutationObserver(removeLovableBadge).observe(document.body, {
  childList: true,
  subtree: true,
});

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

import { useEffect, useRef } from "react";

export function useAdSense() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const s = document.createElement("script");
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9622797998614025";
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    loaded.current = true;
  }, []);
}

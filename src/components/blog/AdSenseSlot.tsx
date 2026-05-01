import { useEffect, useRef } from "react";

interface AdSenseSlotProps {
  slot: string;
  className?: string;
}

/**
 * AdSense ad unit – renders and initializes a Google AdSense slot.
 * Only used on public/blog pages, never in dashboard.
 */
export default function AdSenseSlot({ slot, className = "" }: AdSenseSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      // AdSense not loaded yet or blocked by adblocker
    }
  }, []);

  return (
    <div className={`my-6 flex justify-center ${className}`} data-ad-position={slot}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        // Reserve vertical space to prevent layout shift / forced reflow
        // when AdSense injects the iframe after measuring the container width.
        style={{
          display: "block",
          textAlign: "center",
          minHeight: 280,
          width: "100%",
        }}
        data-ad-client="ca-pub-9622797998614025"
        data-ad-slot="9742566834"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

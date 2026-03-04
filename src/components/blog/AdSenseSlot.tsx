interface AdSenseSlotProps {
  slot: string;
  className?: string;
}

/**
 * AdSense placeholder – replace data-ad-client and data-ad-slot
 * with your real AdSense values once approved.
 * Only renders on blog pages (public), never in dashboard.
 */
export default function AdSenseSlot({ slot, className = "" }: AdSenseSlotProps) {
  // Toggle: set to true once AdSense is configured
  const adsEnabled = false;

  if (!adsEnabled) return null;

  return (
    <div className={`my-6 flex justify-center ${className}`} data-ad-position={slot}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

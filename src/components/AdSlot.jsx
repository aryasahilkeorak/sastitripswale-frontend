import { useEffect } from 'react';

// See frontend/.env.example for setup instructions (real publisher ID,
// ad unit slot IDs, and public/ads.txt all need to be filled in with
// values from adsense.google.com before ads actually serve).
//
// The repo's default .env ships DUMMY placeholder values (ca-pub-000...,
// slot 1234567890) so the app runs out of the box - those aren't blank, so
// a plain truthiness check would "enable" ads and fire a real (failing)
// request to Google with a fake publisher ID. Treat the known placeholder
// as unconfigured too.
const PLACEHOLDER_CLIENT_ID = 'ca-pub-0000000000000000';
const rawClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
const CLIENT_ID = rawClientId === PLACEHOLDER_CLIENT_ID ? '' : rawClientId;
const DEFAULT_SLOT = import.meta.env.VITE_ADSENSE_SLOT_DEFAULT || '';
// Per-placement slots, each optional - falls back to DEFAULT_SLOT so a
// single shared ad unit works everywhere until dedicated ones exist.
const PLACEMENT_SLOT = {
  home: import.meta.env.VITE_ADSENSE_SLOT_HOME || DEFAULT_SLOT,
  listing: import.meta.env.VITE_ADSENSE_SLOT_LISTING || DEFAULT_SLOT,
  detail: import.meta.env.VITE_ADSENSE_SLOT_DETAIL || DEFAULT_SLOT,
  gallery: import.meta.env.VITE_ADSENSE_SLOT_GALLERY || DEFAULT_SLOT,
};

let scriptRequested = false;
function loadAdSenseScript() {
  if (scriptRequested || !CLIENT_ID) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

// Drop-in Google AdSense display ad unit. Renders nothing at all - no
// placeholder box, no console errors - until a real VITE_ADSENSE_CLIENT_ID
// is configured, so it's always safe to leave these in the page tree while
// waiting on AdSense approval.
//
// `placement` picks one of the named slots above (home/listing/detail/
// gallery); pass an explicit `slot` instead for anything more specific.
export default function AdSlot({ placement, slot, format = 'auto', className = '', style }) {
  const adSlot = slot || PLACEMENT_SLOT[placement] || DEFAULT_SLOT;
  const enabled = Boolean(CLIENT_ID && adSlot);

  useEffect(() => {
    if (!enabled) return;
    loadAdSenseScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not ready yet on this render - harmless, the <ins>
      // just stays empty; it'll fill in on a future push() from elsewhere.
    }
  }, [enabled, adSlot]);

  if (!enabled) return null;

  return (
    <div className={`ad-slot ${className}`} style={{ margin: '24px 0', textAlign: 'center', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

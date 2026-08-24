import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
});

export function GoogleIcon({ size = 18, ...p }: P) {
  return (
    <svg {...base(size)} {...p} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export function YouTubeIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="4" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10.2 9.3l5 2.7-5 2.7V9.3z" fill="currentColor"/>
    </svg>
  );
}

export function TikTokIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path
        d="M14.5 3h2.2c.2 1.9 1.4 3.4 3.3 3.8v2.6c-1.3 0-2.4-.4-3.3-1v5.9a5.4 5.4 0 1 1-5.4-5.4c.3 0 .5 0 .8.1v2.7a2.7 2.7 0 1 0 1.9 2.6V3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="17.2" cy="6.8" r="1.3" fill="currentColor"/>
    </svg>
  );
}

export function GlobeIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5S9.4 5.8 12 3.5z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

export function PlatformIcon({ platform, size = 16, ...p }: P & { platform: string }) {
  if (platform === "youtube") return <YouTubeIcon size={size} {...p} />;
  if (platform === "tiktok") return <TikTokIcon size={size} {...p} />;
  if (platform === "instagram") return <InstagramIcon size={size} {...p} />;
  return <GlobeIcon size={size} {...p} />;
}

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#FFB224" />
      <path
        d="M16 44V20l16 15 16-15v24"
        fill="none"
        stroke="#0e1117"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="12" r="5.5" fill="#ff5c4d" />
    </svg>
  );
}

export function HeartIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path
        d="M12 20.6C7.2 16.4 3.4 13.1 3.4 9.1 3.4 6.4 5.5 4.4 8 4.4c1.6 0 3.1.8 4 2.1.9-1.3 2.4-2.1 4-2.1 2.5 0 4.6 2 4.6 4.7 0 4-3.8 7.3-8.6 11.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PayPalIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p} viewBox="0 0 24 24">
      <path
        d="M7.6 21l.6-3.7H5.5L7.7 3.7h5.8c2.9 0 4.6 1.5 4.2 4.1-.4 2.9-2.5 4.4-5.4 4.4h-2l-1 6.8H7.6z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M10 19l.5-3.3h1.7c2.6 0 4.4-1.3 4.8-3.8.2-1.2 0-2.2-.7-2.9h1.2c2.2 0 3.5 1.4 3.1 3.7-.4 2.6-2.4 4-5.1 4h-1.7l-.6 3.3H10z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BinanceIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p} viewBox="0 0 24 24" fill="currentColor">
      <rect x="9.9" y="9.9" width="4.2" height="4.2" transform="rotate(45 12 12)" />
      <rect x="10.7" y="3.3" width="2.6" height="2.6" transform="rotate(45 12 4.6)" />
      <rect x="10.7" y="18.1" width="2.6" height="2.6" transform="rotate(45 12 19.4)" />
      <rect x="3.3" y="10.7" width="2.6" height="2.6" transform="rotate(45 4.6 12)" />
      <rect x="18.1" y="10.7" width="2.6" height="2.6" transform="rotate(45 19.4 12)" />
    </svg>
  );
}

export function PagoMovilIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13 7.2l-3.4 5.4h2.5l-1 4.2 3.5-5.6h-2.5l.9-4z" fill="currentColor" />
    </svg>
  );
}

export function ZelleIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="4.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 8.5h7L8.5 15.5h7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function TransferIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M7 9.5h11M7 9.5l3-3M7 9.5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 15H6M17 15l-3-3M17 15l-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 4v10M12 14l-4-4M12 14l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FileBoxIcon({ size = 16, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 3l8 3v12l-8 3-8-3V6l8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 6l8 3 8-3M12 9v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

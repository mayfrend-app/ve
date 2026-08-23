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

export function VeMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#FFB224" />
      <path
        d="M14 18l10.5 28L32 27l7.5 19L50 18"
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

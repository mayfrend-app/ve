import type { ContentItem } from "../lib/supabase";

const FALLBACK = [
  "Bienvenido al lobby de contenidos VE",
  "Todo lo que publique el administrador aparece aquí al instante",
  "Conecta tu base de datos Supabase para ver tus propios anuncios en tiempo real",
];

export default function Ticker({ anuncios }: { anuncios: ContentItem[] }) {
  const msgs = anuncios.length > 0 ? anuncios.map((a) => a.title) : FALLBACK;
  const strip = [...msgs, ...msgs];

  return (
    <div className="marquee-hover relative z-10 flex items-stretch overflow-hidden border-y border-line bg-ink-2/80 backdrop-blur-sm">
      <div className="flex shrink-0 items-center gap-2 bg-coral px-3 py-2 sm:px-4">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z"
            fill="#0e1117"
          />
          <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="#0e1117" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="kicker font-bold text-ink">Anuncios</span>
      </div>
      <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
        <div className="marquee-track items-center gap-0">
          {strip.map((m, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              <span className="px-5 text-[13px] font-medium text-paper/90">{m}</span>
              <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden className="text-amber">
                <rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill="currentColor" />
              </svg>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink-2 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-2 to-transparent" />
      </div>
    </div>
  );
}

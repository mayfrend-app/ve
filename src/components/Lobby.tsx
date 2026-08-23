import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Copy, Check, ExternalLink, FileText } from "lucide-react";
import type { ContentItem } from "../lib/supabase";
import { PLATFORM_META } from "../lib/supabase";
import { youtubeId, ytThumb } from "../lib/content";
import Player from "./Player";
import { PlatformIcon } from "./Icons";

/* ------------------------------ reveal on scroll ------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHead({
  num,
  kicker,
  title,
  count,
  accent,
}: {
  num: string;
  kicker: string;
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <Reveal className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-1">
      <div>
        <p className="kicker" style={{ color: accent }}>
          {num} · {kicker}
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-paper sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="mb-2 hidden h-px flex-1 bg-gradient-to-r from-line to-transparent sm:block" />
      <span className="mb-1 font-mono text-[11px] tracking-widest text-fog">
        [{String(count).padStart(2, "0")} ÍTEMS]
      </span>
    </Reveal>
  );
}

/* --------------------------------- tarjeta video -------------------------------- */

function VideoCard({
  v,
  big,
  onPlay,
}: {
  v: ContentItem;
  big?: boolean;
  onPlay: () => void;
}) {
  const id = youtubeId(v.url);
  const meta = PLATFORM_META[v.platform] ?? PLATFORM_META.web;
  return (
    <button
      onClick={onPlay}
      className="card card-hover btn-press group relative flex h-full w-full flex-col overflow-hidden text-left"
    >
      <div
        className={`relative w-full flex-1 overflow-hidden ${
          big ? "min-h-[220px] sm:min-h-[280px]" : "min-h-[210px]"
        }`}
      >
        {id ? (
          <img
            src={ytThumb(id, big ? "hqdefault" : "mqdefault")}
            alt={v.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-panel-2 to-ink-2"
            style={{ color: meta.color }}
          >
            <PlatformIcon platform={v.platform} size={big ? 54 : 34} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />
        <span
          className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(14,17,23,0.82)", color: meta.color }}
        >
          <PlatformIcon platform={v.platform} size={11} />
          {meta.label}
        </span>
        <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber text-ink opacity-0 shadow-lg transition duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 4.5l12 7.5-12 7.5v-15z" />
          </svg>
        </span>
        <div className={`absolute inset-x-0 bottom-0 p-3.5 ${big ? "sm:p-5" : ""}`}>
          <h3
            className={`font-display font-bold leading-snug text-paper ${
              big ? "text-lg sm:text-2xl" : "text-[15px]"
            }`}
          >
            {v.title}
          </h3>
          {(big || v.description) && (
            <p className={`mt-1 text-fog ${big ? "text-sm max-w-xl" : "text-xs line-clamp-2"}`}>
              {v.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------ lobby ------------------------------------ */

interface Props {
  items: ContentItem[];
  rt: "off" | "connecting" | "live";
  onCopy: (code: string) => void;
}

export default function Lobby({ items, rt, onCopy }: Props) {
  const active = useMemo(() => items.filter((i) => i.active), [items]);
  const videos = useMemo(() => active.filter((i) => i.type === "video"), [active]);
  const banners = useMemo(() => active.filter((i) => i.type === "banner"), [active]);
  const apps = useMemo(() => active.filter((i) => i.type === "app"), [active]);
  const codes = useMemo(() => active.filter((i) => i.type === "codigo"), [active]);
  const notes = useMemo(() => active.filter((i) => i.type === "nota"), [active]);

  const [playIdx, setPlayIdx] = useState(0);
  const playerAnchor = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const play = (id: string) => {
    const i = videos.findIndex((v) => v.id === id);
    if (i >= 0) setPlayIdx(i);
    playerAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const today = clock.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      {/* ---------------- cabecera de emisión ---------------- */}
      <section className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-end">
        <Reveal>
          <p className="kicker flex items-center gap-2.5 text-coral">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-coral text-coral" />
            Señal en vivo · Canal de contenidos
          </p>
          <h1 className="mt-3 font-display text-[2.5rem] font-extrabold leading-[0.98] tracking-tight text-paper sm:text-6xl">
            Todo tu contenido,
            <br />
            <span className="text-amber">al aire</span>
            <span className="text-coral">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fog">
            Videos y tutoriales de YouTube, TikTok e Instagram encadenados en un reproductor
            automático, más banners, aplicaciones, códigos y notas. Lo que el administrador
            publica aparece aquí <span className="font-semibold text-paper">al instante, en todos los dispositivos</span>.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="card grid grid-cols-3 divide-x divide-line overflow-hidden">
            {[
              { k: "Videos", v: videos.length, c: "#ff5c4d" },
              { k: "Apps", v: apps.length, c: "#31d3bd" },
              { k: "Códigos", v: codes.length, c: "#ffb224" },
            ].map((s) => (
              <div key={s.k} className="px-4 py-3.5">
                <p className="font-display text-3xl font-extrabold" style={{ color: s.c }}>
                  {String(s.v).padStart(2, "0")}
                </p>
                <p className="kicker mt-0.5 text-fog">{s.k}</p>
              </div>
            ))}
            <div className="col-span-3 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ink-2/70 px-4 py-2.5">
              <span className="font-mono text-[11px] capitalize text-fog">{today}</span>
              <span className="font-mono text-sm font-bold tracking-widest text-amber">
                {clock.toLocaleTimeString("es-ES")}
              </span>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-fog">
            <span
              className={`pulse-dot inline-block h-2 w-2 rounded-full ${
                rt === "live" ? "bg-teal text-teal" : rt === "connecting" ? "bg-amber text-amber blink" : "bg-fog text-fog"
              }`}
            />
            {rt === "live"
              ? "Tiempo real conectado — los cambios se sincronizan solos"
              : rt === "connecting"
                ? "Conectando con Supabase Realtime…"
                : "Sin conexión realtime (modo demo)"}
          </p>
        </Reveal>
      </section>

      {/* ---------------- reproductor ---------------- */}
      <section ref={playerAnchor} className="scroll-mt-24">
        <SectionHead num="01" kicker="Reproducción automática" title="El lobby está al aire" count={videos.length} accent="#ff5c4d" />
        <Reveal>
          <Player queue={videos} idx={Math.min(playIdx, Math.max(0, videos.length - 1))} onIdx={setPlayIdx} />
        </Reveal>
      </section>

      {/* ---------------- banners ---------------- */}
      {banners.length > 0 && (
        <section className="mt-16">
          <SectionHead num="02" kicker="Publicidad" title="Banners destacados" count={banners.length} accent="#ffb224" />
          <div className="flex snap-x gap-4 overflow-x-auto pb-3">
            {banners.map((b, i) => (
              <Reveal key={b.id} delay={i * 90} className="w-[86%] shrink-0 snap-start sm:w-[58%] lg:w-[46%]">
                <a
                  href={b.url || undefined}
                  target={b.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="card card-hover group relative block h-52 overflow-hidden sm:h-56"
                >
                  <div className="drift-grad absolute inset-0 bg-gradient-to-br from-amber/25 via-coral/15 to-teal/20" />
                  {b.image_url && (
                    <img
                      src={b.image_url}
                      alt={b.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="kicker text-amber">Patrocinado</p>
                    <h3 className="mt-1 font-display text-xl font-extrabold text-paper sm:text-2xl">
                      {b.title}
                    </h3>
                    {b.description && <p className="mt-1 max-w-md text-sm text-paper/80">{b.description}</p>}
                  </div>
                  {b.url && (
                    <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-amber backdrop-blur transition group-hover:bg-amber group-hover:text-ink">
                      <ArrowUpRight size={17} />
                    </span>
                  )}
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- parrilla de videos ---------------- */}
      {videos.length > 0 && (
        <section className="mt-16">
          <SectionHead num="03" kicker="Cartelera completa" title="Videos y tutoriales" count={videos.length} accent="#ff5c4d" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <Reveal
                key={v.id}
                delay={(i % 3) * 80}
                className={`h-full ${i === 0 ? "sm:col-span-2" : ""}`}
              >
                <VideoCard v={v} big={i === 0} onPlay={() => play(v.id)} />
              </Reveal>
            ))}
            <Reveal
              delay={160}
              className={`h-full ${
                ((3 - ((videos.length + 2) % 3)) % 3 || 3) === 3
                  ? "lg:col-span-3"
                  : ((3 - ((videos.length + 2) % 3)) % 3 || 3) === 2
                    ? "lg:col-span-2"
                    : ""
              }`}
            >
              <a
                href="https://github.com/mayfrend-app/ve"
                target="_blank"
                rel="noreferrer"
                className="group flex h-full min-h-[210px] w-full flex-col justify-between rounded-xl border border-dashed border-line bg-panel/40 p-5 transition hover:border-amber/60 hover:bg-panel"
              >
                <div className="flex items-center justify-between">
                  <span className="kicker text-fog">Espacio abierto</span>
                  <ArrowUpRight size={18} className="text-fog transition group-hover:text-amber" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold text-paper">
                    ¿Falta un tutorial en la cartelera?
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-fog">
                    Propón un video, canal o curso al administrador del canal y podrá aparecer aquí
                    para todo el público, al instante y en todos los dispositivos.
                  </p>
                </div>
              </a>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------- aplicaciones ---------------- */}
      {apps.length > 0 && (
        <section className="mt-16">
          <SectionHead num="04" kicker="Herramientas" title="Aplicaciones recomendadas" count={apps.length} accent="#31d3bd" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((a, i) => (
              <Reveal key={a.id} delay={i * 80}>
                <a
                  href={a.url || undefined}
                  target={a.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="card card-hover group flex h-full flex-col p-5"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-panel-2 text-teal transition group-hover:border-teal/60 group-hover:text-teal">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                        <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                        <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                        <rect x="13" y="13" width="7" height="7" rx="3.5" fill="currentColor" opacity="0.5" />
                      </svg>
                    </span>
                    <ExternalLink size={15} className="text-fog transition group-hover:text-amber" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-paper">{a.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fog">{a.description}</p>
                  <span className="kicker mt-4 text-teal">{PLATFORM_META[a.platform]?.label ?? "Web"} →</span>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- códigos ---------------- */}
      {codes.length > 0 && (
        <section className="mt-16">
          <SectionHead num="05" kicker="Canjeables" title="Códigos y cupones" count={codes.length} accent="#ffb224" />
          <div className="grid gap-4 sm:grid-cols-2">
            {codes.map((c, i) => (
              <CopyRow key={c.id} c={c} delay={i * 80} onCopy={onCopy} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- notas ---------------- */}
      {notes.length > 0 && (
        <section className="mt-16">
          <SectionHead num="06" kicker="Redacción" title="Notas e información" count={notes.length} accent="#31d3bd" />
          <div className="grid gap-4 md:grid-cols-2">
            {notes.map((n, i) => (
              <Reveal key={n.id} delay={i * 80}>
                <article className="card card-hover h-full border-l-2 border-l-teal/70 p-5">
                  <div className="flex items-center gap-2 text-teal">
                    <FileText size={15} />
                    <p className="kicker">Nota #{String(i + 1).padStart(2, "0")}</p>
                  </div>
                  <h3 className="mt-2.5 font-display text-lg font-bold text-paper">{n.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fog">
                    {n.description}
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-fog/70">
                    {new Date(n.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function CopyRow({
  c,
  delay,
  onCopy,
}: {
  c: ContentItem;
  delay: number;
  onCopy: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Reveal delay={delay}>
      <div className="card card-hover flex items-center gap-4 border-dashed p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber/12 text-amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M8 10.5V7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="5" y="10" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-paper">{c.title}</h3>
          {c.description && <p className="mt-0.5 text-[13px] text-fog">{c.description}</p>}
          <p className="mt-1.5 inline-block rounded-md border border-amber/40 bg-ink-2 px-2.5 py-1 font-mono text-sm font-bold tracking-[0.14em] text-amber">
            {c.code_text}
          </p>
        </div>
        <button
          onClick={() => {
            onCopy(c.code_text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className={`btn-press flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-bold transition ${
            copied
              ? "bg-teal text-ink"
              : "bg-amber text-ink hover:brightness-110"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </Reveal>
  );
}

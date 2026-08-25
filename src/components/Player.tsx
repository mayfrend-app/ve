import { useEffect, useRef, useState } from "react";
import { Play, SkipForward, SkipBack, Volume2, VolumeX, Film } from "lucide-react";
import type { ContentItem } from "../lib/supabase";
import { PLATFORM_META, resolveAssetUrl } from "../lib/supabase";
import { youtubeId, ytThumb, isDirectVideo, directVideoExt } from "../lib/content";
import { PlatformIcon } from "./Icons";

/* ------------------------- carga de la API de YouTube ------------------------- */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: (() => void) | undefined;
  }
}

let ytPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    });
  }
  return ytPromise;
}

/* --------------------------------- componente -------------------------------- */

interface Props {
  queue: ContentItem[];
  idx: number;
  onIdx: (i: number) => void;
}

export default function Player({ queue, idx, onIdx }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(true);
  const [muted, setMuted] = useState(true);

  const autoRef = useRef(auto);
  autoRef.current = auto;
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const lenRef = useRef(queue.length);
  lenRef.current = queue.length;

  const current = queue[idx] ?? null;
  const isFile = current ? isDirectVideo(current) : false;
  const vid = current && !isFile ? youtubeId(current.url) : null;
  const isExternal = Boolean(current) && !vid && !isFile;
  const videoRef = useRef<HTMLVideoElement>(null);

  const onIdxRef = useRef(onIdx);
  onIdxRef.current = onIdx;

  /* arranque del iframe de YouTube (una sola vez) */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !holderRef.current || playerRef.current) return;
        playerRef.current = new YT.Player(holderRef.current, {
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 1,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: () => setReady(true),
            onStateChange: (e: any) => {
              // 0 = ENDED → saltar al siguiente de la cola
              if (e.data === 0 && autoRef.current && lenRef.current > 1) {
                onIdxRef.current((idxRef.current + 1) % lenRef.current);
              }
            },
          },
        });
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, []);

  /* cambiar de video cuando cambia el elemento activo */
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (vid) p.loadVideoById(vid);
    } catch {
      /* noop */
    }
  }, [vid, ready]);

  /* si la cola se achica, volver al inicio */
  useEffect(() => {
    if (queue.length > 0 && idx >= queue.length) onIdx(0);
  }, [queue.length, idx, onIdx]);

  /* al reproducir un archivo local, silenciar el iframe de YouTube que queda debajo */
  useEffect(() => {
    if (!isFile) return;
    try {
      playerRef.current?.pauseVideo?.();
    } catch {
      /* noop */
    }
  }, [isFile, vid]);

  const toggleMute = () => {
    const p = playerRef.current;
    try {
      if (muted) p?.unMute?.();
      else p?.mute?.();
    } catch {
      /* noop */
    }
    if (videoRef.current) videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const goPrev = () => queue.length && onIdx((idx - 1 + queue.length) % queue.length);
  const goNext = () => queue.length && onIdx((idx + 1) % queue.length);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ------------------------- pantalla principal ------------------------- */}
      <div>
        <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          {/* iframe de YouTube */}
          <div className="absolute inset-0">
            <div ref={holderRef} className="h-full w-full" />
          </div>

          {/* barra superior de emisión */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent px-4 pb-8 pt-3">
            <span className="flex items-center gap-2 rounded-md bg-coral/95 px-2 py-1 font-mono text-[10px] font-bold tracking-[0.18em] text-ink">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-ink" />
              EN VIVO
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-paper drop-shadow">
              {current ? current.title : "Sin señal"}
            </p>
          </div>

          {/* reproductor de archivo local (mp4 / webm / mov…) */}
          {isFile && current && (
            <div className="absolute inset-0 z-20 bg-black">
              <video
                key={current.id}
                ref={videoRef}
                src={resolveAssetUrl(current.url)}
                className="h-full w-full object-contain"
                controls
                autoPlay
                muted={muted}
                playsInline
                onEnded={() => {
                  if (autoRef.current && lenRef.current > 1) {
                    onIdxRef.current((idxRef.current + 1) % lenRef.current);
                  }
                }}
              />
            </div>
          )}

          {/* panel para contenido externo (TikTok / Instagram / web) */}
          {isExternal && current && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-ink-2 via-panel to-ink px-6 text-center">
              <div className="scanline" />
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-panel-2"
                style={{ color: PLATFORM_META[current.platform]?.color ?? "#97a1b4" }}
              >
                <PlatformIcon platform={current.platform} size={30} />
              </span>
              <div>
                <p className="kicker text-fog">Contenido externo</p>
                <h3 className="mt-1 font-display text-xl font-bold text-paper sm:text-2xl">
                  {current.title}
                </h3>
                {current.description && (
                  <p className="mx-auto mt-2 max-w-md text-sm text-fog">{current.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-press inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-ink hover:brightness-110"
                >
                  Abrir en {PLATFORM_META[current.platform]?.label ?? "la web"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                {queue.length > 1 && (
                  <button
                    onClick={goNext}
                    className="btn-press inline-flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-4 py-2.5 text-sm font-semibold text-paper hover:border-amber/60"
                  >
                    <SkipForward size={15} /> Siguiente en cola
                  </button>
                )}
              </div>
            </div>
          )}

          {/* sin contenido */}
          {!current && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-ink-2 text-center">
              <p className="kicker text-fog">Señal en espera</p>
              <p className="font-display text-2xl font-bold text-paper">No hay videos en cartelera</p>
              <p className="text-sm text-fog">El administrador puede agregar el primero desde el panel.</p>
            </div>
          )}
        </div>

        {/* --------------------------- controles --------------------------- */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center overflow-hidden rounded-lg border border-line bg-panel">
            <button
              onClick={goPrev}
              aria-label="Anterior"
              className="btn-press flex items-center gap-1 px-3 py-2 text-fog transition hover:bg-panel-2 hover:text-paper"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={goNext}
              aria-label="Siguiente"
              className="btn-press flex items-center gap-1 border-l border-line px-3 py-2 text-fog transition hover:bg-panel-2 hover:text-paper"
            >
              <SkipForward size={15} />
            </button>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="btn-press flex items-center gap-1 border-l border-line px-3 py-2 text-fog transition hover:bg-panel-2 hover:text-paper"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          {/* interruptor de cola automática */}
          <button
            onClick={() => setAuto((a) => !a)}
            className={`btn-press flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              auto
                ? "border-amber/60 bg-amber/10 text-amber"
                : "border-line bg-panel text-fog hover:text-paper"
            }`}
            aria-pressed={auto}
          >
            <span
              className={`relative h-4 w-7 rounded-full transition ${auto ? "bg-amber" : "bg-line"}`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-ink transition-all ${
                  auto ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
            Cola automática {auto ? "activada" : "pausada"}
          </button>

          <span className="ml-auto font-mono text-[11px] tracking-widest text-fog">
            {queue.length ? `${String(idx + 1).padStart(2, "0")} / ${String(queue.length).padStart(2, "0")}` : "— / —"}
          </span>
        </div>
      </div>

      {/* --------------------------- cola / cartelera --------------------------- */}
      <aside className="flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="kicker text-amber">En cartelera</p>
          <span className="flex items-end gap-[3px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="eq-bar w-[3px] rounded-sm bg-coral"
                style={{ height: `${10 + i * 4}px`, animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {queue.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-fog">La cartelera está vacía.</p>
          )}
          {queue.map((v, i) => {
            const file = isDirectVideo(v);
            const id = file ? null : youtubeId(v.url);
            const active = i === idx;
            return (
              <button
                key={v.id}
                onClick={() => onIdx(i)}
                className={`btn-press group mb-1.5 flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  active
                    ? "border-amber/70 bg-amber/[0.07]"
                    : "border-transparent hover:border-line hover:bg-panel-2"
                }`}
              >
                <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-ink-2">
                  {id ? (
                    <img
                      src={ytThumb(id)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : file ? (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-amber">
                      <Film size={18} />
                      <span className="font-mono text-[9px] font-bold tracking-widest">
                        {directVideoExt(v.url)}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center"
                      style={{ color: PLATFORM_META[v.platform]?.color ?? "#97a1b4" }}
                    >
                      <PlatformIcon platform={v.platform} size={20} />
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/55">
                      <Play size={18} className="text-amber" fill="currentColor" />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[13px] font-semibold ${
                      active ? "text-amber" : "text-paper"
                    }`}
                  >
                    {v.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-fog">
                    <PlatformIcon platform={v.platform} size={11} />
                    {PLATFORM_META[v.platform]?.label ?? v.platform}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

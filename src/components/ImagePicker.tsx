import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Link2, Loader2, Check } from "lucide-react";
import { fetchGallery, uploadToStorage, type GalleryImage } from "../lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
  bucket?: "banners" | "descargas";
  label?: string;
}

type Tab = "galeria" | "subir" | "url";

export default function ImagePicker({ value, onChange, bucket = "banners", label = "Imagen" }: Props) {
  const [tab, setTab] = useState<Tab>("galeria");
  const [gallery, setGallery] = useState<GalleryImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let on = true;
    fetchGallery().then((g) => {
      if (on) setGallery(g);
    });
    return () => {
      on = false;
    };
  }, []);

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: "galeria", label: "Galería", icon: <ImageIcon size={13} /> },
    { id: "subir", label: "Subir", icon: <Upload size={13} /> },
    { id: "url", label: "URL", icon: <Link2 size={13} /> },
  ];

  return (
    <div>
      <p className="kicker mb-1.5 text-fog">{label}</p>
      <div className="flex gap-1 rounded-lg border border-line bg-ink-2 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`btn-press flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition ${
              tab === t.id ? "bg-amber text-ink" : "text-fog hover:text-paper"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* vista previa de la imagen seleccionada */}
      {value && (
        <div className="relative mt-2 h-24 overflow-hidden rounded-lg border border-line">
          <img src={value} alt="Vista previa" className="h-full w-full object-cover" />
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-teal px-1.5 py-0.5 text-[10px] font-bold text-ink">
            <Check size={11} /> Seleccionada
          </span>
        </div>
      )}

      {tab === "galeria" && (
        <div className="mt-2">
          {gallery === null ? (
            <p className="flex items-center gap-2 py-3 text-xs text-fog">
              <Loader2 size={13} className="animate-spin" /> Cargando galería…
            </p>
          ) : gallery.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-3 py-3 text-[11px] leading-relaxed text-fog">
              No hay imágenes en <code className="font-mono text-amber">public/baner</code>. Coloca
              tus imágenes ahí y agrégalas a <code className="font-mono text-amber">baner/images.json</code>,
              o usa las pestañas <b>Subir</b> / <b>URL</b>.
            </p>
          ) : (
            <div className="grid max-h-36 grid-cols-3 gap-2 overflow-y-auto">
              {gallery.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => onChange(g.src)}
                  className={`btn-press relative h-16 overflow-hidden rounded-md border transition ${
                    value === g.src ? "border-amber ring-2 ring-amber/40" : "border-line hover:border-amber/60"
                  }`}
                  title={g.name}
                >
                  <img src={g.src} alt={g.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "subir" && (
        <div className="mt-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              const res = await uploadToStorage(bucket, f);
              setUploading(false);
              if (res.ok && res.url) onChange(res.url);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-4 text-xs font-semibold text-fog transition hover:border-amber/60 hover:text-amber disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Subiendo…
              </>
            ) : (
              <>
                <Upload size={15} /> Elegir imagen y subirla
              </>
            )}
          </button>
        </div>
      )}

      {tab === "url" && (
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            placeholder="https://…/imagen.png"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(urlDraft.trim())}
            className="btn-press shrink-0 rounded-lg bg-amber px-3 text-xs font-bold text-ink"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  );
}

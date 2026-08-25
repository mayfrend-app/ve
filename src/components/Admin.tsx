import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  LogOut,
  Save,
  X,
  Power,
  PowerOff,
  AlertTriangle,
  MonitorPlay,
  Loader2,
  Upload,
  RefreshCw,
  FolderOpen,
  Link2,
  CheckCircle2,
  XCircle,
  FileVideo,
  AppWindow,
  ImagePlus,
  ExternalLink,
} from "lucide-react";
import {
  TYPE_META,
  PLATFORM_META,
  DONATION_METHODS,
  uploadToStorage,
  resolveAssetUrl,
  type ContentType,
  type ContentItem,
  type Donation,
  type AssetKind,
  type PublicAsset,
} from "../lib/supabase";
import { detectPlatform, type ContentInput, type DonationInput } from "../lib/content";
import type { ContentApi } from "../hooks/useContent";
import { usePublicAssets, verifyAsset, type PublicAssetsApi, type VerifyState } from "../hooks/usePublicAssets";
import ImagePicker from "./ImagePicker";

type Tab = ContentType | "donaciones" | "archivos";

const TABS: Tab[] = ["video", "banner", "anuncio", "app", "descarga", "codigo", "nota", "archivos", "donaciones"];

export interface Seed {
  type: ContentType;
  data: Partial<ContentInput>;
  ts: number;
}

interface Props {
  api: ContentApi;
  userEmail: string;
  onSignOut: () => void;
  onViewLobby: () => void;
  toast: (kind: "ok" | "err" | "info", msg: string) => void;
}

const emptyForm = (type: ContentType): ContentInput => ({
  type,
  title: "",
  description: "",
  url: "",
  image_url: "",
  platform: type === "video" ? "youtube" : type === "descarga" ? "drive" : "web",
  code_text: "",
  active: true,
});

const emptyDonation = (): DonationInput => ({
  method: "paypal",
  label: "",
  detail: "",
  detail2: "",
  active: true,
});

const PLATFORM_OPTIONS: Record<string, string[]> = {
  video: ["youtube", "archivo", "tiktok", "instagram", "web"],
  app: ["web", "youtube", "otro"],
  descarga: ["drive", "mega", "filetransfer", "web", "otro"],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="kicker mb-1.5 block text-fog">{label}</span>
      {children}
    </label>
  );
}

function ActiveToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`btn-press flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        value ? "border-teal/60 bg-teal/10 text-teal" : "border-line bg-panel text-fog"
      }`}
      aria-pressed={value}
    >
      <span className={`relative h-4 w-7 rounded-full transition ${value ? "bg-teal" : "bg-line"}`}>
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-ink transition-all ${value ? "left-[15px]" : "left-0.5"}`}
        />
      </span>
      {value ? "Visible en el lobby" : "Oculto"}
    </button>
  );
}

export default function Admin({ api, userEmail, onSignOut, onViewLobby, toast }: Props) {
  const [tab, setTab] = useState<Tab>("video");
  const [seed, setSeed] = useState<Seed | null>(null);
  const assetsApi = usePublicAssets();

  const useAsset = (s: Omit<Seed, "ts">) => {
    setTab(s.type);
    setSeed({ ...s, ts: Date.now() });
    toast("info", `Formulario de ${TYPE_META[s.type].label.toLowerCase()} preparado con el archivo detectado.`);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      {/* cabecera del panel */}
      <section className="flex flex-wrap items-end justify-between gap-4 py-8">
        <div>
          <p className="kicker flex items-center gap-2 text-teal">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-teal text-teal" />
            Panel de administración
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-paper sm:text-4xl">
            Cabina de control
          </h1>
          <p className="mt-2 text-sm text-fog">
            Sesión: <span className="font-mono text-paper">{userEmail}</span> · Cada cambio se emite
            al instante a todos los dispositivos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewLobby}
            className="btn-press flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-paper transition hover:border-amber/60"
          >
            <MonitorPlay size={15} className="text-amber" /> Ver lobby
          </button>
          <button
            onClick={onSignOut}
            className="btn-press flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-fog transition hover:border-coral/60 hover:text-coral"
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </section>

      {/* aviso si no hay base de datos */}
      {!api.lastSync && api.items.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber/50 bg-amber/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber">
            <AlertTriangle size={16} /> Sin conexión a la base de datos
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-fog">
            No se pudo leer Supabase. Verifica que las credenciales estén en <code className="font-mono text-amber">.env</code>{" "}
            y que hayas ejecutado <code className="font-mono text-amber">supabase/schema.sql</code>.
          </p>
        </div>
      )}

      {/* pestañas */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {TABS.map((t) => {
          const isDon = t === "donaciones";
          const isFiles = t === "archivos";
          const count = isDon
            ? api.donations.length
            : isFiles
              ? assetsApi.assets.length
              : api.items.filter((i) => i.type === t).length;
          const activeCls = isDon ? "bg-coral text-ink" : isFiles ? "bg-teal text-ink" : "bg-amber text-ink";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn-press flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition ${
                tab === t ? activeCls : "text-fog hover:bg-panel-2 hover:text-paper"
              }`}
            >
              {isFiles && <FolderOpen size={13} />}
              {isDon ? "Donaciones" : isFiles ? "Archivos" : TYPE_META[t].label}
              <span className={`ml-0.5 font-mono text-[10px] ${tab === t ? "opacity-70" : "text-fog"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "donaciones" ? (
        <DonationsSection api={api} toast={toast} />
      ) : tab === "archivos" ? (
        <FilesSection api={assetsApi} onUse={useAsset} toast={toast} />
      ) : (
        <ContentSection api={api} tab={tab} toast={toast} seed={seed} />
      )}
    </main>
  );
}

/* ============================ SECCIÓN CONTENIDO ============================ */

function ContentSection({
  api,
  tab,
  toast,
  seed,
}: {
  api: ContentApi;
  tab: ContentType;
  toast: Props["toast"];
  seed: Seed | null;
}) {
  const [form, setForm] = useState<ContentInput>(emptyForm(tab));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* prellenado desde el escáner de archivos */
  useEffect(() => {
    if (!seed || seed.type !== tab) return;
    setForm({ ...emptyForm(seed.type), ...seed.data });
    setEditingId(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [seed, tab]);

  const group = useMemo(
    () =>
      api.items
        .filter((i) => i.type === tab)
        .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
    [api.items, tab]
  );

  const reset = () => {
    setForm(emptyForm(tab));
    setEditingId(null);
  };

  const set = (patch: Partial<ContentInput>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (tab !== "anuncio" && !form.title.trim()) return toast("err", "El título es obligatorio.");
    if (tab === "anuncio" && !form.title.trim())
      return toast("err", "Escribe el mensaje del anuncio.");
    if (tab === "video" && !form.url.trim())
      return toast("err", "Los videos necesitan un enlace (YouTube, TikTok, Instagram…).");
    if (tab === "codigo" && !form.code_text.trim())
      return toast("err", "Escribe el texto del código o cupón.");
    if (tab === "descarga" && !form.url.trim())
      return toast("err", "Agrega un enlace de descarga o sube un archivo.");
    setSaving(true);
    const res = await api.save(form);
    setSaving(false);
    if (!res.ok) return toast("err", `No se pudo guardar: ${res.error}`);
    toast("ok", editingId ? "Cambios publicados en tiempo real ✓" : "Elemento publicado en tiempo real ✓");
    reset();
  };

  const startEdit = (it: ContentItem) => {
    setForm({
      id: it.id,
      type: it.type,
      title: it.title ?? "",
      description: it.description ?? "",
      url: it.url ?? "",
      image_url: it.image_url ?? "",
      platform: it.platform || "web",
      code_text: it.code_text ?? "",
      active: it.active,
    });
    setEditingId(it.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const doDelete = async (id: string) => {
    const res = await api.remove(id);
    setConfirmId(null);
    if (!res.ok) return toast("err", `No se pudo eliminar: ${res.error}`);
    if (editingId === id) reset();
    toast("ok", "Elemento eliminado en todos los dispositivos.");
  };

  const doMove = async (id: string, dir: -1 | 1) => {
    const res = await api.move(id, dir);
    if (!res.ok && res.error !== "Elemento no encontrado.") toast("err", `No se pudo reordenar: ${res.error}`);
  };

  const doToggle = async (it: ContentItem) => {
    const res = await api.toggleActive(it.id, !it.active);
    if (!res.ok) return toast("err", `No se pudo cambiar el estado: ${res.error}`);
    toast("ok", it.active ? `"${it.title}" se ocultó del lobby.` : `"${it.title}" ya está al aire.`);
  };

  const uploadFile = async (f: File) => {
    setUploadingFile(true);
    const res = await uploadToStorage("descargas", f);
    setUploadingFile(false);
    if (res.ok && res.url) {
      set({ url: res.url });
      toast("ok", "Archivo subido. Enlace de descarga listo.");
    } else toast("err", `No se pudo subir el archivo: ${res.error}`);
  };

  const meta = TYPE_META[tab];
  const platformOpts = PLATFORM_OPTIONS[tab];
  const showDesc = tab !== "anuncio";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* ------------------------------- formulario ------------------------------- */}
      <div ref={formRef} className="card h-fit p-5">
        <p className="flex items-center gap-2 font-display text-base font-extrabold text-paper">
          {editingId ? <Pencil size={15} className="text-amber" /> : <Plus size={15} className="text-amber" />}
          {editingId ? "Editar" : "Nuevo"} {meta.label.toLowerCase()}
        </p>

        <div className="mt-4 space-y-4">
          <Field label={tab === "anuncio" ? "Mensaje del anuncio" : "Título"}>
            <input
              className="input"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={tab === "anuncio" ? "Ej: Nuevo tutorial todos los viernes" : "Ej: Curso de programación"}
            />
          </Field>

          {showDesc && (
            <Field label="Descripción">
              <textarea
                className="input min-h-[70px] resize-y"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Texto breve que acompaña al elemento…"
              />
            </Field>
          )}

          {tab === "codigo" && (
            <Field label="Código / cupón">
              <input
                className="input font-mono uppercase tracking-widest"
                value={form.code_text}
                onChange={(e) => set({ code_text: e.target.value })}
                placeholder="Ej: MAYFREND-2026"
              />
            </Field>
          )}

          {(tab === "video" || tab === "app" || tab === "banner" || tab === "descarga") && (
            <Field label={tab === "descarga" ? "Enlace de descarga" : "Enlace"}>
              <input
                className="input"
                value={form.url}
                onChange={(e) => set({ url: e.target.value })}
                placeholder={
                  tab === "descarga"
                    ? "https://drive.google.com/… · https://mega.nz/… · o sube un archivo"
                    : "https://youtube.com/… · https://tiktok.com/…"
                }
              />
            </Field>
          )}

          {tab === "descarga" && (
            <div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploadingFile}
                onClick={() => fileRef.current?.click()}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-3 text-xs font-semibold text-fog transition hover:border-[#a78bfa]/60 hover:text-[#a78bfa] disabled:opacity-60"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Subiendo archivo…
                  </>
                ) : (
                  <>
                    <Upload size={14} /> O subir archivo (app, juego, video, manual…)
                  </>
                )}
              </button>
            </div>
          )}

          {(tab === "banner" || tab === "app" || tab === "descarga") && (
            <ImagePicker
              value={form.image_url}
              onChange={(url) => set({ image_url: url })}
              bucket="banners"
              label={tab === "banner" ? "Imagen del banner" : "Imagen / icono (opcional)"}
            />
          )}

          {platformOpts && (
            <Field label={tab === "descarga" ? "Origen del archivo" : "Plataforma"}>
              <div className="flex flex-wrap gap-1.5">
                {platformOpts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set({ platform: p })}
                    className={`btn-press rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      form.platform === p
                        ? "border-amber bg-amber/15 text-amber"
                        : "border-line text-fog hover:text-paper"
                    }`}
                  >
                    {PLATFORM_META[p]?.label ?? p}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <ActiveToggle value={form.active} onChange={(v) => set({ active: v })} />

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={saving}
              className="btn-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {editingId ? "Guardar cambios" : "Publicar"}
            </button>
            {editingId && (
              <button
                onClick={reset}
                className="btn-press flex items-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-fog transition hover:text-paper"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------- lista --------------------------------- */}
      <div>
        <p className="kicker mb-3 text-fog">
          {meta.plural} · {group.length} elemento{group.length !== 1 ? "s" : ""}
        </p>
        {group.length === 0 ? (
          <div className="card border-dashed px-5 py-12 text-center">
            <p className="font-display text-base font-bold text-paper">No hay {meta.plural.toLowerCase()} todavía</p>
            <p className="mt-1 text-[13px] text-fog">Crea el primero con el formulario.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {group.map((it) => (
              <li
                key={it.id}
                className={`card flex items-center gap-3 p-3 transition ${
                  !it.active ? "opacity-55" : ""
                } ${confirmId === it.id ? "border-coral/70" : ""}`}
              >
                {it.image_url ? (
                  <img src={it.image_url} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-panel-2 font-mono text-[10px] text-fog">
                    {meta.label}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-paper">
                    {it.title || it.code_text || "(sin título)"}
                  </p>
                  <p className="truncate font-mono text-[11px] text-fog">
                    {it.url || it.code_text || it.description || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => doMove(it.id, -1)}
                    aria-label="Subir"
                    className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-amber"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => doMove(it.id, 1)}
                    aria-label="Bajar"
                    className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-amber"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    onClick={() => doToggle(it)}
                    aria-label={it.active ? "Ocultar" : "Mostrar"}
                    title={it.active ? "Ocultar del lobby" : "Mostrar en el lobby"}
                    className={`btn-press rounded-md p-1.5 transition hover:bg-panel-2 ${
                      it.active ? "text-teal" : "text-fog"
                    }`}
                  >
                    {it.active ? <Power size={15} /> : <PowerOff size={15} />}
                  </button>
                  <button
                    onClick={() => startEdit(it)}
                    aria-label="Editar"
                    className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-amber"
                  >
                    <Pencil size={15} />
                  </button>
                  {confirmId === it.id ? (
                    <button
                      onClick={() => doDelete(it.id)}
                      className="btn-press rounded-md bg-coral px-2 py-1.5 text-[11px] font-bold text-ink"
                    >
                      ¿Seguro?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmId(it.id)}
                      aria-label="Eliminar"
                      className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-coral"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============================ SECCIÓN DONACIONES ============================ */

function DonationsSection({ api, toast }: { api: ContentApi; toast: Props["toast"] }) {
  const [form, setForm] = useState<DonationInput>(emptyDonation());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<DonationInput>) => setForm((f) => ({ ...f, ...patch }));
  const reset = () => {
    setForm(emptyDonation());
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.detail.trim()) return toast("err", "Agrega los datos de la cuenta (correo, enlace, teléfono…).");
    setSaving(true);
    const res = await api.saveDon(form);
    setSaving(false);
    if (!res.ok) return toast("err", `No se pudo guardar: ${res.error}`);
    toast("ok", editingId ? "Método de donación actualizado ✓" : "Método de donación publicado ✓");
    reset();
  };

  const startEdit = (d: Donation) => {
    setForm({
      id: d.id,
      method: d.method,
      label: d.label ?? "",
      detail: d.detail ?? "",
      detail2: d.detail2 ?? "",
      active: d.active,
    });
    setEditingId(d.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const doDelete = async (id: string) => {
    const res = await api.removeDon(id);
    setConfirmId(null);
    if (!res.ok) return toast("err", `No se pudo eliminar: ${res.error}`);
    if (editingId === id) reset();
    toast("ok", "Método de donación eliminado.");
  };

  const list = [...api.donations].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div ref={formRef} className="card h-fit border-coral/30 p-5">
        <p className="flex items-center gap-2 font-display text-base font-extrabold text-paper">
          {editingId ? <Pencil size={15} className="text-coral" /> : <Plus size={15} className="text-coral" />}
          {editingId ? "Editar método" : "Nuevo método de donación"}
        </p>

        <div className="mt-4 space-y-4">
          <Field label="Método">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(DONATION_METHODS).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set({ method: key })}
                  className={`btn-press rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    form.method === key ? "border-coral bg-coral/15 text-coral" : "border-line text-fog hover:text-paper"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nombre a mostrar (opcional)">
            <input
              className="input"
              value={form.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder={DONATION_METHODS[form.method]?.label ?? "Ej: PayPal"}
            />
          </Field>

          <Field label={`Datos · ${DONATION_METHODS[form.method]?.hint ?? ""}`}>
            <input
              className="input font-mono"
              value={form.detail}
              onChange={(e) => set({ detail: e.target.value })}
              placeholder="correo@ejemplo.com · enlace · teléfono"
            />
          </Field>

          <Field label="Segunda línea (opcional)">
            <input
              className="input font-mono"
              value={form.detail2}
              onChange={(e) => set({ detail2: e.target.value })}
              placeholder="Ej: Banco, cédula, nombre del titular…"
            />
          </Field>

          <ActiveToggle value={form.active} onChange={(v) => set({ active: v })} />

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={saving}
              className="btn-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {editingId ? "Guardar cambios" : "Publicar método"}
            </button>
            {editingId && (
              <button
                onClick={reset}
                className="btn-press flex items-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-fog transition hover:text-paper"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="kicker mb-3 text-fog">
          Métodos publicados · {list.length}
        </p>
        {list.length === 0 ? (
          <div className="card border-dashed px-5 py-12 text-center">
            <p className="font-display text-base font-bold text-paper">Aún no hay métodos de donación</p>
            <p className="mt-1 text-[13px] text-fog">
              Agrega PayPal, Binance, Pago Móvil, Zelle o transferencia para que aparezcan en el pie del lobby.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((d) => (
              <li
                key={d.id}
                className={`card flex items-center gap-3 p-3 ${!d.active ? "opacity-55" : ""}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 font-display text-sm font-extrabold"
                  style={{ color: DONATION_METHODS[d.method]?.color ?? "#97a1b4" }}
                >
                  {(d.label || DONATION_METHODS[d.method]?.label || d.method).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-paper">
                    {d.label || DONATION_METHODS[d.method]?.label || d.method}
                  </p>
                  <p className="truncate font-mono text-[11px] text-fog">
                    {d.detail}
                    {d.detail2 ? ` · ${d.detail2}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(d)}
                    aria-label="Editar"
                    className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-amber"
                  >
                    <Pencil size={15} />
                  </button>
                  {confirmId === d.id ? (
                    <button
                      onClick={() => doDelete(d.id)}
                      className="btn-press rounded-md bg-coral px-2 py-1.5 text-[11px] font-bold text-ink"
                    >
                      ¿Seguro?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmId(d.id)}
                      aria-label="Eliminar"
                      className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-coral"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ========================= SECCIÓN ARCHIVOS (ESCÁNER public/) ========================= */

const KIND_META: Record<
  AssetKind,
  { label: string; plural: string; folder: string; color: string; action: string; hint: string }
> = {
  app: {
    label: "Aplicación",
    plural: "Aplicaciones y programas",
    folder: "public/apps",
    color: "#31d3bd",
    action: "Publicar descarga",
    hint: "APK, ZIP, EXE…",
  },
  video: {
    label: "Video",
    plural: "Videos",
    folder: "public/videos",
    color: "#ff5c4d",
    action: "Incorporar video",
    hint: "MP4, WEBM… se reproducen en el lobby",
  },
  image: {
    label: "Imagen",
    plural: "Imágenes",
    folder: "public/imagenes",
    color: "#ffb224",
    action: "Usar en publicación",
    hint: "PNG, JPG… para banners y carteles",
  },
};

function KindGlyph({ kind, size = 16 }: { kind: AssetKind; size?: number }) {
  if (kind === "app") return <AppWindow size={size} />;
  if (kind === "video") return <FileVideo size={size} />;
  return <ImagePlus size={size} />;
}

function FilesSection({
  api,
  onUse,
  toast,
}: {
  api: PublicAssetsApi;
  onUse: (s: Omit<Seed, "ts">) => void;
  toast: Props["toast"];
}) {
  const [kind, setKind] = useState<AssetKind>("app");
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!path.trim())
      return toast("err", "Escribe la ruta del archivo (ej: /videos/clase.mp4) o pega un enlace.");
    setSaving(true);
    const res = await api.add({
      kind,
      name: name.trim() || path.trim().split("/").pop() || path.trim(),
      path: path.trim(),
      note: note.trim(),
    });
    setSaving(false);
    if (!res.ok) return toast("err", `No se pudo registrar: ${res.error}`);
    toast("ok", "Archivo registrado en el escáner ✓");
    setName("");
    setPath("");
    setNote("");
  };

  const upload = async (f: File) => {
    setUploading(true);
    const bucket = kind === "image" ? "banners" : "descargas";
    const res = await uploadToStorage(bucket, f);
    setUploading(false);
    if (res.ok && res.url) {
      setPath(res.url);
      if (!name.trim()) setName(f.name);
      toast("ok", "Archivo subido al almacenamiento. Ahora regístralo.");
    } else toast("err", `No se pudo subir: ${res.error}`);
  };

  const use = (a: PublicAsset) => {
    const resolved = resolveAssetUrl(a.path);
    if (a.kind === "app")
      onUse({
        type: "descarga",
        data: { title: a.name, description: a.note, url: resolved, platform: detectPlatform(a.path) },
      });
    else if (a.kind === "video")
      onUse({
        type: "video",
        data: {
          title: a.name,
          description: a.note,
          url: resolved,
          platform: a.path.startsWith("/") ? "archivo" : detectPlatform(a.path),
        },
      });
    else onUse({ type: "banner", data: { title: a.name, description: a.note, image_url: resolved } });
  };

  const groups = (["app", "video", "image"] as AssetKind[]).map((k) => ({
    k,
    list: api.assets.filter((a) => a.kind === k),
  }));

  return (
    <div className="mt-6 space-y-6">
      {/* --------------------------- cabecera del escáner --------------------------- */}
      <div className="card relative overflow-hidden">
        {api.scanning && <div className="scanline" />}
        <div className="flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
            <FolderOpen size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-paper">
              Escáner de <code className="font-mono text-base text-teal">public/</code>
              {api.scanning && <Loader2 size={14} className="animate-spin text-teal" />}
            </p>
            <p className="mt-0.5 text-[13px] text-fog">
              Detecta aplicaciones, videos e imágenes de tu carpeta <span className="font-mono text-paper">public/</span>{" "}
              para agregarlos a las publicaciones con un clic.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {api.lastScan && (
              <span className="font-mono text-[11px] text-fog">
                {api.lastScan.toLocaleTimeString("es-ES")}
              </span>
            )}
            <button
              onClick={() => api.scan()}
              className="btn-press flex items-center gap-2 rounded-lg border border-teal/50 bg-teal/10 px-3.5 py-2 text-[13px] font-bold text-teal transition hover:bg-teal/20"
            >
              <RefreshCw size={14} className={api.scanning ? "animate-spin" : ""} />
              Re-escanear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-ink-2/60 px-5 py-3">
          {(["public/apps", "public/videos", "public/imagenes", "public/assets.json"] as const).map((f) => (
            <code
              key={f}
              className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-teal"
            >
              {f}
            </code>
          ))}
          <span className="text-[12px] text-fog">
            Coloca tus archivos en esas carpetas y regístralos aquí o en el manifiesto.
          </span>
        </div>
      </div>

      {/* ----------------------------- formulario agregar ----------------------------- */}
      <div className="card p-5">
        <p className="flex items-center gap-2 font-display text-base font-extrabold text-paper">
          <Plus size={15} className="text-teal" /> Registrar un archivo en el escáner
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-3">
            <span className="kicker block text-fog">Tipo de archivo</span>
            <div className="grid gap-1.5">
              {(Object.keys(KIND_META) as AssetKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`btn-press flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] font-bold transition ${
                    kind === k
                      ? "border-teal/60 bg-teal/10 text-teal"
                      : "border-line bg-panel text-fog hover:text-paper"
                  }`}
                >
                  <span style={{ color: KIND_META[k].color }}>
                    <KindGlyph kind={k} size={15} />
                  </span>
                  <span className="flex-1">{KIND_META[k].label}</span>
                  <span className="font-mono text-[10px] font-normal opacity-70">{KIND_META[k].hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Nombre">
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Ej: ${KIND_META[kind].label} de bienvenida`}
                />
              </Field>
              <Field label="Ruta en public/ o enlace">
                <input
                  className="input font-mono text-[13px]"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder={
                    kind === "video"
                      ? "/videos/clase-01.mp4 o https://…"
                      : kind === "app"
                        ? "/apps/mi-app.apk o https://drive.google.com/…"
                        : "/imagenes/promo.png o https://…"
                  }
                />
              </Field>
            </div>
            <Field label="Nota (opcional)">
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Versión, tamaño, descripción breve…"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-press flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-[13px] font-bold text-paper transition hover:border-teal/60 disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} className="text-teal" />}
                {uploading ? "Subiendo…" : "Subir archivo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={submit}
                disabled={saving}
                className="btn-press flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Registrar en el escáner
              </button>
              <span className="text-[12px] text-fog">
                Acepta rutas locales de <span className="font-mono">public/</span>, Drive, Mega, FileTransfer o cualquier URL.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------- grupos detectados ------------------------------- */}
      {groups.map(({ k, list }) => (
        <div key={k} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <p className="flex items-center gap-2.5 font-display text-base font-extrabold text-paper">
              <span style={{ color: KIND_META[k].color }}>
                <KindGlyph kind={k} size={17} />
              </span>
              {KIND_META[k].plural}
            </p>
            <span className="font-mono text-[11px] tracking-widest text-fog">
              [{String(list.length).padStart(2, "0")}]
            </span>
          </div>
          {list.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-fog">
              Nada detectado en <span className="font-mono text-teal">{KIND_META[k].folder}</span>. Agrega un
              archivo con el formulario de arriba.
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {list.map((a) => (
                <AssetRow
                  key={a.id}
                  a={a}
                  actionLabel={KIND_META[k].action}
                  color={KIND_META[k].color}
                  kind={k}
                  onUse={() => use(a)}
                  onRemove={async () => {
                    const res = await api.remove(a.id);
                    if (!res.ok) toast("err", `No se pudo quitar: ${res.error}`);
                    else toast("ok", "Archivo quitado del escáner.");
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function AssetRow({
  a,
  kind,
  actionLabel,
  color,
  onUse,
  onRemove,
}: {
  a: PublicAsset;
  kind: AssetKind;
  actionLabel: string;
  color: string;
  onUse: () => void;
  onRemove: () => void;
}) {
  const [status, setStatus] = useState<VerifyState>("checking");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    let on = true;
    setStatus("checking");
    verifyAsset(a.path).then((s) => {
      if (on) setStatus(s);
    });
    return () => {
      on = false;
    };
  }, [a.path]);

  const isLocal = a.path.startsWith("/");

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-panel-2/50 sm:flex-nowrap">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-2"
        style={{ color }}
      >
        <KindGlyph kind={kind} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-paper">
          <span className="truncate">{a.name}</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
              a.source === "manifest" ? "bg-amber/15 text-amber" : "bg-teal/15 text-teal"
            }`}
          >
            {a.source === "manifest" ? "assets.json" : "panel"}
          </span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-fog" title={a.path}>
          {/^https?:\/\//i.test(a.path) ? <Link2 size={11} className="shrink-0" /> : null}
          <span className="truncate">{a.path}</span>
          {a.note && <span className="shrink-0 font-sans text-fog/80">· {a.note}</span>}
        </p>
      </div>

      {/* estado de verificación */}
      <span
        className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
          status === "ok"
            ? "bg-teal/12 text-teal"
            : status === "missing"
              ? "bg-coral/12 text-coral"
              : "bg-panel-2 text-fog"
        }`}
      >
        {status === "checking" ? (
          <>
            <Loader2 size={11} className="animate-spin" /> comprobando
          </>
        ) : status === "ok" ? (
          <>
            <CheckCircle2 size={11} /> disponible
          </>
        ) : status === "missing" ? (
          <>
            <XCircle size={11} /> no encontrado
          </>
        ) : (
          <>
            <ExternalLink size={11} /> enlace externo
          </>
        )}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onUse}
          disabled={isLocal && status === "missing"}
          title={isLocal && status === "missing" ? "El archivo no existe en public/" : undefined}
          className="btn-press rounded-lg border border-amber/60 bg-amber/10 px-3 py-2 text-[12px] font-bold text-amber transition hover:bg-amber hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {actionLabel}
        </button>
        {a.source === "admin" &&
          (confirm ? (
            <button
              onClick={() => {
                setConfirm(false);
                onRemove();
              }}
              className="btn-press rounded-md bg-coral px-2 py-1.5 text-[11px] font-bold text-ink"
            >
              ¿Seguro?
            </button>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              aria-label="Quitar del escáner"
              className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-coral"
            >
              <Trash2 size={15} />
            </button>
          ))}
      </div>
    </li>
  );
}

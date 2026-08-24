import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import {
  TYPE_META,
  PLATFORM_META,
  DONATION_METHODS,
  uploadToStorage,
  type ContentType,
  type ContentItem,
  type Donation,
} from "../lib/supabase";
import type { ContentInput, DonationInput } from "../lib/content";
import type { ContentApi } from "../hooks/useContent";
import ImagePicker from "./ImagePicker";

type Tab = ContentType | "donaciones";

const TABS: Tab[] = ["video", "banner", "anuncio", "app", "descarga", "codigo", "nota", "donaciones"];

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
  video: ["youtube", "tiktok", "instagram", "web"],
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
          const count = isDon ? api.donations.length : api.items.filter((i) => i.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn-press rounded-lg px-3 py-2 text-[13px] font-bold transition ${
                tab === t
                  ? isDon
                    ? "bg-coral text-ink"
                    : "bg-amber text-ink"
                  : "text-fog hover:bg-panel-2 hover:text-paper"
              }`}
            >
              {isDon ? "Donaciones" : TYPE_META[t].label}
              <span className={`ml-1.5 font-mono text-[10px] ${tab === t ? "opacity-70" : "text-fog"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "donaciones" ? (
        <DonationsSection api={api} toast={toast} />
      ) : (
        <ContentSection api={api} tab={tab} toast={toast} />
      )}
    </main>
  );
}

/* ============================ SECCIÓN CONTENIDO ============================ */

function ContentSection({
  api,
  tab,
  toast,
}: {
  api: ContentApi;
  tab: ContentType;
  toast: Props["toast"];
}) {
  const [form, setForm] = useState<ContentInput>(emptyForm(tab));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

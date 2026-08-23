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
  BookOpen,
  MonitorPlay,
} from "lucide-react";
import {
  TYPE_META,
  PLATFORM_META,
  type ContentType,
  type ContentItem,
} from "../lib/supabase";
import { youtubeId, ytThumb, type ContentInput } from "../lib/content";
import type { ContentApi } from "../hooks/useContent";
import { PlatformIcon } from "./Icons";

const TABS: ContentType[] = ["video", "banner", "anuncio", "app", "codigo", "nota"];

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
  platform: type === "video" ? "youtube" : "web",
  code_text: "",
  active: true,
});

export default function Admin({ api, userEmail, onSignOut, onViewLobby, toast }: Props) {
  const [tab, setTab] = useState<ContentType>("video");
  const [form, setForm] = useState<ContentInput>(emptyForm("video"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const group = useMemo(
    () =>
      api.items
        .filter((i) => i.type === tab)
        .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
    [api.items, tab]
  );

  const changeTab = (t: ContentType) => {
    setTab(t);
    setForm(emptyForm(t));
    setEditingId(null);
    setConfirmId(null);
  };

  const set = (patch: Partial<ContentInput>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.title.trim()) return toast("err", "El título es obligatorio.");
    if (form.type === "video" && !form.url.trim())
      return toast("err", "Los videos necesitan un enlace (YouTube, TikTok, Instagram…).");
    if (form.type === "codigo" && !form.code_text.trim())
      return toast("err", "Escribe el texto del código o cupón.");
    setSaving(true);
    const res = await api.save(form);
    setSaving(false);
    if (!res.ok) {
      toast(
        "err",
        res.error === "Supabase no está configurado."
          ? "Estás en modo demo: ejecuta supabase/schema.sql en Supabase para poder guardar."
          : `No se pudo guardar: ${res.error}`
      );
      return;
    }
    toast("ok", editingId ? "Cambios publicados en tiempo real ✓" : "Elemento publicado en tiempo real ✓");
    setForm(emptyForm(tab));
    setEditingId(null);
  };

  const startEdit = (it: ContentItem) => {
    setTab(it.type);
    setForm({
      id: it.id,
      type: it.type,
      title: it.title,
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
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm(tab));
    }
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

  const showUrl = tab !== "codigo" && tab !== "anuncio";
  const showImage = tab === "banner" || tab === "app" || tab === "video";
  const showPlatform = tab === "video" || tab === "app";

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
            Sesión: <span className="font-mono text-paper">{userEmail}</span> · Cada cambio se
            emite al instante a todos los dispositivos.
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

      {/* aviso modo demo + guía */}
      {api.isDemo && (
        <div className="mb-6 rounded-xl border border-amber/50 bg-amber/[0.07] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-amber">
            <AlertTriangle size={16} /> Modo demostración: aún no hay contenido guardado en tu base
            de datos.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-fog">
            Estás viendo contenido de ejemplo. Para publicar de verdad, ejecuta{" "}
            <code className="font-mono text-amber">supabase/schema.sql</code> en el SQL Editor de tu
            proyecto Supabase y activa el proveedor de Google en Authentication.
          </p>
          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-bold text-paper transition hover:text-amber">
              <BookOpen size={14} className="text-amber" />
              Guía rápida de conexión (4 pasos)
              <ChevronDown size={14} className="transition group-open:rotate-180" />
            </summary>
            <ol className="mt-3 grid gap-2 text-[13px] text-fog sm:grid-cols-2">
              {[
                "Abre tu proyecto en supabase.co → SQL Editor y ejecuta todo el archivo supabase/schema.sql.",
                "Ve a Authentication → Providers → Google y activa el proveedor con tus credenciales de Google Cloud.",
                "En Authentication → URL Configuration agrega como URL de redirección: https://mayfrend-app.github.io/ve/ (y http://localhost:5173 para desarrollo).",
                "Inicia sesión con Google: la primera cuenta se registra sola como administradora.",
              ].map((s, i) => (
                <li key={i} className="flex gap-2.5 rounded-lg border border-line bg-ink-2 p-3">
                  <span className="font-mono text-xs font-bold text-amber">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}

      {/* pestañas + estadísticas */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = api.items.filter((i) => i.type === t).length;
          const on = t === tab;
          return (
            <button
              key={t}
              onClick={() => changeTab(t)}
              className={`btn-press flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-bold transition ${
                on
                  ? "border-transparent text-ink"
                  : "border-line bg-panel text-fog hover:border-fog/50 hover:text-paper"
              }`}
              style={on ? { background: TYPE_META[t].accent } : undefined}
            >
              {TYPE_META[t].plural.split(" ")[0]}
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                  on ? "bg-ink/20 text-ink" : "bg-ink-2 text-fog"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* editor */}
      <div ref={formRef} className="card scroll-mt-24 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-paper">
            {editingId ? `Editando: ${TYPE_META[tab].label.toLowerCase()}` : `Nuevo elemento · ${TYPE_META[tab].label.toLowerCase()}`}
          </h2>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm(tab));
              }}
              className="btn-press flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-fog transition hover:text-paper"
            >
              <X size={13} /> Cancelar edición
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="kicker mb-1.5 block text-fog">Título *</span>
            <input
              className="input"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={tab === "anuncio" ? "Texto que rota en la cinta de anuncios" : "Ej. Curso de React desde cero"}
            />
          </label>

          {showPlatform && (
            <label className="block">
              <span className="kicker mb-1.5 block text-fog">Plataforma</span>
              <select
                className="input"
                value={form.platform}
                onChange={(e) => set({ platform: e.target.value })}
              >
                {Object.entries(PLATFORM_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showUrl && (
            <label className="block sm:col-span-2">
              <span className="kicker mb-1.5 block text-fog">
                Enlace {tab === "video" ? "(YouTube, TikTok, Instagram…) *" : "(opcional)"}
              </span>
              <input
                className="input font-mono text-[13px]"
                value={form.url}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
          )}

          {showImage && (
            <label className="block sm:col-span-2">
              <span className="kicker mb-1.5 block text-fog">URL de imagen (opcional)</span>
              <input
                className="input font-mono text-[13px]"
                value={form.image_url}
                onChange={(e) => set({ image_url: e.target.value })}
                placeholder="https://…/imagen.jpg"
              />
            </label>
          )}

          {tab === "codigo" && (
            <label className="block sm:col-span-2">
              <span className="kicker mb-1.5 block text-fog">Texto del código *</span>
              <input
                className="input font-mono tracking-[0.14em]"
                value={form.code_text}
                onChange={(e) => set({ code_text: e.target.value.toUpperCase() })}
                placeholder="VE-2026-WELCOME"
              />
            </label>
          )}

          <label className="block sm:col-span-2">
            <span className="kicker mb-1.5 block text-fog">
              {tab === "codigo" ? "Qué desbloquea este código" : "Descripción"} (opcional)
            </span>
            <textarea
              className="input min-h-[74px] resize-y"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Un resumen breve que aparecerá en la tarjeta…"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 self-end pb-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => set({ active: !form.active })}
              className={`relative h-5 w-9 rounded-full transition ${form.active ? "bg-teal" : "bg-line"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${
                  form.active ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-[13px] font-semibold text-paper">
              Visible en el lobby {form.active ? "(al aire)" : "(oculto)"}
            </span>
          </label>

          <div className="flex justify-end gap-2 self-end">
            <button
              onClick={submit}
              disabled={saving}
              className="btn-press flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Publicando…" : editingId ? "Guardar cambios" : "Publicar ahora"}
            </button>
          </div>
        </div>
      </div>

      {/* listado */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-paper">
            {TYPE_META[tab].plural}{" "}
            <span className="font-mono text-xs font-medium text-fog">({group.length})</span>
          </h2>
          <p className="kicker text-fog">El orden se refleja en el lobby</p>
        </div>

        {group.length === 0 && (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <Plus size={22} className="text-amber" />
            <p className="font-display text-lg font-bold text-paper">
              Todavía no hay {TYPE_META[tab].plural.toLowerCase()}
            </p>
            <p className="max-w-sm text-sm text-fog">
              Usa el editor de arriba para publicar el primero: aparecerá al instante en el lobby
              de todos los visitantes.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {group.map((it, i) => {
            const yt = youtubeId(it.url);
            return (
              <li
                key={it.id}
                className={`card flex items-center gap-3 p-2.5 transition ${
                  !it.active ? "opacity-55" : ""
                } ${editingId === it.id ? "border-amber/60" : ""}`}
              >
                {/* orden */}
                <div className="flex flex-col">
                  <button
                    onClick={() => doMove(it.id, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className="btn-press rounded p-0.5 text-fog transition hover:text-amber disabled:opacity-25"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <span className="text-center font-mono text-[10px] text-fog">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => doMove(it.id, 1)}
                    disabled={i === group.length - 1}
                    aria-label="Bajar"
                    className="btn-press rounded p-0.5 text-fog transition hover:text-amber disabled:opacity-25"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* miniatura */}
                <span className="hidden h-12 w-20 shrink-0 overflow-hidden rounded-md bg-ink-2 sm:block">
                  {yt ? (
                    <img src={ytThumb(yt)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : it.image_url ? (
                    <img src={it.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center"
                      style={{ color: PLATFORM_META[it.platform]?.color ?? "#97a1b4" }}
                    >
                      <PlatformIcon platform={it.platform} size={18} />
                    </span>
                  )}
                </span>

                {/* datos */}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-paper">{it.title}</span>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: TYPE_META[it.type].accent,
                        background: `${TYPE_META[it.type].accent}1a`,
                      }}
                    >
                      {TYPE_META[it.type].label}
                    </span>
                    {it.code_text && (
                      <code className="rounded border border-amber/40 px-1.5 py-0.5 font-mono text-[10px] text-amber">
                        {it.code_text}
                      </code>
                    )}
                  </p>
                  <p className="truncate font-mono text-[11px] text-fog">
                    {it.url || it.description || "—"}
                  </p>
                </div>

                {/* acciones */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => doToggle(it)}
                    title={it.active ? "Ocultar del lobby" : "Mostrar en el lobby"}
                    className={`btn-press rounded-md border border-line p-2 transition ${
                      it.active
                        ? "text-teal hover:border-teal/60"
                        : "text-fog hover:border-amber/60 hover:text-amber"
                    }`}
                  >
                    {it.active ? <Power size={15} /> : <PowerOff size={15} />}
                  </button>
                  <button
                    onClick={() => startEdit(it)}
                    title="Editar"
                    className="btn-press rounded-md border border-line p-2 text-fog transition hover:border-amber/60 hover:text-amber"
                  >
                    <Pencil size={15} />
                  </button>
                  {confirmId === it.id ? (
                    <span className="flex items-center gap-1 rounded-md border border-coral/60 bg-coral/10 px-1.5 py-1">
                      <button
                        onClick={() => doDelete(it.id)}
                        className="btn-press rounded bg-coral px-2 py-1 text-[11px] font-bold text-ink"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="btn-press rounded px-1.5 py-1 text-[11px] font-semibold text-fog hover:text-paper"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(it.id)}
                      title="Eliminar"
                      className="btn-press rounded-md border border-line p-2 text-fog transition hover:border-coral/60 hover:text-coral"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

import { supabase, type ContentItem, type ContentType } from "./supabase";

/* ------------------------------ utilidades ------------------------------ */

export function youtubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

export const ytThumb = (id: string, q: "mqdefault" | "hqdefault" = "mqdefault") =>
  `https://i.ytimg.com/vi/${id}/${q}.jpg`;

export type Result = { ok: boolean; error?: string };

export interface ContentInput {
  id?: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  image_url: string;
  platform: string;
  code_text: string;
  active: boolean;
}

/* ------------------------------- CRUD remoto ----------------------------- */

export async function fetchContent(): Promise<{ items: ContentItem[]; fromDb: boolean }> {
  if (!supabase) return { items: DEMO_ITEMS, fromDb: false };
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return { items: DEMO_ITEMS, fromDb: false };
  if (data.length === 0) return { items: DEMO_ITEMS, fromDb: false };
  return { items: data as ContentItem[], fromDb: true };
}

export async function saveContent(input: ContentInput): Promise<Result> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const payload = {
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    url: input.url.trim(),
    image_url: input.image_url.trim(),
    platform: input.platform,
    code_text: input.code_text.trim(),
    active: input.active,
  };

  if (input.id) {
    const { error } = await supabase.from("content").update(payload).eq("id", input.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  // nuevo elemento: se coloca al final de su grupo
  const { data: group } = await supabase
    .from("content")
    .select("sort_order")
    .eq("type", input.type);
  const max = (group ?? []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1);

  const { error } = await supabase
    .from("content")
    .insert({ ...payload, sort_order: max + 1 });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteContent(id: string): Promise<Result> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const { error } = await supabase.from("content").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setActiveContent(id: string, active: boolean): Promise<Result> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const { error } = await supabase.from("content").update({ active }).eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function moveContent(
  items: ContentItem[],
  id: string,
  dir: -1 | 1
): Promise<Result> {
  const item = items.find((i) => i.id === id);
  if (!item) return { ok: false, error: "Elemento no encontrado." };
  const group = items
    .filter((i) => i.type === item.type)
    .sort((a, b) => a.sort_order - b.sort_order);
  const idx = group.findIndex((g) => g.id === id);
  const other = group[idx + dir];
  if (!other) return { ok: true };
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("content").update({ sort_order: other.sort_order }).eq("id", item.id),
    supabase.from("content").update({ sort_order: item.sort_order }).eq("id", other.id),
  ]);
  const err = e1 ?? e2;
  return err ? { ok: false, error: err.message } : { ok: true };
}

/* ------------------------- contenido de demostración --------------------- */

const IMG = {
  bootcamp: "https://image.qwenlm.ai/generated-images/d0ff5f98-2ee9-483f-822e-8e1ecf102e4c/_result.png",
  app: "https://image.qwenlm.ai/generated-images/2e68a645-6e6a-4965-9e67-706d048e0847/_result.png",
  comunidad: "https://image.qwenlm.ai/generated-images/8e8119c4-716c-41e5-9a2e-d44adaba87ac/_result.png",
};

const d = (offsetHours: number) =>
  new Date(Date.now() - offsetHours * 3600_000).toISOString();

const demo = (
  id: string,
  type: ContentType,
  title: string,
  description: string,
  url: string,
  extra: Partial<ContentItem> = {},
  hoursAgo = 1
): ContentItem => ({
  id,
  type,
  title,
  description,
  url,
  image_url: "",
  platform: "web",
  code_text: "",
  active: true,
  sort_order: 0,
  created_at: d(hoursAgo),
  ...extra,
});

export const DEMO_ITEMS: ContentItem[] = [
  demo("dv-1", "video", "Curso completo de Python desde cero",
    "Variables, funciones, bucles y proyectos reales en un solo video. Ideal para tu primer lenguaje.",
    "https://www.youtube.com/watch?v=rfscVS0vtbw",
    { platform: "youtube", sort_order: 0 }, 26),
  demo("dv-2", "video", "JavaScript moderno: curso intensivo",
    "Todo lo esencial del lenguaje de la web: DOM, eventos, fetch y async/await explicado sin rodeos.",
    "https://www.youtube.com/watch?v=hdI2bqOjy3c",
    { platform: "youtube", sort_order: 1 }, 24),
  demo("dv-3", "video", "Git y GitHub para principiantes",
    "Aprende a versionar tu código, crear ramas y colaborar como en un equipo profesional.",
    "https://www.youtube.com/watch?v=RGOj5yH7evk",
    { platform: "youtube", sort_order: 2 }, 22),
  demo("dv-4", "video", "React JS desde cero",
    "Componentes, hooks y estado: construye interfaces modernas paso a paso.",
    "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
    { platform: "youtube", sort_order: 3 }, 20),
  demo("dv-5", "video", "Node.js y APIs REST paso a paso",
    "Monta tu primer backend con rutas, middleware y conexión a base de datos.",
    "https://www.youtube.com/watch?v=fBNz5xF-Kx4",
    { platform: "youtube", sort_order: 4 }, 18),
  demo("dv-6", "video", "Tips de código en 60 segundos",
    "Serie de videos cortos con trucos de programación para ver en el móvil.",
    "https://www.tiktok.com/@midudev",
    { platform: "tiktok", sort_order: 5 }, 12),
  demo("dv-7", "video", "Reels: trucos de productividad dev",
    "Los mejores reels de programación curados para tu feed.",
    "https://www.instagram.com/explore/tags/programacion/",
    { platform: "instagram", sort_order: 6 }, 10),

  demo("db-1", "banner", "Bootcamp de Desarrollo Web 2026",
    "Inscripciones abiertas: 12 semanas, proyectos reales y mentoría en vivo.",
    "https://www.youtube.com/watch?v=rfscVS0vtbw",
    { image_url: IMG.bootcamp, sort_order: 0 }, 30),
  demo("db-2", "banner", "MAYFREND.VE Móvil ya disponible",
    "Lleva el canal contigo: descarga la beta y mira tutoriales donde quieras.",
    "https://github.com/mayfrend-app/ve",
    { image_url: IMG.app, sort_order: 1 }, 28),
  demo("db-3", "banner", "Únete a la comunidad MAYFREND.VE",
    "Comparte tus proyectos, resuelve dudas y entérate primero de cada estreno.",
    "https://github.com/mayfrend-app/ve",
    { image_url: IMG.comunidad, sort_order: 2 }, 25),

  demo("da-1", "anuncio", "Nuevo tutorial de React todos los viernes a las 19:00", "", "", { sort_order: 0 }, 8),
  demo("da-2", "anuncio", "Códigos de descuento disponibles en la sección Códigos", "", "", { sort_order: 1 }, 7),
  demo("da-3", "anuncio", "Síguenos en TikTok e Instagram para tips diarios de programación", "", "", { sort_order: 2 }, 6),

  demo("dp-1", "app", "MAYFREND Player",
    "El reproductor oficial del canal: cola automática, atajos de teclado y modo cine.",
    "https://github.com/mayfrend-app/ve",
    { platform: "web", sort_order: 0 }, 40),
  demo("dp-2", "app", "CodeSandbox",
    "Editor online para practicar lo que aprendes en los tutoriales, sin instalar nada.",
    "https://codesandbox.io/",
    { platform: "web", sort_order: 1 }, 38),
  demo("dp-3", "app", "Figma",
    "Diseña las interfaces de tus proyectos con la herramienta que usa la industria.",
    "https://www.figma.com/",
    { platform: "web", sort_order: 2 }, 36),

  demo("dc-1", "codigo", "Bienvenida al Bootcamp",
    "20% de descuento en tu primera inscripción al bootcamp 2026.",
    "", { code_text: "MAYFREND-WELCOME-2026", sort_order: 0 }, 16),
  demo("dc-2", "codigo", "Acceso beta a MAYFREND.VE Móvil",
    "Canjea este código en la app para desbloquear la beta cerrada.",
    "", { code_text: "MAYFREND-BETA-7842", sort_order: 1 }, 14),

  demo("dn-1", "nota", "Cómo funciona MAYFREND.VE",
    "El reproductor principal encadena todos los videos de la cartelera de forma automática. Puedes pausar la cola, silenciar o elegir cualquier video desde la parrilla. Todo lo que el administrador publique aparece aquí al instante, en todos los dispositivos.",
    "", { sort_order: 0 }, 50),
  demo("dn-2", "nota", "Ruta de aprendizaje sugerida",
    "1) Python o JavaScript desde cero · 2) Git y GitHub · 3) React para el frontend · 4) Node.js para el backend. Cada paso tiene su tutorial en la cartelera; avanza en orden y practica con los proyectos propuestos.",
    "", { sort_order: 1 }, 48),
];

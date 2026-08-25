import { supabase, type ContentItem, type Donation } from "./supabase";

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

/** ¿Es un archivo de video reproducible directamente (mp4, webm, mov…)? */
export function isDirectVideo(item: { url: string; platform: string }): boolean {
  if (item.platform === "archivo") return true;
  return /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i.test(item.url ?? "");
}

export function directVideoExt(url: string): string {
  const m = (url ?? "").match(/\.([a-z0-9]{2,5})(\?|#|$)/i);
  return m ? m[1].toUpperCase() : "VIDEO";
}

/** Detecta la plataforma de un enlace para prellenar formularios. */
export function detectPlatform(url: string): string {
  if (youtubeId(url)) return "youtube";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/drive\.google\.com/i.test(url)) return "drive";
  if (/mega\.nz/i.test(url)) return "mega";
  if (/filetransfer|wetransfer/i.test(url)) return "filetransfer";
  return "web";
}

export type Result = { ok: boolean; error?: string };

const NO_DB: Result = { ok: false, error: "Supabase no está configurado." };

export interface ContentInput {
  id?: string;
  type: ContentItem["type"];
  title: string;
  description: string;
  url: string;
  image_url: string;
  platform: string;
  code_text: string;
  active: boolean;
}

export interface DonationInput {
  id?: string;
  method: string;
  label: string;
  detail: string;
  detail2: string;
  active: boolean;
}

/* ------------------------------ CRUD contenido ----------------------------- */

export async function fetchContent(): Promise<ContentItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as ContentItem[];
}

export async function saveContent(input: ContentInput): Promise<Result> {
  if (!supabase) return NO_DB;
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

  const { data: group } = await supabase
    .from("content")
    .select("sort_order")
    .eq("type", input.type);
  const max = (group ?? []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1);

  const { error } = await supabase.from("content").insert({ ...payload, sort_order: max + 1 });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteContent(id: string): Promise<Result> {
  if (!supabase) return NO_DB;
  const { error } = await supabase.from("content").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setActiveContent(id: string, active: boolean): Promise<Result> {
  if (!supabase) return NO_DB;
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
  if (!supabase) return NO_DB;

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("content").update({ sort_order: other.sort_order }).eq("id", item.id),
    supabase.from("content").update({ sort_order: item.sort_order }).eq("id", other.id),
  ]);
  const err = e1 ?? e2;
  return err ? { ok: false, error: err.message } : { ok: true };
}

/* ------------------------------ CRUD donaciones ----------------------------- */

export async function fetchDonations(): Promise<Donation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Donation[];
}

export async function saveDonation(input: DonationInput): Promise<Result> {
  if (!supabase) return NO_DB;
  const payload = {
    method: input.method,
    label: input.label.trim(),
    detail: input.detail.trim(),
    detail2: input.detail2.trim(),
    active: input.active,
  };

  if (input.id) {
    const { error } = await supabase.from("donations").update(payload).eq("id", input.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { data: group } = await supabase.from("donations").select("sort_order");
  const max = (group ?? []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1);

  const { error } = await supabase.from("donations").insert({ ...payload, sort_order: max + 1 });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteDonation(id: string): Promise<Result> {
  if (!supabase) return NO_DB;
  const { error } = await supabase.from("donations").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Las credenciales se leen de variables de entorno (.env) para no
 * exponerlas directamente en el código visible del repositorio.
 * La clave "publishable/anon" es segura para el navegador por diseño de Supabase.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type ContentType =
  | "video"
  | "banner"
  | "anuncio"
  | "app"
  | "descarga"
  | "codigo"
  | "nota";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  image_url: string;
  platform: string;
  code_text: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Donation {
  id: string;
  method: string;
  label: string;
  detail: string;
  detail2: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const TYPE_META: Record<ContentType, { label: string; plural: string; accent: string }> = {
  video: { label: "Video", plural: "Videos y tutoriales", accent: "#ff5c4d" },
  banner: { label: "Banner", plural: "Banners publicitarios", accent: "#ffb224" },
  anuncio: { label: "Anuncio", plural: "Anuncios (cinta)", accent: "#ff5c4d" },
  app: { label: "App / Juego", plural: "Aplicaciones y juegos", accent: "#31d3bd" },
  descarga: { label: "Descarga", plural: "Descargas y archivos", accent: "#a78bfa" },
  codigo: { label: "Código", plural: "Códigos y cupones", accent: "#ffb224" },
  nota: { label: "Nota", plural: "Notas e información", accent: "#31d3bd" },
};

export const PLATFORM_META: Record<string, { label: string; color: string }> = {
  youtube: { label: "YouTube", color: "#ff5c4d" },
  tiktok: { label: "TikTok", color: "#31d3bd" },
  instagram: { label: "Instagram", color: "#ffb224" },
  drive: { label: "Google Drive", color: "#a78bfa" },
  mega: { label: "Mega", color: "#ff5c4d" },
  filetransfer: { label: "FileTransfer", color: "#31d3bd" },
  archivo: { label: "Archivo local", color: "#ffb224" },
  web: { label: "Web", color: "#97a1b4" },
  otro: { label: "Otro", color: "#97a1b4" },
};

/* --------------------- Escáner de la carpeta public/ --------------------- */

export type AssetKind = "app" | "video" | "image";

export interface PublicAsset {
  id: string;
  kind: AssetKind;
  name: string;
  path: string;
  note: string;
  source: "manifest" | "admin";
  created_at: string;
}

export async function fetchPublicAssetsDb(): Promise<PublicAsset[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_assets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Omit<PublicAsset, "source">[]).map((r) => ({ ...r, source: "admin" as const }));
}

export async function insertPublicAsset(input: {
  kind: AssetKind;
  name: string;
  path: string;
  note: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const { error } = await supabase.from("public_assets").insert({
    kind: input.kind,
    name: input.name.trim(),
    path: input.path.trim(),
    note: input.note.trim(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deletePublicAsset(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const { error } = await supabase.from("public_assets").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Resuelve rutas locales ("/apps/x.apk") contra la base del sitio; las URLs externas pasan igual. */
export function resolveAssetUrl(path: string): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/* Métodos de donación disponibles en el panel */
export const DONATION_METHODS: Record<string, { label: string; color: string; hint: string }> = {
  paypal: { label: "PayPal", color: "#58a8e0", hint: "Correo o enlace paypal.me" },
  binance: { label: "Binance", color: "#f3ba2f", hint: "Binance Pay ID o dirección" },
  pago_movil: { label: "Pago Móvil", color: "#31d3bd", hint: "Banco, teléfono y cédula" },
  zelle: { label: "Zelle", color: "#a78bfa", hint: "Correo registrado en Zelle" },
  transferencia: { label: "Transferencia", color: "#97a1b4", hint: "Banco y número de cuenta" },
};

/* ------------------------------ Storage (imágenes y archivos) ------------------------------ */

export async function uploadToStorage(
  bucket: "banners" | "descargas",
  file: File
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/* Galería local: imágenes colocadas en public/baner */
export interface GalleryImage {
  name: string;
  src: string;
}

export async function fetchGallery(): Promise<GalleryImage[]> {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const res = await fetch(`${base}baner/images.json`);
    if (!res.ok) return [];
    const list = (await res.json()) as string[];
    // Cada entrada puede ser una URL absoluta (https://…) o el nombre de un
    // archivo colocado dentro de public/baner (p. ej. "mi-banner.png").
    return list.map((entry) => ({
      name: entry.split("/").pop() ?? entry,
      src: /^https?:\/\//.test(entry) ? entry : `${base}baner/${entry}`,
    }));
  } catch {
    return [];
  }
}

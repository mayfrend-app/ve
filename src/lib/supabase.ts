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

export type ContentType = "video" | "banner" | "anuncio" | "app" | "codigo" | "nota";

export type Platform = "youtube" | "tiktok" | "instagram" | "web" | "otro";

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

export const TYPE_META: Record<ContentType, { label: string; plural: string; accent: string }> = {
  video: { label: "Video", plural: "Videos y tutoriales", accent: "#ff5c4d" },
  banner: { label: "Banner", plural: "Banners publicitarios", accent: "#ffb224" },
  anuncio: { label: "Anuncio", plural: "Anuncios (cinta)", accent: "#ff5c4d" },
  app: { label: "App", plural: "Aplicaciones", accent: "#31d3bd" },
  codigo: { label: "Código", plural: "Códigos y cupones", accent: "#ffb224" },
  nota: { label: "Nota", plural: "Notas e información", accent: "#31d3bd" },
};

export const PLATFORM_META: Record<string, { label: string; color: string }> = {
  youtube: { label: "YouTube", color: "#ff5c4d" },
  tiktok: { label: "TikTok", color: "#31d3bd" },
  instagram: { label: "Instagram", color: "#ffb224" },
  web: { label: "Web", color: "#97a1b4" },
  otro: { label: "Otro", color: "#97a1b4" },
};

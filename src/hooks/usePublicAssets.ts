import { useCallback, useEffect, useRef, useState } from "react";
import {
  supabase,
  fetchPublicAssetsDb,
  insertPublicAsset,
  deletePublicAsset,
  resolveAssetUrl,
  type PublicAsset,
  type AssetKind,
} from "../lib/supabase";

type ManifestEntry = string | { name?: string; path: string; note?: string };
type Manifest = Partial<Record<"apps" | "videos" | "images", ManifestEntry[]>>;

const KIND_BY_KEY: Record<"apps" | "videos" | "images", AssetKind> = {
  apps: "app",
  videos: "video",
  images: "image",
};

async function fetchManifest(): Promise<PublicAsset[]> {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const res = await fetch(`${base}assets.json?v=${Date.now()}`);
    if (!res.ok) return [];
    const json = (await res.json()) as Manifest;
    const out: PublicAsset[] = [];
    (Object.keys(KIND_BY_KEY) as (keyof typeof KIND_BY_KEY)[]).forEach((key) => {
      const kind = KIND_BY_KEY[key];
      (json[key] ?? []).forEach((entry, i) => {
        const e = typeof entry === "string" ? { path: entry } : entry;
        if (!e?.path) return;
        out.push({
          id: `m-${kind}-${i}-${e.path}`,
          kind,
          name: e.name || e.path.split("/").pop() || e.path,
          path: e.path,
          note: e.note ?? "",
          source: "manifest",
          created_at: "",
        });
      });
    });
    return out;
  } catch {
    return [];
  }
}

export type VerifyState = "checking" | "ok" | "missing" | "externo";

/** Comprueba si un archivo local existe en public/ (los enlaces externos no se verifican). */
export async function verifyAsset(path: string): Promise<VerifyState> {
  if (/^https?:\/\//i.test(path)) return "externo";
  try {
    const res = await fetch(resolveAssetUrl(path), { method: "HEAD" });
    return res.ok ? "ok" : "missing";
  } catch {
    return "missing";
  }
}

export function usePublicAssets() {
  const [assets, setAssets] = useState<PublicAsset[]>([]);
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const busyRef = useRef(false);

  const scan = useCallback(async (silent = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (!silent) setScanning(true);
    try {
      const [manifest, db] = await Promise.all([fetchManifest(), fetchPublicAssetsDb()]);
      setAssets([...manifest, ...db]);
      setLastScan(new Date());
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    scan();
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel("ve-public-assets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "public_assets" },
        () => scan(true)
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [scan]);

  const add = useCallback(
    async (input: { kind: AssetKind; name: string; path: string; note: string }) => {
      const res = await insertPublicAsset(input);
      if (res.ok) await scan(true);
      return res;
    },
    [scan]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await deletePublicAsset(id);
      if (res.ok) await scan(true);
      return res;
    },
    [scan]
  );

  return { assets, scanning, lastScan, scan, add, remove };
}

export type PublicAssetsApi = ReturnType<typeof usePublicAssets>;

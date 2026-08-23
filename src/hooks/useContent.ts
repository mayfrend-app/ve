import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, type ContentItem } from "../lib/supabase";
import {
  DEMO_ITEMS,
  fetchContent,
  saveContent,
  deleteContent,
  setActiveContent,
  moveContent,
  type ContentInput,
  type Result,
} from "../lib/content";

export type RtStatus = "off" | "connecting" | "live";

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>(DEMO_ITEMS);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [rt, setRt] = useState<RtStatus>("off");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { items: data, fromDb } = await fetchContent();
      setItems(data);
      setIsDemo(!fromDb);
      setLastSync(new Date());
    } catch {
      setItems(DEMO_ITEMS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const client = supabase;
    if (!client) return;
    setRt("connecting");
    const channel = client
      .channel("ve-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content" },
        () => load(true)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRt("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
          setRt("off");
        else setRt("connecting");
      });
    return () => {
      client.removeChannel(channel);
    };
  }, [load]);

  /* ------------------------- acciones del admin ------------------------- */

  const save = useCallback(
    async (input: ContentInput): Promise<Result> => {
      const res = await saveContent(input);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  const remove = useCallback(
    async (id: string): Promise<Result> => {
      const res = await deleteContent(id);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  const toggleActive = useCallback(
    async (id: string, active: boolean): Promise<Result> => {
      const res = await setActiveContent(id, active);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  const move = useCallback(
    async (id: string, dir: -1 | 1): Promise<Result> => {
      const res = await moveContent(itemsRef.current, id, dir);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  return { items, loading, isDemo, rt, lastSync, refresh: load, save, remove, toggleActive, move };
}

export type ContentApi = ReturnType<typeof useContent>;

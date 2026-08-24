import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, type ContentItem, type Donation } from "../lib/supabase";
import {
  fetchContent,
  saveContent,
  deleteContent,
  setActiveContent,
  moveContent,
  fetchDonations,
  saveDonation,
  deleteDonation,
  type ContentInput,
  type DonationInput,
  type Result,
} from "../lib/content";

export type RtStatus = "off" | "connecting" | "live";

function useRealtimeReload(load: () => void): RtStatus {
  const [rt, setRt] = useState<RtStatus>("off");
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    setRt("connecting");
    const channel = client
      .channel("ve-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "content" }, () =>
        loadRef.current()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () =>
        loadRef.current()
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
  }, []);

  return rt;
}

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [c, d] = await Promise.all([fetchContent(), fetchDonations()]);
      setItems(c);
      setDonations(d);
      setLastSync(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const rt = useRealtimeReload(() => load(true));

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------------- acciones contenido ------------------------- */
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

  /* ------------------------- acciones donaciones ------------------------- */
  const saveDon = useCallback(
    async (input: DonationInput): Promise<Result> => {
      const res = await saveDonation(input);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  const removeDon = useCallback(
    async (id: string): Promise<Result> => {
      const res = await deleteDonation(id);
      if (res.ok) await load(true);
      return res;
    },
    [load]
  );

  return {
    items,
    donations,
    loading,
    rt,
    lastSync,
    refresh: load,
    save,
    remove,
    toggleActive,
    move,
    saveDon,
    removeDon,
  };
}

export type ContentApi = ReturnType<typeof useContent>;

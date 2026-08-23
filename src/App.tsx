import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogIn, LayoutDashboard, ShieldCheck } from "lucide-react";
import { supabase, hasSupabaseConfig } from "./lib/supabase";
import { useContent } from "./hooks/useContent";
import Ticker from "./components/Ticker";
import Lobby from "./components/Lobby";
import Admin from "./components/Admin";
import LoginModal, { type AdminState } from "./components/LoginModal";
import Toasts, { type ToastItem } from "./components/Toasts";
import { VeMark } from "./components/Icons";

type View = "lobby" | "admin";

export default function App() {
  const content = useContent();
  const [view, setView] = useState<View>("lobby");
  const [session, setSession] = useState<Session | null>(null);
  const [adminState, setAdminState] = useState<AdminState>("unknown");
  const [loginOpen, setLoginOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((kind: ToastItem["kind"], msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, kind, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  /* ------------------------- verificación de admin ------------------------- */

  const checkAdmin = useCallback(
    async (email: string | undefined) => {
      const client = supabase;
      const mail = (email ?? "").toLowerCase();
      if (!client || !mail) return setAdminState("setup");
      setAdminState("checking");
      const { data, error } = await client.from("admins").select("email");
      if (error) return setAdminState("setup");
      const list = (data ?? []) as { email: string }[];
      if (list.some((a) => (a.email ?? "").toLowerCase() === mail)) return setAdminState("yes");
      if (list.length === 0) {
        const { error: insErr } = await client.from("admins").insert({ email: mail });
        if (!insErr) {
          toast("ok", "Primera sesión detectada: tu cuenta quedó registrada como administradora.");
          return setAdminState("yes");
        }
      }
      setAdminState("no");
    },
    [toast]
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) checkAdmin(data.session.user.email);
      else setAdminState("unknown");
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) checkAdmin(s.user.email);
      else setAdminState("unknown");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  /* -------------------------------- acciones ------------------------------- */

  const signInWithGoogle = async () => {
    const client = supabase;
    if (!client) {
      toast("err", "Supabase no está configurado. Revisa tu archivo .env.");
      return;
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) toast("err", `No se pudo iniciar el acceso con Google: ${error.message}`);
    else toast("info", "Redirigiendo a Google…");
  };

  const signOut = async () => {
    const client = supabase;
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
    setAdminState("unknown");
    setView("lobby");
    setLoginOpen(false);
    toast("info", "Sesión cerrada.");
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("ok", `Código ${code} copiado al portapapeles.`);
    } catch {
      toast("info", `Código: ${code} (cópialo manualmente)`);
    }
  };

  const userEmail = session?.user.email ?? null;
  const isAdmin = adminState === "yes";
  const anuncios = content.items.filter((i) => i.type === "anuncio" && i.active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ------------------------------- header ------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setView("lobby")}
            className="btn-press flex items-center gap-2.5"
            aria-label="Ir al lobby"
          >
            <VeMark size={34} />
            <span className="text-left leading-none">
              <span className="block font-display text-lg font-extrabold tracking-tight text-paper">
                VE<span className="text-amber">·</span>LOBBY
              </span>
              <span className="kicker mt-0.5 block text-[9px] text-fog">contenidos al aire</span>
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <button
              onClick={() => setView("lobby")}
              className={`btn-press rounded-lg px-3.5 py-2 text-[13px] font-bold transition ${
                view === "lobby" ? "bg-panel-2 text-amber" : "text-fog hover:text-paper"
              }`}
            >
              Lobby
            </button>
            {isAdmin && (
              <button
                onClick={() => setView("admin")}
                className={`btn-press flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-bold transition ${
                  view === "admin" ? "bg-panel-2 text-teal" : "text-fog hover:text-paper"
                }`}
              >
                <LayoutDashboard size={14} /> Panel
              </button>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* estado de conexión */}
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest md:flex ${
                content.rt === "live"
                  ? "border-teal/50 text-teal"
                  : content.rt === "connecting"
                    ? "border-amber/50 text-amber"
                    : "border-line text-fog"
              }`}
            >
              <span
                className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full ${
                  content.rt === "live"
                    ? "bg-teal text-teal"
                    : content.rt === "connecting"
                      ? "bg-amber text-amber"
                      : "bg-fog text-fog"
                }`}
              />
              {content.rt === "live" ? "Realtime" : content.rt === "connecting" ? "Conectando" : content.isDemo ? "Demo" : "Local"}
            </span>

            {isAdmin ? (
              <button
                onClick={() => setLoginOpen(true)}
                className="btn-press flex items-center gap-2 rounded-lg border border-teal/50 bg-teal/10 px-3 py-2 text-[13px] font-bold text-teal transition hover:bg-teal/15"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal font-display text-xs font-extrabold text-ink">
                  {(userEmail?.[0] ?? "A").toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate sm:block">{userEmail}</span>
                <ShieldCheck size={14} />
              </button>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="btn-press flex items-center gap-2 rounded-lg border border-amber/60 bg-amber/10 px-3.5 py-2 text-[13px] font-bold text-amber transition hover:bg-amber/20"
              >
                <LogIn size={15} />
                Acceso admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* cinta de anuncios */}
      <Ticker anuncios={anuncios} />

      {/* ------------------------------- contenido ------------------------------- */}
      {content.loading ? (
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-32">
          <div className="text-center">
            <div className="mx-auto flex items-end justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-1.5 rounded-sm bg-amber"
                  style={{ height: `${14 + (i % 3) * 8}px`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <p className="kicker mt-4 text-fog">Sintonizando el lobby…</p>
          </div>
        </main>
      ) : view === "admin" && isAdmin ? (
        <Admin
          api={content}
          userEmail={userEmail ?? ""}
          onSignOut={signOut}
          onViewLobby={() => setView("lobby")}
          toast={toast}
        />
      ) : (
        <Lobby items={content.items} rt={content.rt} onCopy={copyCode} />
      )}

      {/* ------------------------------- footer ------------------------------- */}
      <footer className="relative mt-auto overflow-hidden border-t border-line bg-ink-2/60">
        <p className="title-ghost pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[120px] leading-none sm:text-[180px]">
          VE·LOBBY
        </p>
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <VeMark size={30} />
              <p className="font-display text-base font-extrabold text-paper">VE·LOBBY</p>
            </div>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-fog">
              Un canal de contenidos siempre al aire: tutoriales de YouTube, TikTok e Instagram en
              reproducción automática, con banners, apps, códigos y notas sincronizados en tiempo
              real vía Supabase.
            </p>
          </div>
          <div>
            <p className="kicker text-amber">Señal</p>
            <ul className="mt-3 space-y-2 text-[13px] text-fog">
              <li>
                <button onClick={() => setView("lobby")} className="transition hover:text-amber">
                  Lobby en vivo
                </button>
              </li>
              <li>
                <button onClick={() => setLoginOpen(true)} className="transition hover:text-amber">
                  Acceso de administrador
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/mayfrend-app/ve"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-amber"
                >
                  Repositorio en GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="kicker text-teal">Estado</p>
            <ul className="mt-3 space-y-2 font-mono text-[12px] text-fog">
              <li>
                Realtime:{" "}
                <span className={content.rt === "live" ? "text-teal" : "text-amber"}>
                  {content.rt === "live" ? "conectado" : content.rt === "connecting" ? "conectando…" : "modo demo"}
                </span>
              </li>
              <li>
                Fuente:{" "}
                <span className="text-paper">{content.isDemo ? "demostración" : "Supabase"}</span>
              </li>
              {content.lastSync && (
                <li>
                  Último sync:{" "}
                  <span className="text-paper">{content.lastSync.toLocaleTimeString("es-ES")}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="relative border-t border-line/60 py-4">
          <p className="mx-auto max-w-6xl px-4 font-mono text-[11px] tracking-wider text-fog/70 sm:px-6">
            © {new Date().getFullYear()} VE·LOBBY — alojado en mayfrend-app.github.io/ve · hecho
            para emitirse en tiempo real
          </p>
        </div>
      </footer>

      {/* ------------------------------- overlays ------------------------------- */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        hasConfig={hasSupabaseConfig}
        userEmail={userEmail}
        adminState={adminState}
        onGoogle={signInWithGoogle}
        onSignOut={signOut}
        onGoPanel={() => setView("admin")}
      />
      <Toasts list={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}

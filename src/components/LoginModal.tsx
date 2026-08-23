import { useEffect } from "react";
import { LogOut, ShieldCheck, X, Loader2 } from "lucide-react";
import { GoogleIcon, VeMark } from "./Icons";

export type AdminState = "unknown" | "checking" | "yes" | "no" | "setup";

interface Props {
  open: boolean;
  onClose: () => void;
  hasConfig: boolean;
  userEmail: string | null;
  adminState: AdminState;
  onGoogle: () => void;
  onSignOut: () => void;
  onGoPanel: () => void;
}

export default function LoginModal({
  open,
  onClose,
  hasConfig,
  userEmail,
  adminState,
  onGoogle,
  onSignOut,
  onGoPanel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Acceso de administrador"
    >
      <div
        className="fade-up w-full max-w-md overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_40px_120px_-30px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drift-grad relative flex items-center justify-between border-b border-line bg-gradient-to-r from-amber/15 via-coral/10 to-teal/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <VeMark size={34} />
            <div>
              <p className="font-display text-base font-bold leading-tight text-paper">
                Acceso de administrador
              </p>
              <p className="kicker mt-0.5 text-fog">Solo personal autorizado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="btn-press rounded-md p-1.5 text-fog transition hover:bg-panel-2 hover:text-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {!hasConfig ? (
            <div className="rounded-lg border border-coral/50 bg-coral/10 p-4 text-sm text-paper">
              <p className="font-semibold text-coral">Faltan credenciales de Supabase</p>
              <p className="mt-1 text-fog">
                Crea un archivo <code className="font-mono text-amber">.env</code> con{" "}
                <code className="font-mono text-amber">VITE_SUPABASE_URL</code> y{" "}
                <code className="font-mono text-amber">VITE_SUPABASE_ANON_KEY</code> (tienes una
                plantilla en <code className="font-mono">.env.example</code>).
              </p>
            </div>
          ) : !userEmail ? (
            <>
              <p className="text-sm leading-relaxed text-fog">
                Inicia sesión con tu cuenta de Google para gestionar videos, banners, anuncios,
                aplicaciones, códigos y notas. Los cambios se publican{" "}
                <span className="font-semibold text-paper">en tiempo real</span> en todos los
                dispositivos.
              </p>
              <button
                onClick={onGoogle}
                className="btn-press mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-sm font-bold text-ink transition hover:brightness-95"
              >
                <GoogleIcon size={19} />
                Continuar con Google
              </button>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-ink-2 p-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal" />
                <p className="text-xs leading-relaxed text-fog">
                  Por seguridad, solo las cuentas registradas como administradoras pueden entrar.
                  Si la tabla de administradores está vacía,{" "}
                  <span className="font-semibold text-paper">
                    el primer inicio de sesión se registra automáticamente
                  </span>
                  .
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-ink-2 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber font-display text-base font-extrabold text-ink">
                  {(userEmail[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-paper">{userEmail}</p>
                  <p className="kicker mt-0.5 text-fog">
                    {adminState === "yes"
                      ? "Administrador verificado"
                      : adminState === "no"
                        ? "Cuenta sin permisos"
                        : adminState === "setup"
                          ? "Configuración pendiente"
                          : "Verificando…"}
                  </p>
                </div>
              </div>

              {adminState === "checking" || adminState === "unknown" ? (
                <p className="flex items-center gap-2 text-sm text-fog">
                  <Loader2 size={15} className="animate-spin text-amber" /> Comprobando permisos…
                </p>
              ) : adminState === "yes" ? (
                <button
                  onClick={() => {
                    onGoPanel();
                    onClose();
                  }}
                  className="btn-press w-full rounded-lg bg-amber px-4 py-3 text-sm font-bold text-ink transition hover:brightness-110"
                >
                  Entrar al panel de administración
                </button>
              ) : adminState === "no" ? (
                <p className="rounded-lg border border-coral/50 bg-coral/10 p-3 text-xs leading-relaxed text-fog">
                  Esta cuenta de Google no está en la lista de administradores. Pide a un
                  administrador que agregue tu correo en la tabla{" "}
                  <code className="font-mono text-coral">admins</code>.
                </p>
              ) : (
                <p className="rounded-lg border border-amber/50 bg-amber/10 p-3 text-xs leading-relaxed text-fog">
                  No se encontró la tabla <code className="font-mono text-amber">admins</code>.
                  Ejecuta <code className="font-mono text-amber">supabase/schema.sql</code> en el
                  SQL Editor de Supabase e intenta de nuevo (consulta el README).
                </p>
              )}

              <button
                onClick={onSignOut}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fog transition hover:border-coral/60 hover:text-coral"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

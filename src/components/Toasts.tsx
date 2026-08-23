import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastItem {
  id: number;
  kind: "ok" | "err" | "info";
  msg: string;
}

const STYLES: Record<ToastItem["kind"], { border: string; icon: JSX.Element }> = {
  ok: {
    border: "border-teal/60",
    icon: <CheckCircle2 size={17} className="text-teal" />,
  },
  err: {
    border: "border-coral/60",
    icon: <AlertTriangle size={17} className="text-coral" />,
  },
  info: {
    border: "border-amber/60",
    icon: <Info size={17} className="text-amber" />,
  },
};

export default function Toasts({
  list,
  onClose,
}: {
  list: ToastItem[];
  onClose: (id: number) => void;
}) {
  if (list.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[70] flex w-[min(92vw,380px)] flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`toast-in flex items-start gap-2.5 rounded-lg border bg-panel px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] ${STYLES[t.kind].border}`}
        >
          <span className="mt-0.5 shrink-0">{STYLES[t.kind].icon}</span>
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-paper">{t.msg}</p>
          <button
            onClick={() => onClose(t.id)}
            aria-label="Cerrar aviso"
            className="btn-press shrink-0 text-fog transition hover:text-paper"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

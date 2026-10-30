import { useEffect, useState } from "react";
import { BellRing, BellPlus, Send } from "lucide-react";
import { diaMais } from "@/lib/api";

const notificar = async (lista) => {
  const chave = `lembrete-${diaMais(1)}`;
  if (!lista.length || localStorage.getItem(chave) || !("Notification" in window) || Notification.permission !== "granted") return;
  const corpo = lista.map((a) => `${a.hora || "--:--"} ${a.nomeCli || a.servico}`).join("\n");
  const titulo = `Amanhã: ${lista.length} visita(s) agendada(s)`;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) await reg.showNotification(titulo, { body: corpo, icon: "/icon-192.png", tag: chave });
    else new Notification(titulo, { body: corpo });
    localStorage.setItem(chave, "1");
  } catch { /* notificação indisponível */ }
};

export function LembreteAmanha({ agenda, onFlyer }) {
  const amanha = diaMais(1);
  const lista = agenda.filter((a) => a.data === amanha && a.status === "agendado").sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");

  useEffect(() => { notificar(lista); }, [lista.length, perm]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lista.length) return null;
  const ativar = async () => setPerm(await Notification.requestPermission());

  return (
    <div className="glass rounded-2xl p-4 border-sky-400/40 neon-ring" data-testid="lembrete-amanha">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-outfit font-bold flex items-center gap-2 text-sky-300"><BellRing size={18} /> Amanhã: {lista.length} visita(s)</h3>
        {perm === "default" && <button onClick={ativar} data-testid="lembrete-ativar-notif" className="text-[11px] font-semibold text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-400/10"><BellPlus size={13} /> Ativar avisos</button>}
      </div>
      <div className="space-y-2">
        {lista.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3" data-testid={`lembrete-item-${a.id}`}>
            <div className="font-mono text-sky-300 text-sm">{a.hora || "--:--"}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{a.nomeCli || "Cliente"}</p>
              <p className="text-xs text-zinc-500 truncate">{a.servico}</p>
            </div>
            <button onClick={() => onFlyer(a)} data-testid={`lembrete-enviar-${a.id}`} className="fire-btn text-white text-xs font-semibold rounded-xl px-3 py-2 flex items-center gap-1"><Send size={13} /> Lembrete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

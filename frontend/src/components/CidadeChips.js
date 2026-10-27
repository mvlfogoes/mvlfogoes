import { CIDADES } from "@/lib/api";

export const CidadeChips = ({ value, onChange, clientes, prefix }) => {
  const count = (c) => clientes.filter((x) => x.etiqueta === c).length;
  const opts = [["", "Todas", clientes.length], ...CIDADES.map((c) => [c, c, count(c)])];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid={`${prefix}-cidade-chips`}>
      {opts.map(([k, l, n]) => (
        <button key={l} onClick={() => onChange(k)} data-testid={`${prefix}-cidade-${k ? k.toLowerCase().replace(/\s+/g, "-") : "todas"}`}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${value === k ? "fire-btn text-white" : "bg-white/5 text-zinc-400"}`}>
          {l} <span className="opacity-70">{n}</span>
        </button>
      ))}
    </div>
  );
};

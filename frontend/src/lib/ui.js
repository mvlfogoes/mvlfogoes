import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Modal = ({ open, onClose, title, children, testId }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} data-testid={testId}
      >
        <motion.div
          className="glass w-full md:max-w-lg rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto"
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-sky-400/15 bg-[#0B1424]/90 backdrop-blur-xl">
            <h3 className="font-outfit font-bold text-lg">{title}</h3>
            <button onClick={onClose} data-testid="modal-close-btn" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-4">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{label}</span>
    {children}
  </label>
);

export const inputCls =
  "w-full rounded-xl bg-[#050A14]/80 border border-sky-400/20 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20 transition placeholder:text-zinc-600";

export const Btn = ({ children, variant = "fire", className = "", ...p }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-4 py-2.5 transition active:scale-95 disabled:opacity-50";
  const styles = {
    fire: "fire-btn text-white hover:brightness-110",
    ghost: "bg-white/5 text-zinc-200 hover:bg-white/10 border border-white/10",
    danger: "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25",
    outline: "border border-sky-400/40 text-sky-300 hover:bg-sky-400/10",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...p}>
      {children}
    </button>
  );
};

export const Badge = ({ children, tone = "orange" }) => {
  const tones = {
    orange: "flame-badge",
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    red: "bg-red-500/15 text-red-400 border border-red-500/30",
    blue: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    zinc: "bg-white/5 text-zinc-400 border border-white/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const Empty = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 text-zinc-500">
    <div className="flame-badge p-4 rounded-2xl mb-4">{Icon && <Icon size={30} />}</div>
    <p className="font-outfit font-semibold text-zinc-300">{title}</p>
    {sub && <p className="text-sm mt-1 max-w-xs">{sub}</p>}
  </div>
);

export const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-cond font-bold text-2xl uppercase tracking-wide text-zinc-100">{children}</h2>
    {right}
  </div>
);

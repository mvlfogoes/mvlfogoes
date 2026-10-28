import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const centro = (p) => ({ x: p.reduce((s, q) => s + q.x, 0) / p.length, y: p.reduce((s, q) => s + q.y, 0) / p.length });

export function ZoomViewer({ src, onClose, children, testid = "zoom-viewer" }) {
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const tRef = useRef(t);
  const pts = useRef(new Map());
  const ini = useRef(null);
  tRef.current = t;

  useEffect(() => { setT({ s: 1, x: 0, y: 0 }); }, [src]);

  const snap = () => {
    const p = [...pts.current.values()];
    ini.current = p.length ? { t: tRef.current, d: p.length > 1 ? dist(p[0], p[1]) : 0, c: centro(p) } : null;
  };
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); snap(); };
  const up = (e) => { pts.current.delete(e.pointerId); snap(); };
  const move = (e) => {
    if (!pts.current.has(e.pointerId) || !ini.current) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.current.values()], st = ini.current;
    const s = p.length > 1 && st.d ? Math.min(5, Math.max(1, st.t.s * (dist(p[0], p[1]) / st.d))) : st.t.s;
    const c = centro(p);
    setT(s === 1 ? { s: 1, x: 0, y: 0 } : { s, x: st.t.x + c.x - st.c.x, y: st.t.y + c.y - st.c.y });
  };
  const wheel = (e) => setT((o) => { const s = Math.min(5, Math.max(1, o.s * (e.deltaY < 0 ? 1.15 : 0.87))); return s === 1 ? { s: 1, x: 0, y: 0 } : { ...o, s }; });

  return createPortal(
    <div className="fixed inset-0 z-[150] bg-black flex flex-col" data-testid={testid}>
      <div className="absolute top-0 inset-x-0 z-10 flex justify-end p-3 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onClose} data-testid={`${testid}-close`} className="p-2 rounded-full bg-white/10 text-white"><X size={22} /></button>
      </div>
      <div className="flex-1 overflow-hidden flex items-center justify-center select-none" style={{ touchAction: "none" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}
        onDoubleClick={() => setT((o) => (o.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }))}>
        <img src={src} alt="" draggable={false} data-testid={`${testid}-img`}
          className="max-w-full max-h-full object-contain"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transition: pts.current.size ? "none" : "transform 0.15s ease-out" }} />
      </div>
      {children && <div className="p-3 flex gap-2 bg-black/80 border-t border-white/10">{children}</div>}
    </div>,
    document.body
  );
}

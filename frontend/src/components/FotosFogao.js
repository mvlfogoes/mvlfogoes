import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { api, fotoUrl } from "@/lib/api";
import { comprimir } from "@/lib/media";
import { ZoomViewer } from "@/components/ZoomViewer";

export function FotosFogao({ cliId, pending = [], setPending, size = 56, testid = "fotos-fogao" }) {
  const [fotos, setFotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ver, setVer] = useState(null);

  useEffect(() => { if (cliId) api.listFotos(cliId).then(setFotos); }, [cliId]);

  const add = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const blobs = await Promise.all(files.map((f) => comprimir(f)));
      if (!cliId) setPending([...pending, ...blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) }))]);
      else {
        for (const b of blobs) { const f = await api.uploadFoto(cliId, b); setFotos((x) => [...x, f]); }
        toast.success(files.length > 1 ? "Fotos adicionadas" : "Foto adicionada");
      }
    } catch { toast.error("Não foi possível enviar a foto"); }
    setBusy(false);
  };

  const remove = async (it) => {
    if (!window.confirm("Excluir esta foto?")) return;
    if (it.foto) { await api.deleteFoto(it.foto.id); setFotos((x) => x.filter((f) => f.id !== it.foto.id)); }
    else setPending(pending.filter((p) => p !== it.pend));
    setVer(null);
    toast.success("Foto excluída");
  };

  const items = [...fotos.map((f) => ({ key: f.id, url: fotoUrl(f.id), foto: f })), ...pending.map((p, i) => ({ key: `p${i}`, url: p.url, pend: p }))];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" data-testid={testid}>
      {items.map((it, i) => (
        <button key={it.key} type="button" onClick={() => setVer(it)} data-testid={`${testid}-thumb-${i}`}
          className="shrink-0 rounded-xl overflow-hidden border border-orange-500/30 bg-black/40" style={{ width: size, height: size }}>
          <img src={it.url} alt="Fogão" loading="lazy" className="w-full h-full object-cover" />
        </button>
      ))}
      <label data-testid={`${testid}-add`} className="shrink-0 rounded-xl border border-dashed border-orange-500/50 text-orange-400 flex flex-col items-center justify-center cursor-pointer text-[10px] font-semibold gap-0.5" style={{ width: size, height: size }}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        {busy ? "" : "Foto"}
        <input type="file" accept="image/*" multiple hidden onChange={add} disabled={busy} data-testid={`${testid}-input`} />
      </label>
      {ver && (
        <ZoomViewer src={ver.url} onClose={() => setVer(null)} testid="foto-viewer">
          <button onClick={() => remove(ver)} data-testid="foto-viewer-delete" className="flex-1 rounded-xl py-3 text-red-400 border border-red-500/40 font-semibold flex items-center justify-center gap-2"><Trash2 size={17} /> Excluir foto</button>
        </ZoomViewer>
      )}
    </div>
  );
}

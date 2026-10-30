import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Trash2, Loader2, Film } from "lucide-react";
import { api, fotoUrl } from "@/lib/api";
import { comprimir } from "@/lib/media";
import { ZoomViewer } from "@/components/ZoomViewer";

const isVideo = (t) => (t || "").startsWith("video");

const AddBtn = ({ icon: Icon, label, accept, capture, multiple, onChange, busy, testid, size }) => (
  <label data-testid={testid} className="shrink-0 rounded-xl border border-dashed border-sky-400/50 text-sky-300 flex flex-col items-center justify-center cursor-pointer text-[10px] font-semibold gap-0.5" style={{ width: size, height: size }}>
    {busy ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
    {busy ? "" : label}
    <input type="file" accept={accept} capture={capture} multiple={multiple} hidden onChange={onChange} disabled={busy} data-testid={`${testid}-input`} />
  </label>
);

export function FotosFogao({ cliId, pending = [], setPending, size = 56, videos = false, testid = "fotos-fogao" }) {
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
      const blobs = await Promise.all(files.map((f) => (isVideo(f.type) ? f : comprimir(f))));
      if (!cliId) setPending([...pending, ...blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) }))]);
      else {
        for (const b of blobs) { const f = await api.uploadFoto(cliId, b); setFotos((x) => [...x, f]); }
        toast.success(files.length > 1 ? "Arquivos adicionados" : "Adicionado");
      }
    } catch (err) { toast.error(err?.response?.data?.detail || "Não foi possível enviar"); }
    setBusy(false);
  };

  const remove = async (it) => {
    if (!window.confirm("Excluir este arquivo?")) return;
    if (it.foto) { await api.deleteFoto(it.foto.id); setFotos((x) => x.filter((f) => f.id !== it.foto.id)); }
    else setPending(pending.filter((p) => p !== it.pend));
    setVer(null);
    toast.success("Excluído");
  };

  const items = [
    ...fotos.map((f) => ({ key: f.id, url: fotoUrl(f.id), foto: f, video: isVideo(f.content_type) })),
    ...pending.map((p, i) => ({ key: `p${i}`, url: p.url, pend: p, video: isVideo(p.blob.type) })),
  ];
  const accept = videos ? "image/*,video/*" : "image/*";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" data-testid={testid}>
      {items.map((it, i) => (
        <button key={it.key} type="button" onClick={() => setVer(it)} data-testid={`${testid}-thumb-${i}`}
          className="relative shrink-0 rounded-xl overflow-hidden border border-sky-400/30 bg-black/40" style={{ width: size, height: size }}>
          {it.video ? <video src={it.url} muted preload="metadata" className="w-full h-full object-cover" /> : <img src={it.url} alt="Fogão" loading="lazy" className="w-full h-full object-cover" />}
          {it.video && <Film size={14} className="absolute top-1 right-1 text-white drop-shadow" />}
        </button>
      ))}
      <AddBtn icon={Camera} label="Câmera" accept={videos ? "image/*,video/*" : "image/*"} capture="environment" onChange={add} busy={busy} testid={`${testid}-camera`} size={size} />
      <AddBtn icon={ImagePlus} label="Galeria" accept={accept} multiple onChange={add} busy={busy} testid={`${testid}-add`} size={size} />
      {ver && (
        <ZoomViewer src={ver.url} video={ver.video} onClose={() => setVer(null)} testid="foto-viewer">
          <button onClick={() => remove(ver)} data-testid="foto-viewer-delete" className="flex-1 rounded-xl py-3 text-red-400 border border-red-500/40 font-semibold flex items-center justify-center gap-2"><Trash2 size={17} /> Excluir</button>
        </ZoomViewer>
      )}
    </div>
  );
}

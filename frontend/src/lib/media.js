import { toast } from "sonner";
import { waLink } from "@/lib/api";

export const comprimir = (file, max = 1600) => new Promise((res) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => res(b || file), "image/jpeg", 0.85);
  };
  img.onerror = () => { URL.revokeObjectURL(url); res(file); };
  img.src = url;
});

export const baixarBlob = (blob, nome) => {
  const link = document.createElement("a");
  link.download = nome;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
};

export const compartilhar = async (blob, nome, tel) => {
  const file = new File([blob], nome, { type: blob.type || "image/png" });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] });
  baixarBlob(blob, nome);
  toast.success("Imagem salva! Anexe-a na conversa do WhatsApp.");
  window.open(waLink(tel, ""), "_blank");
};

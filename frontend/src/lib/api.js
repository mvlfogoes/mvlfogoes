import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const http = axios.create({ baseURL: API });

export const api = {
  stats: () => http.get("/stats").then((r) => r.data),
  // clientes
  listClientes: () => http.get("/clientes").then((r) => r.data),
  createCliente: (d) => http.post("/clientes", d).then((r) => r.data),
  updateCliente: (id, d) => http.put(`/clientes/${id}`, d).then((r) => r.data),
  deleteCliente: (id) => http.delete(`/clientes/${id}`).then((r) => r.data),
  // ordens
  listOrdens: () => http.get("/ordens").then((r) => r.data),
  createOrdem: (d) => http.post("/ordens", d).then((r) => r.data),
  updateOrdem: (id, d) => http.put(`/ordens/${id}`, d).then((r) => r.data),
  deleteOrdem: (id) => http.delete(`/ordens/${id}`).then((r) => r.data),
  // agendamentos
  listAgenda: () => http.get("/agendamentos").then((r) => r.data),
  createAgenda: (d) => http.post("/agendamentos", d).then((r) => r.data),
  updateAgenda: (id, d) => http.put(`/agendamentos/${id}`, d).then((r) => r.data),
  deleteAgenda: (id) => http.delete(`/agendamentos/${id}`).then((r) => r.data),
  // midias
  listMidias: (cliId) => http.get("/midias", { params: cliId ? { cliId } : {} }).then((r) => r.data),
  createMidia: (d) => http.post("/midias", d).then((r) => r.data),
  deleteMidia: (id) => http.delete(`/midias/${id}`).then((r) => r.data),
  // config
  getConfig: () => http.get("/config").then((r) => r.data),
  updateConfig: (d) => http.put("/config", d).then((r) => r.data),
  // fotos do fogão
  listFotos: (cid) => http.get(`/clientes/${cid}/fotos`).then((r) => r.data),
  uploadFoto: (cid, blob) => {
    const fd = new FormData();
    fd.append("file", blob, `foto.${(blob.type || "image/jpeg").split("/")[1]}`);
    return http.post(`/clientes/${cid}/fotos`, fd).then((r) => r.data);
  },
  deleteFoto: (id) => http.delete(`/fotos/${id}`).then((r) => r.data),
  // documentos guardados
  listDocs: (cliId) => http.get("/documentos", { params: cliId ? { cliId } : {} }).then((r) => r.data),
  saveDoc: ({ blob, tipo, cliId, nomeCli, resumo, dados }) => {
    const fd = new FormData();
    fd.append("file", blob, `${tipo}.png`);
    Object.entries({ tipo, cliId: cliId || "", nomeCli: nomeCli || "", resumo: resumo || "", dados: JSON.stringify(dados || {}) }).forEach(([k, v]) => fd.append(k, v));
    return http.post("/documentos", fd).then((r) => r.data);
  },
  deleteDoc: (id) => http.delete(`/documentos/${id}`).then((r) => r.data),
  // devedores
  listDevedores: () => http.get("/devedores").then((r) => r.data),
  createDevedor: (d) => http.post("/devedores", d).then((r) => r.data),
  updateDevedor: (id, d) => http.put(`/devedores/${id}`, d).then((r) => r.data),
  deleteDevedor: (id) => http.delete(`/devedores/${id}`).then((r) => r.data),
  // relatorio / backup
  relatorio: (mes) => http.get("/relatorio", { params: { mes } }).then((r) => r.data),
  backup: () => http.get("/backup").then((r) => r.data),
  restore: (d) => http.post("/restore", d).then((r) => r.data),
};

export const fotoUrl = (id) => `${API}/fotos/${id}/img`;
export const docUrl = (id) => `${API}/documentos/${id}/img`;

export const fmtBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!day) return d;
  return `${day}/${m}/${y}`;
};

export const CIDADES = ["Bicas", "Mar de Espanha", "Pequeri", "Maripá de Minas", "Guarará", "Rochedo de Minas"];

export const hoje = () => new Date().toLocaleDateString("sv-SE");
export const diaMais = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };

export const waLink = (tel, msg) => {
  const num = (tel || "").replace(/\D/g, "");
  const full = num.startsWith("55") ? num : `55${num}`;
  return `https://api.whatsapp.com/send?phone=${full}&text=${encodeURIComponent(msg || "")}`;
};

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
  // relatorio / backup
  relatorio: (mes) => http.get("/relatorio", { params: { mes } }).then((r) => r.data),
  backup: () => http.get("/backup").then((r) => r.data),
  restore: (d) => http.post("/restore", d).then((r) => r.data),
};

export const fmtBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!day) return d;
  return `${day}/${m}/${y}`;
};

export const hoje = () => new Date().toISOString().slice(0, 10);

export const waLink = (tel, msg) => {
  const num = (tel || "").replace(/\D/g, "");
  const full = num.startsWith("55") ? num : `55${num}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg || "")}`;
};

import { api, CIDADES } from "@/lib/api";

const norm = (s) => (s || "").trim().toLowerCase();

// Cria ou atualiza o cliente com os dados digitados; retorna o cliente salvo
export async function salvarCliente(dados, clientes) {
  const nome = (dados.nome || "").trim();
  if (!nome) return null;
  const cidade = (dados.cidade || "").replace(/\s*-\s*MG$/i, "").trim();
  const novo = {
    nome, tel: dados.tel || "", wa: dados.wa || dados.tel || "", end: dados.end || "",
    ...(CIDADES.includes(cidade) ? { etiqueta: cidade } : {}),
  };
  const atual = clientes.find((c) => c.id === dados.cliId) || clientes.find((c) => norm(c.nome) === norm(nome));
  if (!atual) return api.createCliente({ fogao: "", obs: "", etiqueta: "", ...novo });
  const merged = { ...atual };
  Object.entries(novo).forEach(([k, v]) => { if (v) merged[k] = v; });
  const mudou = Object.keys(novo).some((k) => (merged[k] || "") !== (atual[k] || ""));
  return mudou ? api.updateCliente(atual.id, merged) : atual;
}

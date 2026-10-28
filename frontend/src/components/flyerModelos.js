import { Plus, X } from "lucide-react";
import { fmtBRL, fmtData, CIDADES } from "@/lib/api";
import { TIPOS, lbl, val, num, extenso, Cell, Field, Texto, Servicos } from "@/components/flyerParts";

const OBS_PADRAO = "Em caso de necessidade de alteração, entre em contato com antecedência.";
const tipoDe = (s) => s.tipo || TIPOS.find((t) => (s.servico || "").toLowerCase().includes(t.key))?.key || "fogao";
const cidadeDe = (cli, cfg) => (CIDADES.includes(cli?.etiqueta) ? `${cli.etiqueta} - MG` : cfg.cidade) || "";
const base = (s, cli, cfg) => ({ nome: s.nomeCli || cli?.nome || "", tel: cli?.tel || "", end: cli?.end || "", cidade: cidadeDe(cli, cfg) });
const row = { display: "flex", gap: 14 };
const destaque = { ...row, background: "#fff4ea", borderRadius: 10, padding: "6px 10px" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const hojeBR = () => new Date().toLocaleDateString("pt-BR");
const dataExtenso = (d = new Date()) => ({ dia: String(d.getDate()).padStart(2, "0"), mes: MESES[d.getMonth()], ano: String(d.getFullYear()).slice(2) });

const ClienteRows = (p) => (
  <>
    <div style={row}><Field label="Cliente" k="nome" flex={1.4} testid="flyer-input-nome" {...p} /><Field label="Telefone" k="tel" testid="flyer-input-tel" {...p} /></div>
    <div style={row}><Field label="Endereço" k="end" flex={1.25} testid="flyer-input-end" {...p} /><Field label="Cidade" k="cidade" testid="flyer-input-cidade" {...p} /></div>
  </>
);

const valoresTexto = (t) => [...String(t || "").matchAll(/R\$\s*([\d.,]+)/gi)].reduce((s, m) => s + num(m[1]), 0);
const itemCell = { fontSize: 13, lineHeight: "22px", padding: "0 0 2px", minHeight: 0 };
const MAX_ITENS = 5;
const totalOrc = (f) => f.itens.reduce((s, it) => s + num(it.valor), 0) + valoresTexto(f.outros);

const Itens = ({ f, set, cap }) => {
  const upd = (i, k, v) => set({ ...f, itens: f.itens.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });
  const itens = cap ? f.itens.filter((it) => it.desc || it.valor) : f.itens;
  return (
    <div>
      <div style={{ ...lbl, display: "flex", justifyContent: "space-between" }}><span>Serviços e peças</span><span style={{ width: 92, textAlign: "right" }}>Valor</span></div>
      {itens.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6A00", width: 12 }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}><Cell cap={cap} value={it.desc} onChange={(v) => upd(i, "desc", v)} testid={`flyer-item-desc-${i}`} placeholder="Serviço ou peça" style={itemCell} /></div>
          <div style={{ width: 84 }}><Cell cap={cap} value={cap && it.valor ? fmtBRL(num(it.valor)) : it.valor} onChange={(v) => upd(i, "valor", v)} testid={`flyer-item-valor-${i}`} placeholder="R$ 0,00" style={{ ...itemCell, textAlign: "right" }} /></div>
          {!cap && <button type="button" data-testid={`flyer-item-remove-${i}`} onClick={() => set({ ...f, itens: f.itens.filter((_, j) => j !== i) })} style={{ border: "none", background: "transparent", color: "#b9b2a8", padding: 0, cursor: "pointer" }}><X size={14} /></button>}
        </div>
      ))}
      {!cap && f.itens.length < MAX_ITENS && (
        <button type="button" data-testid="flyer-item-add" onClick={() => set({ ...f, itens: [...f.itens, { desc: "", valor: "" }] })} style={{ marginTop: 6, border: "1px dashed #FF6A00", background: "#fff8f1", color: "#FF6A00", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><Plus size={13} /> Adicionar item</button>
      )}
    </div>
  );
};

const Total = ({ valor, label = "Total" }) => (
  <div data-testid="flyer-total" style={{ background: "#1c1a18", color: "#fff", borderRadius: 10, padding: "0 12px", height: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", lineHeight: "16px", display: "block" }}>{label}</span>
    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, lineHeight: "28px", display: "block", color: "#FF8A3C" }}>{fmtBRL(valor)}</span>
  </div>
);

const Assinatura = ({ cfg }) => (
  <div style={{ textAlign: "center", marginTop: 14 }}>
    <div style={{ width: 230, margin: "0 auto", borderTop: "1px solid #1a1a1a", paddingTop: 3, fontSize: 11, fontWeight: 700 }}>Assinatura do técnico</div>
    <div style={{ fontSize: 10, color: "#666" }}>{cfg.tecnico || "MVL Fogões"}</div>
  </div>
);

const DataLocal = ({ f, set, cap }) => {
  const c = (k, w, ph) => <div style={{ width: w }}><Cell cap={cap} value={f[k]} onChange={(v) => set({ ...f, [k]: v })} testid={`flyer-input-${k}`} placeholder={ph} style={{ textAlign: "center", fontSize: 13 }} /></div>;
  const t = (s) => <span style={{ display: "block", lineHeight: "20px", paddingBottom: 5 }}>{s}</span>;
  return (
    <div data-testid="flyer-recibo-data" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
      {t("Bicas, MG")}{c("dia", 38, "dia")}{t("de")}{c("mes", 110, "mês")}{t("de 20")}{c("ano", 28, "")}{t(".")}
    </div>
  );
};

export const MODELOS = {
  agenda: {
    titulo: "AGENDAMENTO DE VISITA",
    modal: "Flyer de Agendamento",
    arquivo: "agendamento",
    campos: [["nome", "Cliente"], ["tel", "Telefone"], ["end", "Endereço"], ["cidade", "Cidade"], ["data", "Data"], ["hora", "Horário"], ["servico", "Serviço"], ["taxa", "Taxa"], ["obs", "Obs"]],
    init: (s, cli, cfg) => ({
      ...base(s, cli, cfg), data: s.data ? fmtData(s.data) : "", hora: s.hora || "", tipo: tipoDe(s),
      servico: s.servico || "", taxa: s.valor ? fmtBRL(s.valor) : "", obs: [OBS_PADRAO, s.obs].filter(Boolean).join("\n"),
    }),
    resumo: (f) => [f.data, f.hora].filter(Boolean).join(" às "),
    Body: (p) => (
      <>
        <ClienteRows {...p} />
        <div style={destaque}><Field label="Data da visita" k="data" testid="flyer-input-data" {...p} /><Field label="Horário" k="hora" testid="flyer-input-hora" {...p} /></div>
        <Servicos {...p} />
        <div style={row}><Field label="Detalhe do serviço" k="servico" flex={1.4} testid="flyer-input-servico" {...p} /><Field label="Taxa de visita" k="taxa" testid="flyer-input-taxa" {...p} /></div>
        <Texto label="Observações" k="obs" testid="flyer-input-obs" {...p} />
      </>
    ),
  },
  orcamento: {
    titulo: "ORÇAMENTO",
    compacto: true,
    imprimir: true,
    modal: "Flyer de Orçamento",
    arquivo: "orcamento",
    campos: [["nome", "Cliente"], ["tel", "Telefone"], ["end", "Endereço"], ["cidade", "Cidade"], ["outros", "Outros itens"], ["validade", "Validade"]],
    init: (s, cli, cfg) => ({
      ...base(s, cli, cfg),
      itens: [s.servico ? { desc: s.servico, valor: s.valor ? fmtBRL(s.valor) : "" } : null, s.pecas ? { desc: s.pecas, valor: "" } : null].filter(Boolean).concat(s.servico || s.pecas ? [] : [{ desc: "", valor: "" }]),
      outros: "", validade: "7 dias", pagamento: "Pix, dinheiro ou cartão", data: hojeBR(),
    }),
    resumo: (f) => `Total ${fmtBRL(totalOrc(f))}`,
    Body: (p) => (
      <>
        <ClienteRows {...p} />
        <Itens {...p} />
        <Texto label="Outros itens e valores (texto livre)" k="outros" testid="flyer-input-outros" placeholder={"Ex.: Mangueira de gás R$ 35,00\nUse R$ para somar no total"} maxLines={3} {...p} />
        <Total valor={totalOrc(p.f)} />
        <div style={{ ...row, gap: 10 }}><Field label="Data" k="data" flex={0.85} testid="flyer-input-data" {...p} /><Field label="Validade" k="validade" flex={0.65} testid="flyer-input-validade" {...p} /><Field label="Pagamento" k="pagamento" flex={1.3} testid="flyer-input-pagamento" {...p} /></div>
      </>
    ),
  },
  recibo: {
    titulo: "RECIBO",
    compacto: true,
    imprimir: true,
    modal: "Flyer de Recibo",
    arquivo: "recibo",
    campos: [["nome", "Cliente"], ["tel", "Telefone"], ["end", "Endereço"], ["cidade", "Cidade"], ["valor", "Valor"], ["servico", "Referente a"], ["garantia", "Garantia"], ["obs", "Obs"]],
    init: (s, cli, cfg) => ({
      ...base(s, cli, cfg), valor: s.valor ? fmtBRL(s.valor) : "", extenso: extenso(s.valor || 0),
      servico: s.servico || "", garantia: "", obs: s.pecas ? `Peças: ${s.pecas}` : "", ...dataExtenso(),
    }),
    fix: (n, old) => (n.valor !== old.valor ? { ...n, extenso: extenso(num(n.valor)) } : n),
    resumo: (f) => (f.valor ? fmtBRL(num(f.valor)) : "Recibo"),
    Body: (p) => (
      <>
        <ClienteRows {...p} />
        <div style={destaque}><Field label="Valor recebido" k="valor" flex={1.3} testid="flyer-input-valor" style={{ fontSize: 17, fontWeight: 800, lineHeight: "24px" }} {...p} f={p.cap && p.f.valor ? { ...p.f, valor: fmtBRL(num(p.f.valor)) } : p.f} /><Field label="Garantia (dias)" k="garantia" testid="flyer-input-garantia" placeholder="ex.: 90" {...p} f={p.cap && p.f.garantia ? { ...p.f, garantia: `${p.f.garantia} dias` } : p.f} /></div>
        <div><div style={lbl}>Valor por extenso</div><div style={{ ...val, fontSize: 12, fontStyle: "italic", borderBottom: "1px solid #d6d0c7", minHeight: 22 }} data-testid="flyer-extenso">{p.f.extenso ? `(${p.f.extenso})` : "\u00a0"}</div></div>
        <Field label="Referente a" k="servico" testid="flyer-input-servico" {...p} />
        <Texto label="Peças / observações" k="obs" testid="flyer-input-obs" maxLines={3} {...p} />
        <DataLocal {...p} />
        <Assinatura cfg={p.cfg} />
      </>
    ),
  },
};

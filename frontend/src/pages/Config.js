import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { User, Download, Upload, BarChart3, Save, Flame, TrendingUp } from "lucide-react";
import { api, fmtBRL } from "@/lib/api";
import { Field, inputCls, Btn, SectionTitle } from "@/lib/ui";
import { useApp } from "@/App";

export default function Config() {
  const { cfg, setCfg } = useApp();
  const [tecnico, setTecnico] = useState(cfg.tecnico || "");
  const [telefone, setTelefone] = useState(cfg.telefone || "");
  const [cidade, setCidade] = useState(cfg.cidade || "");
  const [slogan, setSlogan] = useState(cfg.slogan || "");
  const [stats, setStats] = useState(null);
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [rel, setRel] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    setTecnico(cfg.tecnico || ""); setTelefone(cfg.telefone || "");
    setCidade(cfg.cidade || ""); setSlogan(cfg.slogan || "");
  }, [cfg]);
  useEffect(() => { api.stats().then(setStats); }, []);
  useEffect(() => { api.relatorio(mes).then(setRel); }, [mes]);

  const saveTecnico = async () => {
    const r = await api.updateConfig({ tecnico, telefone, cidade, slogan });
    setCfg(r); toast.success("Dados salvos");
  };

  const exportar = async () => {
    const data = await api.backup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mvl-fogoes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); toast.success("Backup exportado");
  };

  const importar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!window.confirm("Restaurar irá substituir os dados atuais. Continuar?")) return;
    try {
      const data = JSON.parse(await file.text());
      await api.restore(data); toast.success("Dados restaurados");
      setTimeout(() => window.location.reload(), 800);
    } catch { toast.error("Arquivo inválido"); }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Configurações</SectionTitle>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-outfit font-bold flex items-center gap-2 mb-4"><User size={18} className="text-sky-300" /> Dados da Empresa</h3>
        <div className="space-y-3">
          <Field label="Nome do técnico"><input data-testid="config-tecnico-input" value={tecnico} onChange={(e) => setTecnico(e.target.value)} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone / WhatsApp"><input data-testid="config-telefone-input" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputCls} placeholder="(32) 98885-6030" /></Field>
            <Field label="Cidade"><input data-testid="config-cidade-input" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} placeholder="Bicas - MG" /></Field>
          </div>
          <Field label="Slogan"><input data-testid="config-slogan-input" value={slogan} onChange={(e) => setSlogan(e.target.value)} className={inputCls} placeholder="A qualidade que dá confiança!" /></Field>
        </div>
        <Btn onClick={saveTecnico} className="mt-3" data-testid="config-save-btn"><Save size={16} /> Salvar</Btn>
        <p className="text-xs text-zinc-500 mt-3">Esses dados aparecem no <span className="text-sky-300">flyer de agendamento</span> enviado no WhatsApp.</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-outfit font-bold flex items-center gap-2"><BarChart3 size={18} className="text-sky-300" /> Relatório Mensal</h3>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={`${inputCls} !w-auto !py-1.5`} data-testid="config-mes-input" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric icon={Flame} label="Visitas" value={rel?.visitas ?? 0} />
          <Metric icon={TrendingUp} label="Concluídas" value={rel?.concluidas ?? 0} />
          <Metric icon={User} label="Clientes" value={rel?.clientes_atendidos ?? 0} />
          <Metric icon={BarChart3} label="Recebido" value={fmtBRL(rel?.valor_recebido ?? 0)} small />
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-outfit font-bold mb-2">Estatísticas Gerais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Clientes" v={stats?.clientes} />
          <Stat label="OS Total" v={stats?.os_total} />
          <Stat label="Mídias" v={stats?.midias} />
          <Stat label="Agendamentos" v={stats?.ag_total} />
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-outfit font-bold mb-4">Backup de Dados</h3>
        <div className="flex flex-wrap gap-2">
          <Btn variant="fire" onClick={exportar} data-testid="config-export-btn"><Download size={16} /> Exportar JSON</Btn>
          <Btn variant="outline" onClick={() => fileRef.current.click()} data-testid="config-import-btn"><Upload size={16} /> Importar JSON</Btn>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importar} />
        </div>
        <p className="text-xs text-zinc-500 mt-3 font-mono">MVL Fogões · v{cfg.versao}</p>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value, small }) => (
  <div className="bg-white/5 rounded-xl p-3">
    <Icon size={16} className="text-sky-300 mb-1" />
    <p className={`font-outfit font-extrabold ${small ? "text-base" : "text-2xl"}`}>{value}</p>
    <p className="text-[10px] font-mono uppercase text-zinc-500">{label}</p>
  </div>
);
const Stat = ({ label, v }) => (
  <div className="bg-white/5 rounded-xl p-3 text-center"><p className="font-outfit font-extrabold text-2xl">{v ?? 0}</p><p className="text-[10px] font-mono uppercase text-zinc-500">{label}</p></div>
);

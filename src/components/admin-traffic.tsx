import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { listTraffic } from "@/lib/admin-data";
import { adminRefreshOptions } from "@/lib/admin-refresh";

const STEPS: { key: string; label: string; hint: string }[] = [
  { key: "visita", label: "Visitas", hint: "pessoas que abriram o site" },
  { key: "simulacao_iniciada", label: "Começaram a simulação", hint: "mexeram na calculadora" },
  { key: "passo1_concluido", label: "Concluíram o imóvel", hint: "preencheram o 1º passo" },
  { key: "lead_capturado", label: "Deixaram contato", hint: "viraram contatos no painel" },
];

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AdminTraffic() {
  const { data, error, isPending } = useQuery({ queryKey: ["admin-traffic"], queryFn: () => listTraffic(), retry: false, ...adminRefreshOptions });

  const view = useMemo(() => {
    const events = data ?? [];
    const count = (name: string) => events.filter((e) => e.name === name).length;
    const days: { key: string; label: string; visits: number; leads: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.push({ key: dayKey(d), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), visits: 0, leads: 0 });
    }
    for (const e of events) {
      const day = days.find((d) => d.key === dayKey(new Date(e.created_at)));
      if (!day) continue;
      if (e.name === "visita") day.visits++;
      if (e.name === "lead_capturado") day.leads++;
    }
    const visits = count("visita");
    const leads = count("lead_capturado");
    return {
      steps: STEPS.map((s) => ({ ...s, value: count(s.key) })),
      wa: count("clique_whatsapp"),
      visits,
      leads,
      rate: visits && leads <= visits ? Math.round((leads / visits) * 1000) / 10 : null,
      days,
      max: Math.max(1, ...days.map((d) => d.visits)),
    };
  }, [data]);

  if (isPending) return <p className="a-note">Carregando tráfego…</p>;
  if (error) return <p className="a-note">Não foi possível carregar o tráfego agora.</p>;

  const top = Math.max(1, ...view.steps.map((s) => s.value));

  return (
    <div className="a-traffic">
      <div className="a-stats">
        <div className="a-stat"><span>Visitas</span><strong>{view.visits}</strong><em>últimos 30 dias</em></div>
        <div className="a-stat"><span>Contatos</span><strong>{view.leads}</strong><em>deixados no site</em></div>
        <div className="a-stat"><span>Conversão</span><strong>{view.rate === null ? "—" : `${view.rate}%`}</strong><em>das visitas viram contato</em></div>
        <div className="a-stat"><span>Cliques no WhatsApp</span><strong>{view.wa}</strong><em>botões do site</em></div>
      </div>

      <section className="a-panel">
        <header><h2 className="serif">Visitas por dia</h2><p>Últimos 14 dias · em dourado os dias com contato</p></header>
        <div className="a-bars" role="img" aria-label="Gráfico de visitas por dia">
          {view.days.map((d) => (
            <div key={d.key} className="a-bar-col" title={`${d.label}: ${d.visits} visita(s), ${d.leads} contato(s)`}>
              <span className="a-bar-value">{d.visits || ""}</span>
              <div className={d.leads ? "a-bar lead" : "a-bar"} style={{ height: `${(d.visits / view.max) * 100}%` }} />
              <span className="a-bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="a-panel">
        <header><h2 className="serif">Caminho do visitante</h2><p>Quantas pessoas avançam em cada etapa da calculadora</p></header>
        <ol className="a-funnel">
          {view.steps.map((s) => (
            <li key={s.key}>
              <div className="a-funnel-text"><strong>{s.label}</strong><span>{s.hint}</span></div>
              <div className="a-funnel-track"><div style={{ width: `${(s.value / top) * 100}%` }} /></div>
              <b>{s.value}</b>
            </li>
          ))}
        </ol>
      </section>
      <p className="a-footnote">A contagem de visitas começou hoje; os números crescem a partir de agora.</p>
    </div>
  );
}

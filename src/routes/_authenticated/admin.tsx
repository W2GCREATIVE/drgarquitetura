import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { listLeads } from "@/lib/admin.functions";
import { useMemo, useState } from "react";
import { formatRange } from "@/lib/drg";
import "@/components/admin-panel.css";

function phoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

type Lead = Awaited<ReturnType<typeof listLeads>>[number];

type EstimateInput = {
  type?: string;
  standard?: string;
  area?: number;
  city?: string;
  management?: boolean;
};

type Estimate = {
  input?: EstimateInput;
  work?: [number, number];
  project?: [number, number];
  management?: [number, number];
  total?: [number, number];
};

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  apto_novo: "Apartamento novo",
  reforma: "Reforma",
};

const STANDARD_LABELS: Record<string, string> = {
  normal: "Essencial",
  alto: "Alto padrão",
  luxo: "Luxo",
};

const MOMENT_LABELS: Record<string, string> = {
  ja_tenho: "Já tem o imóvel",
  vou_comprar: "Vai comprar",
  pesquisando: "Só pesquisando",
};

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Contatos recebidos | DRG Arquitetura" },
      { name: "description", content: "Painel interno com os contatos recebidos pelo site da DRG Arquitetura." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Contatos recebidos | DRG Arquitetura" },
      { property: "og:description", content: "Painel interno da DRG Arquitetura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function leadWaUrl(lead: Lead) {
  const digits = lead.phone.replace(/\D/g, "");
  const text = `Olá ${lead.name.split(" ")[0]}, aqui é o Douglas, da DRG Arquitetura. Recebi seu contato pelo site.`;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`;
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>
);

function LeadCard({ lead }: { lead: Lead }) {
  const estimate = (lead.estimate ?? {}) as Estimate;
  const input = estimate.input ?? {};
  const hot = lead.moment === "ja_tenho";
  return (
    <li className="a-lead">
      <div className="a-avatar" aria-hidden="true">{initials(lead.name)}</div>
      <div>
        <p className="a-name">{lead.name}</p>
        <p className="a-meta">
          <span>{formatDate(lead.created_at)}</span>
          <span>{phoneDisplay(lead.phone)}</span>
          {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : null}
        </p>
        <div className="a-tags">
          {lead.moment ? <span className={hot ? "a-tag hot" : "a-tag"}>{MOMENT_LABELS[lead.moment] ?? lead.moment}</span> : null}
          {input.type ? <span className="a-tag">{TYPE_LABELS[input.type] ?? input.type}</span> : null}
          {input.standard ? <span className="a-tag">{STANDARD_LABELS[input.standard] ?? input.standard}</span> : null}
          {input.area ? <span className="a-tag">{input.area} m²</span> : null}
          {input.city ? <span className="a-tag">{input.city}</span> : null}
        </div>
      </div>
      <a className="a-wa" href={leadWaUrl(lead)} target="_blank" rel="noreferrer">
        <WaIcon /> Chamar no WhatsApp
      </a>
      <div className="a-values">
        <div><span>Obra estimada</span><strong>{estimate.work ? formatRange(estimate.work) : "—"}</strong></div>
        <div><span>Projeto estimado</span><strong>{estimate.project ? formatRange(estimate.project) : "—"}</strong></div>
      </div>
    </li>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const { data, error, isPending } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads(), retry: false });
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
  }

  const forbidden = error instanceof Error && error.message === "Forbidden";

  const stats = useMemo(() => {
    const list = data ?? [];
    const week = Date.now() - 7 * 864e5;
    const areas = list.map((l) => ((l.estimate ?? {}) as Estimate).input?.area).filter((a): a is number => typeof a === "number");
    return {
      total: list.length,
      week: list.filter((l) => new Date(l.created_at).getTime() >= week).length,
      hot: list.filter((l) => l.moment === "ja_tenho").length,
      area: areas.length ? Math.round(areas.reduce((a, b) => a + b, 0) / areas.length) : 0,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((l) => {
      const t = ((l.estimate ?? {}) as Estimate).input?.type;
      if (type !== "todos" && t !== type) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email ?? ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [data, query, type]);

  return (
    <div className="drg-admin">
      <header className="a-top">
        <div className="a-top-inner">
          <div className="a-brand">
            <img src="/media/logo-drg.png" alt="DRG Arquitetura" />
            <div><small>Área restrita</small><strong>Painel de contatos</strong></div>
          </div>
          <button type="button" className="a-ghost" onClick={handleSignOut}>Sair</button>
        </div>
      </header>
      <section className="a-hero">
        <div className="a-hero-inner">
          <p className="a-eyebrow">Contatos do site</p>
          <h1 className="serif">Pessoas prontas para conversar.</h1>
          <p>Cada contato abaixo fez uma simulação e autorizou o retorno pelo WhatsApp.</p>
        </div>
      </section>
      <main className="a-main">
        <div className="a-stats">
          <div className="a-stat"><span>Total</span><strong>{stats.total}</strong><em>contatos recebidos</em></div>
          <div className="a-stat"><span>Últimos 7 dias</span><strong>{stats.week}</strong><em>novos contatos</em></div>
          <div className="a-stat"><span>Já têm imóvel</span><strong>{stats.hot}</strong><em>prontos para projetar</em></div>
          <div className="a-stat"><span>Metragem média</span><strong>{stats.area ? `${stats.area} m²` : "—"}</strong><em>dos imóveis simulados</em></div>
        </div>

        <div className="a-toolbar">
          <input className="a-search" type="search" placeholder="Buscar por nome, telefone ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar contato" />
          <div className="a-chips" role="group" aria-label="Filtrar por tipo">
            {[["todos", "Todos"], ...Object.entries(TYPE_LABELS)].map(([value, label]) => (
              <button key={value} type="button" className="a-chip" aria-pressed={type === value} onClick={() => setType(value)}>{label}</button>
            ))}
          </div>
        </div>

        {isPending ? <p className="a-note">Carregando contatos…</p> : null}
        {forbidden ? <p className="a-note">Esta conta não tem permissão de administrador.</p> : null}
        {error && !forbidden ? <p className="a-note">Não foi possível carregar os contatos agora. Tente novamente em instantes.</p> : null}
        {data ? (
          filtered.length === 0 ? (
            <p className="a-note">{data.length === 0 ? "Nenhum contato recebido até agora." : "Nenhum contato encontrado com esse filtro."}</p>
          ) : (
            <ul className="a-list">{filtered.map((lead) => <LeadCard key={lead.id} lead={lead} />)}</ul>
          )
        ) : null}
      </main>
    </div>
  );
}

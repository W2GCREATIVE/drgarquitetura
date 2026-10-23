import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { listLeads } from "@/lib/admin.functions";
import { formatRange, waUrl } from "@/lib/drg";

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
  pesquisando: "Pesquisando",
  "3meses": "Em até 3 meses",
  "6meses": "Em até 6 meses",
  "1ano": "Em até 1 ano",
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

function LeadCard({ lead }: { lead: Lead }) {
  const estimate = (lead.estimate ?? {}) as Estimate;
  const input = estimate.input ?? {};
  return (
    <li className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{lead.name}</p>
          <p className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</p>
        </div>
        <a
          href={waUrl(`Olá ${lead.name.split(" ")[0]}, aqui é o Douglas, da DRG Arquitetura. Recebi seu contato pelo site.`)}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Chamar no WhatsApp
        </a>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="font-medium text-foreground">{phoneDisplay(lead.phone)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="font-medium text-foreground">{lead.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Momento</dt>
          <dd className="font-medium text-foreground">{lead.moment ? (MOMENT_LABELS[lead.moment] ?? lead.moment) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Projeto</dt>
          <dd className="font-medium text-foreground">
            {[TYPE_LABELS[input.type ?? ""] ?? input.type, STANDARD_LABELS[input.standard ?? ""] ?? input.standard, input.area ? `${input.area} m²` : null, input.city]
              .filter(Boolean)
              .join(" · ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Obra estimada</dt>
          <dd className="font-medium text-foreground">{estimate.work ? formatRange(estimate.work) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Projeto estimado</dt>
          <dd className="font-medium text-foreground">{estimate.project ? formatRange(estimate.project) : "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const { data, error, isPending } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads(), retry: false });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
  }

  const forbidden = error instanceof Error && error.message === "Forbidden";

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">DRG Arquitetura</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">Contatos recebidos</h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Sair
          </button>
        </div>

        {isPending ? <p className="mt-10 text-sm text-muted-foreground">Carregando contatos…</p> : null}

        {forbidden ? (
          <p className="mt-10 rounded-md border border-border bg-card p-4 text-sm text-foreground">
            Esta conta não tem permissão de administrador. Peça ao responsável pelo site para liberar o acesso.
          </p>
        ) : null}

        {error && !forbidden ? (
          <p className="mt-10 rounded-md border border-border bg-card p-4 text-sm text-foreground">
            Não foi possível carregar os contatos agora. Tente novamente em instantes.
          </p>
        ) : null}

        {data ? (
          data.length === 0 ? (
            <p className="mt-10 text-sm text-muted-foreground">Nenhum contato recebido até agora.</p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">{data.length} contato(s) recebido(s), do mais recente ao mais antigo.</p>
              <ul className="mt-6 space-y-4">
                {data.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </ul>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}

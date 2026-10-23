import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect: string };

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const target = search["redirect"];
    return { redirect: typeof target === "string" && target.startsWith("/") ? target : "/admin" };
  },
  head: () => ({
    meta: [
      { title: "Acesso restrito | DRG Arquitetura" },
      { name: "description", content: "Área de acesso restrito da DRG Arquitetura." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acesso restrito | DRG Arquitetura" },
      { property: "og:description", content: "Área de acesso restrito da DRG Arquitetura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect, replace: true });
    });
  }, [navigate, redirect]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const login = email.trim().toLowerCase();
      const loginEmail = login.includes("@") ? login : `${login}@drgarquitetura.com.br`;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) {
        setError("Usuário ou senha incorretos.");
        return;
      }
      navigate({ to: redirect, replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">DRG Arquitetura</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para ver os contatos recebidos pelo site.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="auth-email" className="text-sm font-medium text-foreground">
              Usuário
            </label>
            <input
              id="auth-email"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Aguarde…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

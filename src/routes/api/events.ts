import { createFileRoute } from "@tanstack/react-router";

const allowed = ["simulacao_iniciada", "passo1_concluido", "lead_capturado", "clique_whatsapp"];

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let name: unknown;
        try {
          name = ((await request.json()) as { name?: unknown }).name;
        } catch {
          name = null;
        }
        if (typeof name !== "string" || !allowed.includes(name))
          return new Response(JSON.stringify({ ok: false, error: "Evento inválido." }), { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("funnel_events").insert({ name });
        return new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

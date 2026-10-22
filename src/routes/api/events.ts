import { createFileRoute } from "@tanstack/react-router";
import { json, readBody, RequestError } from "@/lib/drg-request";

const allowed = ["simulacao_iniciada", "passo1_concluido", "lead_capturado", "clique_whatsapp"];

export const Route = createFileRoute("/api/events")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        let name: unknown;
        try {
          const body = await readBody(request);
          name = body && typeof body === "object" ? (body as { name?: unknown }).name : null;
        } catch (error) {
          return json(error instanceof RequestError ? error.status : 400, { ok: false, error: "Evento inválido." });
        }
        if (typeof name !== "string" || !allowed.includes(name))
          return json(400, { ok: false, error: "Evento inválido." });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("funnel_events").insert({ name });
        if (error) return json(500, { ok: false, error: "Não foi possível registrar o evento." });
        return json(201, { ok: true });
      },
    },
  },
});

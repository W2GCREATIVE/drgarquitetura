import { createFileRoute } from "@tanstack/react-router";
import { calculate, config } from "@/lib/drg";
import { contactSchema } from "@/lib/drg-contact";
import { json, readBody, RequestError } from "@/lib/drg-request";

export const Route = createFileRoute("/api/leads")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await readBody(request);
        } catch (error) {
          return json(error instanceof RequestError ? error.status : 400, { ok: false, error: error instanceof Error ? error.message : "Envie os dados no formato JSON." });
        }
        const parsed = contactSchema.safeParse(body);
        if (!parsed.success) return json(400, { ok: false, error: "Confira os dados informados." });
        let estimate;
        try {
          estimate = calculate(parsed.data.project);
        } catch (e) {
          return json(400, { ok: false, error: (e as Error).message });
        }
        const d = parsed.data;
        const { deliverFromVercel } = await import("@/lib/drg-delivery.server");
        const delivered = await deliverFromVercel("/api/leads", { ...d, project: estimate.input });
        if (delivered) return delivered;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("leads")
          .insert({
            name: d.name,
            phone: d.phone,
            email: d.email || null,
            moment: d.moment || null,
            privacy_version: d.privacyVersion || config.privacyVersion,
            project: estimate.input as never,
            estimate: estimate as never,
            source: (d.source ?? {}) as never,
          })
          .select("id")
          .single();
        if (error || !data) {
          console.error("lead insert failed", error);
          return json(500, { ok: false, error: "Não foi possível registrar seu contato. Use o WhatsApp para continuar." });
        }
        return json(201, { ok: true, id: data.id, estimate });
      },
    },
  },
});

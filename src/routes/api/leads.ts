import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { calculate, config } from "@/lib/drg";

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[1-9]{2}\d{8,9}$/),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  moment: z.enum(["", "ja_tenho", "vou_comprar", "pesquisando"]).optional(),
  consent: z.literal(true),
  privacyVersion: z.string().max(60),
  project: z.unknown(),
  source: z.record(z.string(), z.string().max(150)).optional(),
});

export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json(400, { ok: false, error: "Envie os dados no formato JSON." });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) return json(400, { ok: false, error: "Confira os dados informados." });
        let estimate;
        try {
          estimate = calculate(parsed.data.project);
        } catch (e) {
          return json(400, { ok: false, error: (e as Error).message });
        }
        const d = parsed.data;
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

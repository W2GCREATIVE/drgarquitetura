import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      throw new Error("Forbidden");
    }
    const { data, error } = await context.supabase
      .from("leads")
      .select("id, created_at, name, phone, email, moment, privacy_version, project, estimate, source")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("admin listLeads failed", error);
      throw new Error("Não foi possível carregar os contatos.");
    }
    return data;
  });

export const listTraffic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      throw new Error("Forbidden");
    }
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data, error } = await context.supabase
      .from("funnel_events")
      .select("name, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20000);
    if (error) {
      console.error("admin listTraffic failed", error);
      throw new Error("Não foi possível carregar o tráfego.");
    }
    return data;
  });

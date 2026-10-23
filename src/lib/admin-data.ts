import { supabase } from "@/integrations/supabase/client";

// Admin reads run in the signed-in browser session so they work on any host
// (Lovable or Vercel) without server-side Cloud variables. Access is enforced
// by admin-only row-level security in the database, not by this code.
async function requireAdmin() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Unauthorized");
  const { data: isAdmin, error } = await supabase.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
  if (error || !isAdmin) throw new Error("Forbidden");
}

export async function listLeads() {
  await requireAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, name, phone, email, moment, privacy_version, project, estimate, source")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("admin listLeads failed", error);
    throw new Error("Não foi possível carregar os contatos.");
  }
  return data;
}

export async function listTraffic() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await supabase
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
}

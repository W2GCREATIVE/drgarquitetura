import { json } from "./drg-request";

const cloudOrigin = "https://drgarquitetura.lovable.app";

// Cloud credentials never leave Cloud. External Vercel deployments forward only
// validated public-form payloads to the existing public capture endpoints.
export async function deliverFromVercel(path: "/api/leads" | "/api/events", body: unknown): Promise<Response | null> {
  if (process.env["VERCEL"] !== "1" || process.env["SUPABASE_SERVICE_ROLE_KEY"]) return null;
  try {
    const response = await fetch(`${cloudOrigin}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json() as { ok?: boolean; id?: unknown; estimate?: unknown };
    if (response.status !== 201 || result.ok !== true || (path === "/api/leads" && (typeof result.id !== "string" || !result.estimate))) {
      console.error("DRG capture delivery rejected", { path, status: response.status });
      return json(503, { ok: false, error: "Não foi possível registrar agora. Tente novamente em instantes." });
    }
    return json(201, result);
  } catch {
    console.error("DRG capture delivery unavailable", { path });
    return json(503, { ok: false, error: "Não foi possível registrar agora. Tente novamente em instantes." });
  }
}
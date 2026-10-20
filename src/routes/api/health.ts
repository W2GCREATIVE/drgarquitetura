import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/drg-request";
export const Route = createFileRoute("/api/health")({
  server: { handlers: {
    GET: () => json(200, { status: "ok", brand: "DRG Arquitetura" }),
    HEAD: () => new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } }),
  } },
});
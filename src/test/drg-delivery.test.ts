import { afterEach, expect, it, vi } from "vitest";
import { deliverFromVercel } from "@/lib/drg-delivery.server";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("forwards Vercel contact capture to the fixed Cloud endpoint without credentials", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const saved = { ok: true, id: "test-lead-id", estimate: { project: [13200, 18000] } };
  const fetchMock = vi.fn().mockResolvedValue(Response.json(saved, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const payload = { name: "Contato de teste", project: { area: 120 } };
  const result = await deliverFromVercel("/api/leads", payload);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://drgarquitetura.lovable.app/api/leads");
  expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), redirect: "error" });
  expect(result?.status).toBe(201);
  expect(await result?.json()).toEqual(saved);
});

it("keeps Cloud capture local instead of forwarding recursively", async () => {
  vi.stubEnv("VERCEL", "");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(await deliverFromVercel("/api/leads", {})).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("never reveals an estimate when the remote contact was not saved", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true, estimate: {} }, { status: 201 })));
  const result = await deliverFromVercel("/api/leads", {});
  expect(result?.status).toBe(503);
  expect(await result?.json()).toMatchObject({ ok: false });
});

it("forwards site events to the same Cloud used by the traffic panel", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  expect((await deliverFromVercel("/api/events", { name: "visita" }))?.status).toBe(201);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://drgarquitetura.lovable.app/api/events");
});
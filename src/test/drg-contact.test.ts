import { expect, it } from "vitest";
import { contactSchema } from "@/lib/drg-contact";
import { readBody } from "@/lib/drg-request";
const contact = { name: "Douglas Teste", phone: "47999998888", consent: true, privacyVersion: "revisao-2026-10-20", project: {} };
it("normalizes Brazilian phone with +55", () => {
  expect(contactSchema.parse({ ...contact, phone: "+55 (47) 99999-8888" }).phone).toBe("47999998888");
});
it("rejects previous privacy version", () => {
  expect(contactSchema.safeParse({ ...contact, privacyVersion: "apresentacao-2026-10-06" }).success).toBe(false);
});
it("requires consent", () => {
  expect(contactSchema.safeParse({ ...contact, consent: false }).success).toBe(false);
});
it("strips unknown source fields", () => {
  expect(contactSchema.parse({ ...contact, source: { utm_source: "google", other: "private" } }).source).toEqual({ utm_source: "google" });
});
it("rejects cross-origin writes", async () => {
  await expect(readBody(new Request("https://example.test/api/leads", { method: "POST", headers: { origin: "https://other.test", "content-type": "application/json" }, body: "{}" }))).rejects.toMatchObject({ status: 403 });
});
it.each([
  "https://75a71b2a-703e-4b49-9000-b19c3ddb1211.lovableproject.com",
  "https://id-preview--75a71b2a-703e-4b49-9000-b19c3ddb1211.lovable.app",
  "https://drgarquitetura.com.br",
  "https://www.drgarquitetura.com.br",
  "https://drgarquitetura.lovable.app",
])("accepts the exact DRG origin %s behind a hosting proxy", async (origin) => {
  const request = new Request("https://internal-proxy.test/api/leads", {
    method: "POST", headers: { origin, "sec-fetch-site": "same-origin", "content-type": "application/json" }, body: JSON.stringify(contact),
  });
  expect(await readBody(request)).toEqual(contact);
});
it("still rejects cross-site requests from an allowed origin", async () => {
  await expect(readBody(new Request("https://internal-proxy.test/api/events", {
    method: "POST", headers: { origin: "https://drgarquitetura.com.br", "sec-fetch-site": "cross-site", "content-type": "application/json" }, body: "{}",
  }))).rejects.toMatchObject({ status: 403 });
});
it("does not trust a forged forwarded host or an origin suffix", async () => {
  await expect(readBody(new Request("https://internal-proxy.test/api/leads", {
    method: "POST", headers: { origin: "https://drgarquitetura.com.br.attacker.test", "x-forwarded-host": "drgarquitetura.com.br.attacker.test", "content-type": "application/json" }, body: "{}",
  }))).rejects.toMatchObject({ status: 403 });
});
it("limits request body to 12 KiB", async () => {
  await expect(readBody(new Request("https://example.test/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: "x".repeat(12289) }))).rejects.toMatchObject({ status: 413 });
});
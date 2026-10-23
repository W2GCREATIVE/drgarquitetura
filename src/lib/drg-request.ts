export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const json = (status: number, data: unknown) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" },
});

// Hosting proxies can rewrite request.url while retaining the browser's Origin.
// Only these exact DRG origins may differ; never trust arbitrary forwarded hosts.
const siteOrigins = new Set([
  "https://drgarquitetura.com.br",
  "https://www.drgarquitetura.com.br",
  "https://drgarquitetura.lovable.app",
  "https://75a71b2a-703e-4b49-9000-b19c3ddb1211.lovableproject.com",
  "https://id-preview--75a71b2a-703e-4b49-9000-b19c3ddb1211.lovable.app",
]);

export async function readBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin && !siteOrigins.has(origin)))
    throw new RequestError(403, "Origem da solicitação não autorizada.");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? ""))
    throw new RequestError(415, "Envie os dados no formato JSON.");
  if (Number(request.headers.get("content-length")) > 12288) throw new RequestError(413, "As informações enviadas excedem o limite.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Envie os dados no formato JSON.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12288) { await reader.cancel(); throw new RequestError(413, "As informações enviadas excedem o limite."); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(buffer)); }
  catch { throw new RequestError(400, "Envie os dados no formato JSON."); }
}
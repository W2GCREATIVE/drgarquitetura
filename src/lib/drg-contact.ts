import { z } from "zod";
import { config } from "./drg";

const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim();
const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max));
export const contactSchema = z.object({
  name: text(100).pipe(z.string().min(2)),
  phone: text(25).pipe(z.string().regex(/^[+()\d\s-]+$/)).transform(value => {
    const digits = value.replace(/\D/g, "");
    return (digits.length === 12 || digits.length === 13) && digits.startsWith("55") ? digits.slice(2) : digits;
  }).pipe(z.string().regex(/^[1-9]{2}\d{8,9}$/)),
  email: text(254).pipe(z.union([z.literal(""), z.string().email()])).optional(),
  moment: z.enum(["", "ja_tenho", "vou_comprar", "pesquisando"]).optional(),
  consent: z.literal(true),
  privacyVersion: z.literal(config.privacyVersion),
  project: z.unknown(),
  source: z.object(Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "partner_code"].map(key => [key, text(150).optional()]))).optional(),
});
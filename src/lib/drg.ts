/* Configuração pública e cálculo da estimativa — portado de js/config.js e js/calculator.js */

export const config = {
  brand: "DRG Arquitetura",
  architect: "Douglas Gerst",
  whatsapp: "5547988188417",
  privacyVersion: "apresentacao-2026-10-06",
  estimateVersion: "demonstracao-2026-10-02",
  cities: ["Itajaí", "Balneário Camboriú", "Camboriú", "Outra cidade"],
  types: { casa: "Construir uma casa", apto_novo: "Apartamento novo", reforma: "Reformar imóvel" } as Record<string, string>,
  standards: { normal: "Essencial", alto: "Alto padrão", luxo: "Exclusivo" } as Record<string, string>,
  workPerM2: {
    casa: { normal: [3900, 4600], alto: [4900, 6500], luxo: [6500, 9000] },
    apto_novo: { normal: [1800, 2600], alto: [2800, 4200], luxo: [4200, 6500] },
    reforma: { normal: [2200, 3200], alto: [3200, 5000], luxo: [5000, 7500] },
  } as Record<string, Record<string, [number, number]>>,
  projectPerM2: { casa: [130, 200], apto_novo: [170, 260], reforma: [170, 260] } as Record<string, [number, number]>,
  projectFactor: { normal: 0.9, alto: 1, luxo: 1.25 } as Record<string, number>,
  projectMinimum: [9000, 11700] as [number, number],
  managementRate: [0.05, 0.1] as [number, number],
  areaLimits: [10, 5000] as [number, number],
};

export interface ProjectInput {
  type: string;
  standard: string;
  area: number;
  city: string;
  management: boolean;
}

export interface Estimate {
  input: ProjectInput;
  work: [number, number];
  project: [number, number];
  management: [number, number];
  total: [number, number];
  version: string;
}

export function validate(input: unknown): ProjectInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Informe os dados do projeto.");
  const i = input as Partial<ProjectInput>;
  if (typeof i.type !== "string" || !(i.type in config.types)) throw new Error("Escolha um tipo de projeto válido.");
  if (typeof i.standard !== "string" || !(i.standard in config.standards)) throw new Error("Escolha um padrão de acabamento válido.");
  if (typeof i.area !== "number" || !Number.isFinite(i.area) || i.area < config.areaLimits[0] || i.area > config.areaLimits[1])
    throw new Error("Informe uma área entre 10 e 5.000 m².");
  if (!config.cities.includes(i.city as string)) throw new Error("Escolha uma cidade válida.");
  if (typeof i.management !== "boolean") throw new Error("Informe se deseja incluir gestão.");
  return {
    type: i.type,
    standard: i.standard,
    area: Math.round(i.area * 100) / 100,
    city: i.city as string,
    management: i.management,
  };
}

export function calculate(raw: unknown): Estimate {
  const input = validate(raw);
  const unit = config.workPerM2[input.type]![input.standard]!;
  const work: [number, number] = [Math.round(unit[0] * input.area), Math.round(unit[1] * input.area)];
  const pm = config.projectPerM2[input.type]!;
  const factor = config.projectFactor[input.standard]!;
  const project: [number, number] = [
    Math.round(Math.max(config.projectMinimum[0], input.area * pm[0] * factor)),
    Math.round(Math.max(config.projectMinimum[1], input.area * pm[1] * factor)),
  ];
  const management: [number, number] = input.management
    ? [Math.round(work[0] * config.managementRate[0]), Math.round(work[1] * config.managementRate[1])]
    : [0, 0];
  const total: [number, number] = [work[0] + project[0] + management[0], work[1] + project[1] + management[1]];
  return { input, work, project, management, total, version: config.estimateVersion };
}

export function inclusions(type: string): string {
  return type === "casa"
    ? "Considera uma faixa para obra e projeto arquitetônico. Não inclui terreno, projetos complementares, taxas, piscina, muros ou mobiliário solto."
    : type === "reforma"
      ? "Considera uma reforma ampla com acabamentos e marcenaria e projeto de interiores. Não inclui mobiliário solto, eletrodomésticos, taxas ou problemas ocultos da edificação."
      : "Considera acabamentos e marcenaria de apartamento entregue no contrapiso e projeto de interiores. Não inclui mobiliário solto, eletrodomésticos ou taxas do condomínio.";
}

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const formatRange = (values: [number, number]) => `${formatBRL(values[0])} a ${formatBRL(values[1])}`;

export const waUrl = (message: string) => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;

export const phoneDisplay = config.whatsapp
  .replace(/^55/, "")
  .replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");

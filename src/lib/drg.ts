/* Configuração pública e cálculo da estimativa — portado de js/config.js e js/calculator.js */

export const config = {
  brand: "DRG Arquitetura",
  architect: "Douglas Gerst",
  whatsapp: "5547988188417",
  privacyVersion: "revisao-2026-10-20",
  estimateVersion: "faixas-douglas-2026-10-19",
  cities: ["Itajaí", "Balneário Camboriú", "Camboriú", "Outra cidade"],
  types: { casa: "Construir uma casa", apto_novo: "Apartamento novo", reforma: "Reformar imóvel" } as Record<string, string>,
  standards: { normal: "Essencial", alto: "Alto padrão", luxo: "Exclusivo" } as Record<string, string>,
  workPerM2: {
    casa: { normal: [3900, 4600], alto: [4900, 6500], luxo: [6500, 9000] },
    apto_novo: { normal: [1800, 2600], alto: [2800, 4200], luxo: [4200, 6500] },
    reforma: { normal: [2200, 3200], alto: [3200, 5000], luxo: [5000, 7500] },
  } as Record<string, Record<string, [number, number]>>,
  projectPerM2: {
    casa: { normal: [70, 90], alto: [95, 110], luxo: [140, 170] },
    apto_novo: { normal: [90, 100], alto: [110, 150], luxo: [170, 200] },
    reforma: { normal: [90, 100], alto: [110, 150], luxo: [170, 200] },
  } as Record<string, Record<string, [number, number]>>,
  managementPerM2: {
    casa: { normal: [30, 60], alto: [30, 60], luxo: [50, 80] },
    apto_novo: { normal: [30, 60], alto: [40, 70], luxo: [80, 100] },
    reforma: { normal: [30, 60], alto: [40, 70], luxo: [80, 100] },
  } as Record<string, Record<string, [number, number]>>,
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
  managementReference: [number, number];
  total: [number, number];
  version: string;
}

export function validate(input: unknown): ProjectInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Informe os dados do projeto.");
  const i = input as Partial<ProjectInput>;
  if (typeof i.type !== "string" || !Object.hasOwn(config.types, i.type)) throw new Error("Escolha um tipo de projeto válido.");
  if (typeof i.standard !== "string" || !Object.hasOwn(config.standards, i.standard)) throw new Error("Escolha um padrão de acabamento válido.");
  if (typeof i.area !== "number" || !Number.isFinite(i.area) || i.area < config.areaLimits[0] || i.area > config.areaLimits[1])
    throw new Error("Informe uma área entre 10 e 5.000 m².");
  if (!config.cities.includes(i.city as string)) throw new Error("Escolha uma cidade válida.");
  if (typeof i.management !== "boolean") throw new Error("Informe se deseja incluir acompanhamento de obra.");
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
  const unit = config.workPerM2[input.type]?.[input.standard];
  const pm = config.projectPerM2[input.type]?.[input.standard];
  const mm = config.managementPerM2[input.type]?.[input.standard];
  if (!unit || !pm || !mm) throw new Error("Escolha um cenário válido.");
  const work: [number, number] = [Math.round(unit[0] * input.area), Math.round(unit[1] * input.area)];
  const project: [number, number] = [
    Math.round(input.area * pm[0]),
    Math.round(input.area * pm[1]),
  ];
  const managementReference: [number, number] = [Math.round(input.area * mm[0]), Math.round(input.area * mm[1])];
  const management: [number, number] = input.management ? managementReference : [0, 0];
  const total: [number, number] = [work[0] + project[0] + management[0], work[1] + project[1] + management[1]];
  return { input, work, project, management, managementReference, total, version: config.estimateVersion };
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

(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.DRG_CALCULATOR = factory(root.DRG_CONFIG);
})(typeof globalThis !== 'undefined' ? globalThis : this, function(config) {
  'use strict';
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Informe os dados do projeto.');
    if (typeof input.type !== 'string' || !own(config.types, input.type)) throw new Error('Escolha um tipo de projeto válido.');
    if (typeof input.standard !== 'string' || !own(config.standards, input.standard)) throw new Error('Escolha um padrão de acabamento válido.');
    if (typeof input.area !== 'number' || !Number.isFinite(input.area) || input.area < config.areaLimits[0] || input.area > config.areaLimits[1]) throw new Error('Informe uma área entre 10 e 5.000 m².');
    if (!config.cities.includes(input.city)) throw new Error('Escolha uma cidade válida.');
    if (typeof input.management !== 'boolean') throw new Error('Informe se deseja incluir gestão.');
    return { type: input.type, standard: input.standard, area: Math.round(input.area * 100) / 100, city: input.city, management: input.management };
  }
  function calculate(raw) {
    const input = validate(raw);
    const unit = config.workPerM2[input.type][input.standard];
    const work = unit.map(n => Math.round(n * input.area));
    const project = config.projectPerM2[input.type].map((n,i) => Math.round(Math.max(config.projectMinimum[i], input.area * n * config.projectFactor[input.standard])));
    const management = work.map((n,i) => input.management ? Math.round(n * config.managementRate[i]) : 0);
    const total = work.map((n,i) => n + project[i] + management[i]);
    return { input, work, project, management, total, version: config.estimateVersion };
  }
  function inclusions(type) {
    return type === 'casa' ? 'Considera uma faixa para obra e projeto arquitetônico. Não inclui terreno, projetos complementares, taxas, piscina, muros ou mobiliário solto.' : type === 'reforma' ? 'Considera uma reforma ampla com acabamentos e marcenaria e projeto de interiores. Não inclui mobiliário solto, eletrodomésticos, taxas ou problemas ocultos da edificação.' : 'Considera acabamentos e marcenaria de apartamento entregue no contrapiso e projeto de interiores. Não inclui mobiliário solto, eletrodomésticos ou taxas do condomínio.';
  }
  return Object.freeze({ validate, calculate, inclusions });
});

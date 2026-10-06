/* Configuração pública. Não inclua senhas ou tokens neste arquivo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DRG_CONFIG = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return Object.freeze({
    brand: 'DRG Arquitetura', architect: 'Douglas Gerst',
    whatsapp: '5547988188417',
    /* Defina apenas depois de confirmar o domínio de produção. */
    siteUrl: '',
    leadEndpoint: '/api/leads', privacyVersion: 'apresentacao-2026-10-06',
    estimateVersion: 'demonstracao-2026-10-02',
    cities: ['Itajaí','Balneário Camboriú','Camboriú','Outra cidade'],
    types: { casa: 'Construir uma casa', apto_novo: 'Apartamento novo', reforma: 'Reformar imóvel' },
    standards: { normal: 'Essencial', alto: 'Alto padrão', luxo: 'Exclusivo' },
    /* Faixas demonstrativas trazidas da estrutura inicial; validar com o arquiteto. */
    workPerM2: {
      casa: { normal: [3900,4600], alto: [4900,6500], luxo: [6500,9000] },
      apto_novo: { normal: [1800,2600], alto: [2800,4200], luxo: [4200,6500] },
      reforma: { normal: [2200,3200], alto: [3200,5000], luxo: [5000,7500] }
    },
    /* Por m² constante: a área maior não pode reduzir o total estimado. */
    projectPerM2: { casa: [130,200], apto_novo: [170,260], reforma: [170,260] },
    projectFactor: { normal: .9, alto: 1, luxo: 1.25 },
    projectMinimum: [9000,11700], managementRate: [.05,.10], areaLimits: [10,5000]
  });
});

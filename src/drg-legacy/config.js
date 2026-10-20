/* Configuração pública. Não inclua senhas ou tokens neste arquivo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DRG_CONFIG = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const settings = {
    brand: 'DRG Arquitetura', architect: 'Douglas Gerst',
    whatsapp: '5547988188417',
    /* Defina apenas depois de confirmar o domínio de produção. */
    siteUrl: '',
    leadEndpoint: '/api/leads', privacyVersion: 'revisao-2026-10-20',
    estimateVersion: 'faixas-douglas-2026-10-19',
    cities: ['Itajaí','Balneário Camboriú','Camboriú','Outra cidade'],
    types: { casa: 'Construir uma casa', apto_novo: 'Apartamento novo', reforma: 'Reformar imóvel' },
    standards: { normal: 'Essencial', alto: 'Alto padrão', luxo: 'Exclusivo' },
    /* Faixas demonstrativas trazidas da estrutura inicial; validar com o arquiteto. */
    workPerM2: {
      casa: { normal: [3900,4600], alto: [4900,6500], luxo: [6500,9000] },
      apto_novo: { normal: [1800,2600], alto: [2800,4200], luxo: [4200,6500] },
      reforma: { normal: [2200,3200], alto: [3200,5000], luxo: [5000,7500] }
    },
    /* Faixas de projeto e acompanhamento informadas por Douglas em 19/10/2026.
       Reforma repete interiores. A referência de execução acima permanece igual. */
    projectPerM2: {
      casa: { normal: [70,90], alto: [95,110], luxo: [140,170] },
      apto_novo: { normal: [90,100], alto: [110,150], luxo: [170,200] },
      reforma: { normal: [90,100], alto: [110,150], luxo: [170,200] }
    },
    managementPerM2: {
      casa: { normal: [30,60], alto: [30,60], luxo: [50,80] },
      apto_novo: { normal: [30,60], alto: [40,70], luxo: [80,100] },
      reforma: { normal: [30,60], alto: [40,70], luxo: [80,100] }
    },
    areaLimits: [10,5000]
  };
  settings.structuredData = Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brand,
    url: settings.siteUrl,
    telephone: `+${settings.whatsapp}`,
    founder: {'@type':'Person',name:'Douglas Roberto Gerst',jobTitle:'Arquiteto e Urbanista'},
    areaServed: settings.cities.filter(city=>city!=='Outra cidade')
  });
  return Object.freeze(settings);
});

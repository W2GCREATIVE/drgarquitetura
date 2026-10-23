(function () {
  'use strict';
  const config = window.DRG_CONFIG, calculator = window.DRG_CALCULATOR;
  const $ = selector => document.querySelector(selector);
  const format = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(value);
  const range = values => `${format(values[0])} a ${format(values[1])}`;
  const form = $('#estimate-form'), first = $('#calculator-step-1'), second = $('#calculator-step-2'), third = $('#calculator-step-3');
  let step = 1, currentEstimate = null, savedContact = null, inputRevision = 0, submission = 0, simulationStarted = false, isSubmitting = false, activeRequest = null;
  const menuButton = $('.menu-toggle'), menu = $('#mobile-nav');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Abrir menu'); }
  menuButton.addEventListener('click', () => {
    const open = menu.hidden; menu.hidden = !open;
    menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  window.matchMedia('(min-width: 951px)').addEventListener('change',event => { if(event.matches) closeMenu(); });
  const header = $('.site-header');
  window.addEventListener('scroll',() => header.classList.toggle('scrolled',window.scrollY>15),{passive:true});
  $('#year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.06,rootMargin:'0px 0px 40px 0px'});
    document.documentElement.classList.add('js-enhanced');
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }
  const privacy = $('#privacy-dialog');
  document.querySelectorAll('[data-open-privacy]').forEach(button => button.addEventListener('click',() => privacy.showModal()));
  $('.dialog-close').addEventListener('click',() => privacy.close());
  privacy.addEventListener('click',event => {
    const bounds = privacy.getBoundingClientRect();
    if(event.target===privacy && (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom)) privacy.close();
  });
  function track(name, details = {}) {
    const payload = {event:name,...details};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    document.dispatchEvent(new CustomEvent('drg:funil',{detail:payload}));
    if(window.location.protocol==='http:' || window.location.protocol==='https:') {
      fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({name})}).catch(()=>{});
    }
  }
  function waUrl(message) { return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`; }
  const messages = {
    gestao:`Olá, ${config.architect}! Vim pelo site da ${config.brand} e gostaria de conversar sobre acompanhamento da obra.`,
    faq:`Olá, ${config.architect}! Vim pelo site da ${config.brand} e tenho uma dúvida sobre meu projeto.`,
    sobre:`Olá, ${config.architect}! Vim pelo site da ${config.brand} e quero conhecer melhor seu trabalho.`
  };
  document.querySelectorAll('[data-wa]').forEach(link => {
    link.href=waUrl(messages[link.dataset.wa] || `Olá, ${config.architect}! Vim pelo site da ${config.brand} e gostaria de conversar sobre um projeto.`);
    link.addEventListener('click',()=>track('clique_whatsapp',{local:link.dataset.wa}));
  });
  document.querySelectorAll('[data-wa-result]').forEach(link=>link.addEventListener('click',()=>track('clique_whatsapp',{local:link.dataset.waResult})));
  const phoneDisplay = config.whatsapp.replace(/^55/,'').replace(/^(\d{2})(\d{5})(\d{4})$/,'($1) $2-$3');
  $('.contact-phone').textContent=`WhatsApp · ${phoneDisplay}`;
  const privacyContact = privacy.querySelector('a');privacyContact.href=waUrl('Olá! Gostaria de conversar sobre meus dados pessoais.');privacyContact.textContent=phoneDisplay;
  if (config.siteUrl) {
    try {
      const url = new URL(config.siteUrl);
      if (url.protocol==='https:') {
        const canonical=document.createElement('link');canonical.rel='canonical';canonical.href=url.href;document.head.appendChild(canonical);
        const ld=document.createElement('script');ld.type='application/ld+json';ld.textContent=JSON.stringify(config.structuredData);document.head.appendChild(ld);
      }
    }catch{/* O domínio ainda não foi configurado. */}
  }
  function setStep(next) {
    step = next; first.hidden=next!==1; second.hidden=next!==2; third.hidden=next!==3;
    document.querySelectorAll('[data-progress]').forEach(item=>{
      const active=Number(item.dataset.progress)===next;
      item.classList.toggle('is-current',active);
      if(active)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
    });
    const heading=[first,second,third][next-1].querySelector('h3');
    heading.tabIndex=-1;
    heading.focus({preventScroll:true});
    $('#estimativa').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function projectInputs() {
    return {type:form.querySelector('input[name="projectType"]:checked')?.value, standard:form.querySelector('input[name="standard"]:checked')?.value, area:$('#project-area').valueAsNumber, city:$('#project-city').value, management:$('#include-management').checked};
  }
  function summary(estimate) {
    const input=estimate.input;
    return `${config.types[input.type]} · ${input.area.toLocaleString('pt-BR')} m² · ${config.standards[input.standard]} · ${input.city}`;
  }
  function duration(estimate) {
    const values={casa:[8,60],apto_novo:[2,60],reforma:[3,50]};
    const [base,divisor]=values[estimate.input.type], months=base+estimate.input.area/divisor;
    return `${Math.max(1,Math.round(months))} a ${Math.round(months*1.5)} meses`;
  }
  function beginSimulation() {
    if(!simulationStarted){simulationStarted=true;track('simulacao_iniciada');}
  }
  function clearErrors() {
    $('#estimate-error').textContent='';$('#lead-error').textContent='';
    form.querySelectorAll('[aria-invalid]').forEach(element=>element.removeAttribute('aria-invalid'));
  }
  function maskPhone(value) {
    let numbers=value.replace(/\D/g,'');
    if(numbers.length>11 && numbers.startsWith('55'))numbers=numbers.slice(2);
    numbers=numbers.slice(0,11);
    if(numbers.length<3)return numbers?`(${numbers}`:'';
    if(numbers.length<7)return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`;
    if(numbers.length<11)return `(${numbers.slice(0,2)}) ${numbers.slice(2,6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
  }
  $('#client-phone').addEventListener('input',event=>{event.target.value=maskPhone(event.target.value);});
  first.addEventListener('input',()=>{beginSimulation();inputRevision++;clearErrors();});
  first.addEventListener('change',()=>{beginSimulation();inputRevision++;clearErrors();});
  second.addEventListener('input',()=>{$('#lead-error').textContent='';second.querySelectorAll('[aria-invalid]').forEach(element=>element.removeAttribute('aria-invalid'));});
  $('#calculate-button').addEventListener('click',()=>{
    beginSimulation();clearErrors();
    try { currentEstimate=calculator.calculate(projectInputs()); }
    catch(error){
      const target=/tipo de projeto/.test(error.message)?form.querySelector('input[name="projectType"]'):/padrão/.test(error.message)?form.querySelector('input[name="standard"]'):/cidade/.test(error.message)?$('#project-city'):$('#project-area');
      target.setAttribute('aria-invalid','true');$('#estimate-error').textContent=error.message;target.focus();return;
    }
    $('#locked-summary').textContent=summary(currentEstimate);
    $('#locked-duration').textContent=duration(currentEstimate);
    track('passo1_concluido',{tipo:currentEstimate.input.type,cidade:currentEstimate.input.city});
    setStep(2);
  });
  $('#back-button').addEventListener('click',()=>{submission++;activeRequest?.abort();setStep(1);});
  function source() {
    const result={};
    const clean=value=>value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim().slice(0,150);
    try {const params=new URLSearchParams(window.location.search);for(const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']){const value=params.get(key);if(value)result[key]=clean(value);}const partner=params.get('parceiro')||params.get('codigo_parceiro')||params.get('ref');if(partner)result.partner_code=clean(partner);}catch{}
    return result;
  }
  function contactData() {
    const name=$('#client-name').value.trim().replace(/\s+/g,' '),phone=$('#client-phone').value.replace(/\D/g,''),email=$('#client-email').value.trim(),moment=$('#client-moment').value;
    if(name.length<2 || name.length>100){$('#client-name').setAttribute('aria-invalid','true');$('#client-name').focus();throw new Error('Informe seu nome.');}
    if(!/^\d{10,11}$/.test(phone) || !/^[1-9]{2}/.test(phone)){$('#client-phone').setAttribute('aria-invalid','true');$('#client-phone').focus();throw new Error('Informe um WhatsApp com DDD e 10 ou 11 dígitos.');}
    if(email && !$('#client-email').checkValidity()){$('#client-email').setAttribute('aria-invalid','true');$('#client-email').focus();throw new Error('Confira o e-mail informado.');}
    if(!$('#contact-consent').checked){$('#contact-consent').focus();throw new Error('Autorize o uso dos dados para o retorno sobre seu projeto.');}
    return {name,phone,email,moment,consent:true,privacyVersion:config.privacyVersion,project:{...currentEstimate.input},source:source(),company:$('#client-company')?.value||''};
  }
  function buildMessage(contact,estimate) {
    const lines=[`Olá, ${config.architect}! Sou ${contact.name} e vim pelo site da ${config.brand}.`,'',`Meu WhatsApp: ${maskPhone(contact.phone)}`,`E-mail: ${contact.email||'não informado'}`,`Momento: ${{ja_tenho:'já tenho o imóvel',vou_comprar:'vou comprar',pesquisando:'só pesquisando'}[contact.moment]||'não informado'}`,'',`Tipo: ${config.types[estimate.input.type]}`,`Cidade: ${estimate.input.city}`,`Área: ${estimate.input.area.toLocaleString('pt-BR')} m²`,`Padrão: ${config.standards[estimate.input.standard]}`,'',`Projeto com a DRG: ${range(estimate.project)}`,`Acompanhamento de obra: ${estimate.input.management?range(estimate.management):`não selecionado; referência a partir de ${format(estimate.managementReference[0])}`}`,`Referência de obra por terceiros: ${range(estimate.work)}`];
    const origins=Object.entries(contact.source).map(([key,value])=>`${key}: ${value}`);if(origins.length)lines.push('',`Origem: ${origins.join(' / ')}`);
    lines.push('','Entendo que os valores são referências demonstrativas, sujeitos à avaliação do escopo. Gostaria de conversar sobre os próximos passos.');
    return lines.join('\n');
  }
  async function registerContact(contact) {
    const controller=new AbortController(), timeout=window.setTimeout(()=>controller.abort(),10000);
    activeRequest=controller;
    try {
      const response=await fetch(config.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(contact),signal:controller.signal});
      const data=await response.json();
      if(!response.ok || data.ok!==true || !data.id || !data.estimate)throw new Error(data.error||'Falha no registro.');
      return data;
    } finally {window.clearTimeout(timeout);if(activeRequest===controller)activeRequest=null;}
  }
  function showResult(contact,estimate) {
    $('#result-summary').textContent=summary(estimate);
    $('#project-label').textContent=estimate.input.type==='casa'?'Projeto arquitetônico':'Projeto de interiores';
    $('#cost-project').textContent=range(estimate.project);
    const minFollowup=estimate.managementReference[0];
    $('#followup-title').textContent=estimate.input.management?'Acompanhamento para conversar':'Quer acompanhamento na obra?';
    $('#cost-management').textContent=estimate.input.management?range(estimate.management):`A partir de ${format(minFollowup)}`;
    $('#followup-description').textContent=estimate.input.management?'Pode ser contratado separadamente do projeto para sanar dúvidas, conferir etapas e, em interiores, alinhar fornecedores e montagem conforme o escopo. A DRG não executa a obra.':'Referência para acompanhamento pontual, contratado à parte. Em interiores, o escopo pode incluir alinhamento de fornecedores e montagem. A DRG não executa a obra.';
    $('#cost-work').textContent=range(estimate.work);
    $('#cost-total').textContent=range(estimate.total);
    $('#estimate-inclusions').textContent=calculator.inclusions(estimate.input.type);
    const message=buildMessage(contact,estimate),url=waUrl(message);
    $('#prepared-whatsapp').href=url;$('#project-whatsapp').href=url;
    setStep(3);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(step!==2 || !currentEstimate || isSubmitting)return;
    clearErrors();let contact;
    try{contact=contactData();}catch(error){$('#lead-error').textContent=error.message;return;}
    const revision=inputRevision, ownSubmission=++submission, button=$('#reveal-button');
    isSubmitting=true;
    const fields=Array.from(second.querySelectorAll('input, select'));
    fields.forEach(field=>{field.disabled=true;});
    button.disabled=true;button.textContent='Registrando seu contato…';
    try {
      const saved=await registerContact(contact);
      if(revision!==inputRevision || ownSubmission!==submission || step!==2)return;
      savedContact=contact;
      track('lead_capturado',{tipo:currentEstimate.input.type,cidade:currentEstimate.input.city});
      showResult(savedContact,saved.estimate);
    } catch {
      if(ownSubmission===submission && step===2){
        const error=$('#lead-error');
        error.textContent='Não foi possível registrar seu contato agora. Tente novamente ou converse diretamente pelo ';
        const link=document.createElement('a');link.href=waUrl(`Olá, ${config.architect}! Tentei calcular uma estimativa pelo site, mas não consegui concluir. Gostaria de conversar sobre meu projeto.`);link.target='_blank';link.rel='noopener noreferrer';link.textContent='WhatsApp';
        link.addEventListener('click',()=>track('clique_whatsapp',{local:'falha_cadastro'}));error.appendChild(link);
      }
    } finally {fields.forEach(field=>{field.disabled=false;});isSubmitting=false;button.disabled=false;button.textContent='Ver minha estimativa';}
  });
  $('#restart-button').addEventListener('click',()=>{
    submission++;currentEstimate=null;savedContact=null;simulationStarted=false;
    $('#client-name').value='';$('#client-phone').value='';$('#client-email').value='';$('#client-moment').value='';$('#contact-consent').checked=false;
    clearErrors();setStep(1);
  });
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{
    form.querySelector(`input[name="projectType"][value="${button.dataset.service}"]`).checked=true;
    inputRevision++;currentEstimate=null;beginSimulation();clearErrors();setStep(1);
  }));
})();

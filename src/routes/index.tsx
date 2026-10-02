import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  config,
  calculate,
  inclusions,
  formatBRL,
  formatRange,
  waUrl,
  phoneDisplay,
  type Estimate,
  type ProjectInput,
} from "@/lib/drg";
import residenciaAsset from "@/assets/residencia-conceitual.webp.asset.json";
import interiorAsset from "@/assets/interior-conceitual.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arquiteto em Itajaí e Balneário Camboriú | DRG Arquitetura" },
      {
        name: "description",
        content:
          "DRG Arquitetura: projetos residenciais, interiores e acompanhamento de obras em Itajaí e Balneário Camboriú. Planeje seu investimento e converse com Douglas pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: "DRG Arquitetura | Itajaí e Balneário Camboriú" },
      {
        property: "og:description",
        content: "Arquitetura, interiores e gestão de obras. Um projeto pensado para o seu jeito de viver.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#202822" },
    ],
  }),
  component: Index,
});

const waMessages: Record<string, string> = {
  gestao: `Olá, ${config.architect}! Vim pelo site da ${config.brand} e gostaria de conversar sobre gestão de obra.`,
  faq: `Olá, ${config.architect}! Vim pelo site da ${config.brand} e tenho uma dúvida sobre meu projeto.`,
  sobre: `Olá, ${config.architect}! Vim pelo site da ${config.brand} e quero conhecer melhor seu trabalho.`,
};

function wa(key: string) {
  return waUrl(
    waMessages[key] ||
      `Olá, ${config.architect}! Vim pelo site da ${config.brand} e gostaria de conversar sobre um projeto.`,
  );
}

function maskPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length < 3) return numbers ? `(${numbers}` : "";
  if (numbers.length < 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length < 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const [input, setInput] = useState<ProjectInput>({
    type: "apto_novo",
    standard: "alto",
    area: 120,
    city: "Itajaí",
    management: true,
  });
  const [estimate, setEstimate] = useState<Estimate | null>(() => {
    try {
      return calculate({ type: "apto_novo", standard: "alto", area: 120, city: "Itajaí", management: true });
    } catch {
      return null;
    }
  });
  const [estimateError, setEstimateError] = useState("");
  const [contactError, setContactError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [prepared, setPrepared] = useState<{ url: string; text: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const estimateSectionRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Reveal on scroll + header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll, { passive: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window && !reduce) {
      document.documentElement.classList.add("js-enhanced");
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer!.unobserve(entry.target);
            }
          }),
        { threshold: 0.06, rootMargin: "0px 0px 40px 0px" },
      );
      document.querySelectorAll(".reveal").forEach((el) => observer!.observe(el));
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      document.documentElement.classList.remove("js-enhanced");
    };
  }, []);

  // Escape closes the mobile menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const applyInput = (next: ProjectInput) => {
    setInput(next);
    setPrepared(null);
    setCopyStatus("");
    try {
      setEstimate(calculate(next));
      setEstimateError("");
    } catch (e) {
      setEstimate(null);
      setEstimateError((e as Error).message);
    }
  };

  const chooseService = (type: string) => {
    applyInput({ ...input, type });
    estimateSectionRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    setInvalidFields([]);
    if (!estimate) {
      setEstimateError("Revise os dados para gerar uma faixa de investimento.");
      return;
    }
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanPhone = phone.replace(/\D/g, "");
    const bad: string[] = [];
    if (cleanName.length < 2 || cleanName.length > 100) bad.push("name");
    if (cleanPhone && !/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(cleanPhone)) bad.push("phone");
    if (!consent) bad.push("consent");
    if (bad.length) {
      setInvalidFields(bad);
      setContactError(
        bad.includes("name")
          ? "Informe seu nome para preparar a conversa."
          : bad.includes("phone")
            ? "Confira seu WhatsApp com DDD ou deixe esse campo vazio."
            : "Autorize o uso dos dados para responder ao seu pedido.",
      );
      return;
    }
    const lines = [
      `Olá, ${config.architect}! Sou ${cleanName} e vim pelo site da ${config.brand}.`,
      "",
      "Quero conversar sobre este cenário:",
      `• Projeto: ${config.types[estimate.input.type]}`,
      `• Local: ${estimate.input.city}`,
      `• Área aproximada: ${estimate.input.area.toLocaleString("pt-BR")} m²`,
      `• Acabamento: ${config.standards[estimate.input.standard]}`,
      `• Gestão da obra: ${estimate.input.management ? "incluída na referência" : "não incluída"}`,
      "",
      `Estimativa demonstrativa total: ${formatRange(estimate.total)}`,
      `Execução: ${formatRange(estimate.work)}`,
      `Projeto: ${formatRange(estimate.project)}`,
    ];
    if (estimate.input.management) lines.push(`Gestão: ${formatRange(estimate.management)}`);
    if (cleanPhone) lines.push("", `Meu WhatsApp: ${cleanPhone}`);
    if (message.trim()) lines.push("", `Sobre a minha ideia: ${message.trim().slice(0, 600)}`);
    lines.push(
      "",
      "Entendo que esta faixa é apenas uma referência, sujeita à avaliação do imóvel e do escopo. Gostaria de conhecer os próximos passos.",
    );
    const text = lines.join("\n");
    setPrepared({ url: waUrl(text), text });
    setTimeout(
      () =>
        resultRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "nearest",
        }),
      50,
    );
  };

  const copyMessage = async () => {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.text);
      setCopyStatus("Mensagem copiada.");
    } catch {
      setCopyStatus("Abra o WhatsApp para conferir e enviar a mensagem.");
    }
  };

  return (
    <div className="drg-site">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="DRG Arquitetura, início">
            <span className="brand-name">
              DRG<span className="brand-dot">.</span>
            </span>
            <span className="brand-label">ARQUITETURA</span>
          </a>
          <nav className="desktop-nav" aria-label="Navegação principal">
            <a href="#servicos">O que fazemos</a>
            <a href="#conceitos">Inspirações</a>
            <a href="#sobre">O arquiteto</a>
            <a href="#estimativa">Planeje sua obra</a>
          </nav>
          <a className="button button-small button-outline header-cta" href={wa("header")} target="_blank" rel="noopener noreferrer">
            Vamos conversar
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
        <nav className="mobile-nav" id="mobile-nav" aria-label="Navegação no celular" hidden={!menuOpen}>
          {[
            ["#servicos", "O que fazemos"],
            ["#conceitos", "Inspirações"],
            ["#sobre", "O arquiteto"],
            ["#estimativa", "Planeje sua obra"],
            ["#contato", "Contato"],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="conteudo">
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-image" aria-hidden="true">
            <img src={residenciaAsset.url} alt="" width={1672} height={941} fetchPriority="high" />
          </div>
          <div className="container hero-content">
            <p className="eyebrow light">
              <span className="short-rule"></span>ITAJAÍ · BALNEÁRIO CAMBORIÚ
            </p>
            <h1 id="hero-title">
              Arquitetura para<br />o seu jeito de <em>viver.</em>
            </h1>
            <p className="hero-description">
              Projetos residenciais, interiores e gestão de obras em Itajaí e Balneário Camboriú. Do primeiro traço às
              escolhas que fazem a diferença todos os dias.
            </p>
            <div className="hero-actions">
              <a className="button button-gold" href={wa("hero")} target="_blank" rel="noopener noreferrer">
                Fale sobre seu projeto{" "}
                <span className="wa-icon" aria-hidden="true">
                  ◉
                </span>
              </a>
              <a className="text-link light" href="#estimativa">
                Estime seu investimento<span className="link-line"></span>
              </a>
            </div>
            <div className="hero-bottom">
              <p>
                PROJETO COM INTENÇÃO.<br />EXECUÇÃO COM DIREÇÃO.
              </p>
              <a className="scroll-cue" href="#servicos" aria-label="Conhecer os serviços">
                <span></span>Explore a DRG
              </a>
              <span className="image-credit">Imagem conceitual</span>
            </div>
          </div>
        </section>

        <div className="value-strip">
          <div className="container">
            <span>Arquitetura residencial</span>
            <i aria-hidden="true"></i>
            <span>Interiores & reformas</span>
            <i aria-hidden="true"></i>
            <span>Gestão de obras</span>
            <i aria-hidden="true"></i>
            <span>Litoral de Santa Catarina</span>
          </div>
        </div>

        <section className="section services-section" id="servicos">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">01 / O QUE FAZEMOS</p>
                <h2>
                  Um bom projeto começa<br />entendendo <em>você.</em>
                </h2>
              </div>
              <p className="heading-aside">
                Uma casa para construir, um apartamento para transformar ou uma obra para acompanhar. Cada espaço pede
                um caminho próprio.
              </p>
            </div>
            <div className="service-grid">
              <article className="service-card reveal">
                <span className="service-number">01</span>
                <span className="service-symbol" aria-hidden="true">⌂</span>
                <h3>Arquitetura<br />residencial</h3>
                <p>Uma casa pensada para o terreno, a rotina e o que você quer viver nela.</p>
                <ul>
                  <li>Estudo de viabilidade</li>
                  <li>Projeto arquitetônico e executivo</li>
                  <li>Detalhamento para a obra</li>
                </ul>
                <button className="service-link" type="button" onClick={() => chooseService("casa")}>
                  Quero construir minha casa
                </button>
              </article>
              <article className="service-card reveal">
                <span className="service-number">02</span>
                <span className="service-symbol" aria-hidden="true">▱</span>
                <h3>Interiores<br />& reformas</h3>
                <p>Ambientes que equilibram beleza, funcionalidade e escolhas que fazem sentido para você.</p>
                <ul>
                  <li>Layout e estudo dos ambientes</li>
                  <li>Materiais, iluminação e marcenaria</li>
                  <li>Projeto para reformar ou finalizar</li>
                </ul>
                <button className="service-link" type="button" onClick={() => chooseService("apto_novo")}>
                  Quero transformar meu espaço
                </button>
              </article>
              <article className="service-card reveal">
                <span className="service-number">03</span>
                <span className="service-symbol" aria-hidden="true">⊞</span>
                <h3>Gestão<br />de obras</h3>
                <p>O projeto segue com você no canteiro, com acompanhamento técnico e decisões organizadas.</p>
                <ul>
                  <li>Planejamento da execução</li>
                  <li>Acompanhamento de fornecedores</li>
                  <li>Conferência do projeto na obra</li>
                </ul>
                <a className="service-link" href={wa("gestao")} target="_blank" rel="noopener noreferrer">
                  Quero acompanhar minha obra
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="section concepts-section" id="conceitos">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">02 / POSSIBILIDADES</p>
                <h2>
                  Espaços que inspiram.<br />Escolhas que <em>permanecem.</em>
                </h2>
              </div>
              <p className="heading-aside">
                Luz natural, materiais honestos e ambientes conectados. Referências para começar a imaginar o seu
                próximo espaço.
              </p>
            </div>
            <div className="concept-grid">
              <article className="concept-card concept-house reveal">
                <div className="concept-visual">
                  <img
                    src={residenciaAsset.url}
                    alt="Conceito ilustrativo de residência contemporânea com concreto, madeira e integração à paisagem litorânea."
                    width={1672}
                    height={941}
                    loading="lazy"
                  />
                </div>
                <div className="concept-caption">
                  <span>ARQUITETURA RESIDENCIAL</span>
                  <h3>Viver em conexão</h3>
                  <p>Aberturas generosas, integração e uma relação próxima com a paisagem.</p>
                  <small>Conceito ilustrativo · não representa uma obra executada</small>
                </div>
              </article>
              <article className="concept-card concept-interior reveal">
                <div className="concept-visual">
                  <img
                    src={interiorAsset.url}
                    alt="Conceito ilustrativo de sala de estar com madeira, pedra natural e jardim integrado."
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                </div>
                <div className="concept-caption">
                  <span>INTERIORES</span>
                  <h3>O conforto de pertencer</h3>
                  <p>Texturas naturais, luz acolhedora e espaço para a vida acontecer.</p>
                  <small>Conceito ilustrativo · não representa uma obra executada</small>
                </div>
              </article>
            </div>
            <div className="concept-footer reveal">
              <p>O seu projeto começa com uma conversa sobre como você quer viver.</p>
              <a className="text-link" href="#contato">
                Conte sua ideia<span className="link-line"></span>
              </a>
            </div>
          </div>
        </section>

        <section className="section about-section" id="sobre">
          <div className="container about-grid">
            <div className="about-art reveal">
              <div className="about-monogram" aria-hidden="true">
                DG<span>.</span>
              </div>
              <div className="about-art-caption">
                <span>DOUGLAS ROBERTO GERST</span>
                <p>
                  Arquitetura, interiores<br />e gestão de obras.
                </p>
              </div>
              <span className="about-art-line" aria-hidden="true"></span>
            </div>
            <div className="about-copy reveal">
              <p className="eyebrow">03 / O ARQUITETO</p>
              <h2>
                Olá, eu sou<br />
                <em>Douglas Gerst.</em>
              </h2>
              <p className="about-intro">
                Arquiteto e urbanista à frente da DRG Arquitetura, com atuação em Itajaí e Balneário Camboriú.
              </p>
              <p>
                O projeto começa pela escuta: sua rotina, suas referências e o que você espera do espaço. A partir daí,
                cada escolha ganha uma razão — da organização dos ambientes ao detalhe que chega à obra.
              </p>
              <p>
                A proposta da DRG conecta projeto e acompanhamento da execução, para que você tenha um caminho claro
                entre a ideia e o espaço pronto.
              </p>
              <div className="about-values">
                <div>
                  <span>ESCUTA</span>
                  <p>Seu modo de viver<br />orienta o projeto.</p>
                </div>
                <div>
                  <span>CLAREZA</span>
                  <p>Etapas e decisões<br />bem definidas.</p>
                </div>
                <div>
                  <span>PRESENÇA</span>
                  <p>Projeto e obra<br />em diálogo.</p>
                </div>
              </div>
              <a className="text-link" href={wa("sobre")} target="_blank" rel="noopener noreferrer">
                Converse comigo<span className="link-line"></span>
              </a>
            </div>
          </div>
        </section>

        <section className="section method-section" id="metodo">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow light">04 / NOSSO CAMINHO</p>
                <h2>
                  Da primeira ideia<br />ao último <em>detalhe.</em>
                </h2>
              </div>
              <p className="heading-aside">Você participa das decisões. O projeto organiza o caminho.</p>
            </div>
            <div className="method-grid">
              {[
                ["01", "Ouvir & entender", "Conversamos sobre suas necessidades, o imóvel, as prioridades e o investimento disponível."],
                ["02", "Desenhar & escolher", "Transformamos o briefing em proposta, com ambientes, materiais e soluções para você avaliar."],
                ["03", "Detalhar & planejar", "Organizamos as informações técnicas que orientam fornecedores e execução."],
                ["04", "Acompanhar & realizar", "Na contratação de gestão, acompanhamos a obra e as decisões ao longo da execução."],
              ].map(([num, title, text]) => (
                <article className="method-step reveal" key={num}>
                  <span>{num}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section estimate-section" id="estimativa" ref={estimateSectionRef}>
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">05 / PLANEJE SEU INVESTIMENTO</p>
                <h2>
                  Antes de construir,<br />vamos <em>planejar.</em>
                </h2>
              </div>
              <p className="heading-aside">
                Explore uma faixa inicial para sua obra. Depois, leve seu cenário para uma conversa com o arquiteto.
              </p>
            </div>
            <div className="calculator-shell reveal">
              <form className="calculator-form" noValidate onSubmit={handleSubmit}>
                <div className="form-section-title">
                  <span className="step-badge">01</span>
                  <div>
                    <h3>Como é o seu projeto?</h3>
                    <p>Escolha o cenário mais próximo do que você imagina.</p>
                  </div>
                </div>
                <fieldset className="project-options">
                  <legend>Tipo de projeto</legend>
                  {(
                    [
                      ["casa", "Construir uma casa", "Projeto desde o terreno"],
                      ["apto_novo", "Apartamento novo", "Finalizar e morar"],
                      ["reforma", "Reformar meu imóvel", "Transformar o que já existe"],
                    ] as [string, string, string][]
                  ).map(([value, title, sub]) => (
                    <label className="project-option" key={value}>
                      <input
                        type="radio"
                        name="projectType"
                        value={value}
                        checked={input.type === value}
                        onChange={() => applyInput({ ...input, type: value })}
                      />
                      <span>
                        <b>{title}</b>
                        <small>{sub}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="project-city">Cidade da obra</label>
                    <select
                      id="project-city"
                      name="city"
                      value={input.city}
                      onChange={(e) => applyInput({ ...input, city: e.target.value })}
                    >
                      {config.cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="project-area">Área aproximada</label>
                    <div className="input-unit">
                      <input
                        id="project-area"
                        name="area"
                        type="number"
                        min={10}
                        max={5000}
                        step={1}
                        value={Number.isNaN(input.area) ? "" : input.area}
                        inputMode="decimal"
                        aria-describedby="area-hint"
                        aria-invalid={estimateError ? true : undefined}
                        onChange={(e) => applyInput({ ...input, area: e.target.valueAsNumber })}
                      />
                      <span>m²</span>
                    </div>
                    <small id="area-hint">De 10 a 5.000 m²</small>
                  </div>
                </div>
                <fieldset className="standard-options">
                  <legend>Padrão de acabamento</legend>
                  {(
                    [
                      ["normal", "Essencial"],
                      ["alto", "Alto padrão"],
                      ["luxo", "Exclusivo"],
                    ] as [string, string][]
                  ).map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="standard"
                        value={value}
                        checked={input.standard === value}
                        onChange={() => applyInput({ ...input, standard: value })}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={input.management}
                    onChange={(e) => applyInput({ ...input, management: e.target.checked })}
                  />
                  <span>Incluir uma referência de gestão da obra</span>
                </label>
                <p className="form-error" role="alert">
                  {estimateError}
                </p>
                <div className="form-divider"></div>
                <div className="form-section-title">
                  <span className="step-badge">02</span>
                  <div>
                    <h3>Vamos conversar sobre essa ideia?</h3>
                    <p>Preencha seu nome para preparar sua mensagem.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="client-name">
                      Seu nome <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="client-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      placeholder="Como podemos chamar você?"
                      required
                      value={name}
                      aria-invalid={invalidFields.includes("name") ? true : undefined}
                      onChange={(e) => {
                        setName(e.target.value);
                        setPrepared(null);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="client-phone">
                      Seu WhatsApp <span className="optional">(opcional)</span>
                    </label>
                    <input
                      id="client-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="tel"
                      maxLength={15}
                      placeholder="(47) 99999-9999"
                      value={phone}
                      aria-invalid={invalidFields.includes("phone") ? true : undefined}
                      onChange={(e) => {
                        setPhone(maskPhone(e.target.value));
                        setPrepared(null);
                      }}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="client-message">
                    Algo que gostaria de contar? <span className="optional">(opcional)</span>
                  </label>
                  <textarea
                    id="client-message"
                    name="message"
                    rows={2}
                    maxLength={600}
                    placeholder="Ex.: comprei um apartamento na Praia Brava e quero planejar os interiores."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setPrepared(null);
                    }}
                  />
                </div>
                <label className="checkbox-label consent-label">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    aria-invalid={invalidFields.includes("consent") ? true : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setPrepared(null);
                    }}
                  />
                  <span>
                    Autorizo o uso dos dados informados para responder a este pedido.{" "}
                    <button className="inline-button" type="button" onClick={() => setPrivacyOpen(true)}>
                      Entenda como usamos seus dados.
                    </button>
                  </span>
                </label>
                <button className="button button-dark prepare-button" type="submit">
                  Preparar conversa no WhatsApp{" "}
                  <span className="wa-icon" aria-hidden="true">
                    ◉
                  </span>
                </button>
                <p className="form-note">Você confere a mensagem antes de enviar. A estimativa não é um orçamento contratado.</p>
                <p className="form-error" role="alert">
                  {contactError}
                </p>
                {prepared && (
                  <div className="contact-result" ref={resultRef}>
                    <h4>Sua mensagem está pronta.</h4>
                    <p>A página preparou sua mensagem. O contato será recebido quando você enviar pelo WhatsApp.</p>
                    <a className="button button-whatsapp" href={prepared.url} target="_blank" rel="noopener noreferrer">
                      Abrir WhatsApp e enviar
                    </a>
                    <button className="inline-button" type="button" onClick={copyMessage}>
                      Copiar mensagem
                    </button>
                    <p className="copy-status" role="status">
                      {copyStatus}
                    </p>
                  </div>
                )}
              </form>
              <aside className="estimate-result" aria-labelledby="estimate-title">
                <div className="result-topline">
                  <span>SEU CENÁRIO INICIAL</span>
                  <span className="result-corner" aria-hidden="true">
                    DRG.
                  </span>
                </div>
                <h3 id="estimate-title">Investimento estimado</h3>
                <div className="total-range" aria-live="polite" aria-atomic="true">
                  {estimate ? (
                    <>
                      <span>{formatBRL(estimate.total[0])}</span>
                      <small>a</small>
                      <span>{formatBRL(estimate.total[1])}</span>
                    </>
                  ) : (
                    <>
                      <span>Informe a área</span>
                      <small>—</small>
                    </>
                  )}
                </div>
                <p className="result-summary">
                  {estimate
                    ? `${config.types[estimate.input.type]} · ${estimate.input.area.toLocaleString("pt-BR")} m² · ${config.standards[estimate.input.standard]} · ${estimate.input.city}`
                    : "Revise os dados para gerar uma faixa de investimento."}
                </p>
                <div className="result-breakdown">
                  <div>
                    <span>Execução da obra</span>
                    <strong>{estimate ? formatRange(estimate.work) : "—"}</strong>
                  </div>
                  <div>
                    <span>Projeto</span>
                    <strong>{estimate ? formatRange(estimate.project) : "—"}</strong>
                  </div>
                  {estimate?.input.management && (
                    <div>
                      <span>Gestão de obra</span>
                      <strong>{formatRange(estimate.management)}</strong>
                    </div>
                  )}
                </div>
                <p className="estimate-label">Faixa demonstrativa para planejamento</p>
                <p className="estimate-disclaimer">
                  Valores referenciais, sujeitos à avaliação do arquiteto. A localização, os materiais e as condições do
                  imóvel podem alterar o investimento.
                </p>
                <details className="estimate-details">
                  <summary>O que esta estimativa considera?</summary>
                  <div>
                    <p>{estimate ? inclusions(estimate.input.type) : ""}</p>
                    <p>
                      Os parâmetros desta apresentação são demonstrativos. Não representam uma proposta comercial da DRG
                      ou uma cotação oficial de CUB.
                    </p>
                  </div>
                </details>
                <div className="result-bottom">
                  <span className="line-drawing" aria-hidden="true">
                    ✳
                  </span>
                  <p>
                    O número é um ponto de partida.<br />O projeto traz o contexto.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section region-section">
          <div className="container region-grid">
            <div className="reveal">
              <p className="eyebrow">PERTO DO SEU PROJETO</p>
              <h2>
                Arquitetura no litoral.<br />Atenção ao seu <em>lugar.</em>
              </h2>
            </div>
            <div className="region-copy reveal">
              <p>
                Projetos de arquitetura e interiores em Itajaí e Balneário Camboriú, com atendimento também em Itapema,
                Camboriú e Navegantes, conforme o escopo da obra.
              </p>
              <p>
                Do apartamento na Praia Brava à casa em um novo terreno, o primeiro passo é entender o imóvel, as
                condições do local e o que você precisa construir.
              </p>
              <div className="city-tags">
                {["Itajaí", "Balneário Camboriú", "Itapema", "Camboriú", "Navegantes"].map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section faq-section" id="duvidas">
          <div className="container faq-grid">
            <div className="reveal">
              <p className="eyebrow">ANTES DA PRIMEIRA CONVERSA</p>
              <h2>
                Boas perguntas.<br />Respostas <em>claras.</em>
              </h2>
              <p className="faq-intro">Cada projeto tem suas particularidades. Estas respostas ajudam você a começar.</p>
              <a className="text-link" href={wa("faq")} target="_blank" rel="noopener noreferrer">
                Tire sua dúvida com Douglas<span className="link-line"></span>
              </a>
            </div>
            <div className="faq-list reveal">
              {[
                [
                  "Quanto custa um projeto de arquitetura em Itajaí?",
                  "O valor depende da área, do escopo, das condições do imóvel e do nível de detalhamento. A calculadora apresenta uma faixa demonstrativa de obra e projeto. Para receber uma proposta do escritório, converse com o arquiteto sobre seu caso.",
                ],
                [
                  "Vocês fazem interiores e reformas em Balneário Camboriú?",
                  "A proposta da DRG inclui projetos de interiores e reformas de apartamentos e residências em Balneário Camboriú e Itajaí. Na primeira conversa, alinhamos o tipo de imóvel, os ambientes envolvidos e as entregas necessárias.",
                ],
                [
                  "O acompanhamento da obra está incluído no projeto?",
                  "Projeto e gestão de obra têm escopos próprios. O acompanhamento pode ser contratado conforme as necessidades da execução. A calculadora permite incluir ou retirar uma referência de gestão para comparar os cenários.",
                ],
                [
                  "O resultado da calculadora já é um orçamento?",
                  "É uma estimativa inicial, com parâmetros demonstrativos. Não substitui levantamento, visita técnica ou proposta comercial. O orçamento real é definido após entender o imóvel, os serviços e as escolhas do projeto.",
                ],
                [
                  "O que preciso para começar a conversa?",
                  "Conte onde está o imóvel, o que pretende fazer e a área aproximada. Se tiver planta, fotos ou referências, você pode enviá-las pelo WhatsApp. Mesmo que esteja começando a pesquisar, já podemos entender suas prioridades.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contato">
          <div className="container contact-inner reveal">
            <p className="eyebrow light">SEU PRÓXIMO ESPAÇO COMEÇA AQUI</p>
            <h2>
              Vamos tirar sua ideia<br />do <em>papel?</em>
            </h2>
            <p>Conte o que você imagina. Douglas conversa com você sobre os próximos passos.</p>
            <a className="button button-gold" href={wa("contato")} target="_blank" rel="noopener noreferrer">
              Conversar com o arquiteto{" "}
              <span className="wa-icon" aria-hidden="true">
                ◉
              </span>
            </a>
            <span className="contact-phone">WhatsApp · {phoneDisplay}</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <a className="brand footer-brand" href="#inicio" aria-label="DRG Arquitetura, início">
            <span className="brand-name">
              DRG<span className="brand-dot">.</span>
            </span>
            <span className="brand-label">ARQUITETURA</span>
          </a>
          <p>
            Arquitetura, interiores e gestão de obras.<br />Itajaí · Balneário Camboriú · Litoral de SC.
          </p>
          <div>
            <a href="#estimativa">Planeje sua obra</a>
            <button className="inline-button" type="button" onClick={() => setPrivacyOpen(true)}>
              Privacidade
            </button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} DRG Arquitetura</span>
          <span>Versão de apresentação · imagens conceituais · dados comerciais a validar</span>
        </div>
      </footer>

      <a
        className="floating-whatsapp"
        href={wa("flutuante")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar pelo WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
        </svg>
        <span>Vamos conversar</span>
      </a>

      {privacyOpen && (
        <div className="privacy-backdrop" onClick={() => setPrivacyOpen(false)}>
          <div
            className="privacy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-top">
              <p className="eyebrow">SEUS DADOS</p>
              <button className="dialog-close" type="button" aria-label="Fechar política de privacidade" onClick={() => setPrivacyOpen(false)}>
                ×
              </button>
            </div>
            <h2 id="privacy-title">
              Uma conversa<br />com <em>privacidade.</em>
            </h2>
            <p>
              O nome, o telefone opcional e as informações do projeto são utilizados para responder ao seu pedido e
              conversar sobre os serviços da DRG.
            </p>
            <p>
              Nesta versão, a página prepara a mensagem para o WhatsApp e não registra seu contato em um servidor.
            </p>
            <p>
              Ao abrir o WhatsApp, você confere e decide se envia a mensagem. O uso desse aplicativo segue as regras de
              privacidade do próprio WhatsApp.
            </p>
            <p>Esta versão não carrega ferramentas de publicidade ou medição e não salva seus dados pessoais no navegador.</p>
            <p>
              Para solicitar informações ou exclusão de um contato registrado, fale pelo WhatsApp{" "}
              <a href={waUrl("Olá! Gostaria de conversar sobre meus dados pessoais.")} target="_blank" rel="noopener noreferrer">
                {phoneDisplay}
              </a>
              .
            </p>
            <p className="privacy-version">
              Aviso da versão de apresentação · 02/10/2026. O responsável e o aviso definitivo deverão ser validados
              antes da publicação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

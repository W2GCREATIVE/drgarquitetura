import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
const mh1 = { url: "/media/MH1.webp" };
const mh2 = { url: "/media/MH2.webp" };
const mh3 = { url: "/media/MH3.webp" };
const mh4 = { url: "/media/MH4.webp" };
const mh5 = { url: "/media/MH5.webp" };
const rbc2 = { url: "/media/RBC2.webp" };
const rbc3 = { url: "/media/RBC3.webp" };
const rbc4 = { url: "/media/RBC4.webp" };
const aereaCaledonia1 = { url: "/media/Aerea_caledonia_1.webp" };
const aereaCaledonia2 = { url: "/media/Aerea_2_caledonia_1.webp" };
const ilhaBela = { url: "/media/IB.webp" };
const ilhaBelaAntes = { url: "/media/IB_antes.webp" };
const ilhaBelaDepois = { url: "/media/IB_depois.webp" };
const fachadaBs = { url: "/media/Fachada_BS.webp" };
const fachadaParigi = { url: "/media/fachada_para_predio_-_Parigi.webp" };
import "./project-gallery.css";

const photos = [
  { url: mh1.url, title: "Um respiro na rotina", caption: "Banheira junto à janela, madeira e luz natural em um espaço dedicado ao relaxamento." },
  { url: mh2.url, title: "Estar em equilíbrio", caption: "Painel de televisão com marcenaria, tons suaves e plantas que trazem vida à sala." },
  { url: mh3.url, title: "Beleza no cotidiano", caption: "Cozinha com armários planejados, bancada clara e madeira em uma composição leve e funcional." },
  { url: mh4.url, title: "Cozinha para viver", caption: "Bancada com área de preparo, coifa metálica e marcenaria que aproveita cada espaço." },
  { url: mh5.url, title: "Detalhes que acolhem", caption: "Espelho em arco, apoio em madeira e banco com armazenamento compõem um recanto cheio de personalidade." },
  { url: rbc2.url, title: "O centro dos encontros", caption: "Ilha com cooktop, coifa dourada e vegetação conectam o preparo das refeições à convivência." },
  { url: rbc3.url, title: "Conforto em cada camada", caption: "Quarto com cabeceira estofada, cortinas leves e iluminação acolhedora junto à cama." },
  { url: rbc4.url, title: "Compartilhar à mesa", caption: "Mesa redonda, cadeiras em madeira e pendente integram o jantar à cozinha iluminada." },
  { url: aereaCaledonia1.url, title: "A casa e a paisagem", caption: "Vista aérea da residência, com piscina, terraço e áreas de convívio abertas para o entorno." },
  { url: aereaCaledonia2.url, title: "Volumes e contrastes", caption: "Fachada residencial com volumes claros, revestimento escuro e jardim junto ao acesso." },
  { url: ilhaBelaAntes.url, title: "Um novo olhar · Antes", caption: "A fachada do edifício Ilha Bela antes da renovação, com sua composição e acabamentos originais." },
  { url: ilhaBelaDepois.url, title: "Um novo olhar · Depois", caption: "A fachada renovada do Ilha Bela, com nova combinação de cores e destaque para os volumes verticais." },
  { url: ilhaBela.url, title: "Uma entrada com identidade", caption: "Acesso ao Ilha Bela marcado por pilares em tom terracota, vidro e vegetação." },
  { url: fachadaBs.url, title: "Ritmo na fachada", caption: "Volumes claros e escuros, amplas esquadrias e linhas retas definem a composição do edifício." },
  { url: fachadaParigi.url, title: "Parigi ao entardecer", caption: "Perspectiva do projeto de fachada, com iluminação que valoriza os volumes, as varandas e o acesso." },
];

export function ProjectGallery() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const thumbnails = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const [navHosts, setNavHosts] = useState<HTMLElement[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState("");
  const move = (direction: number) => setIndex(value => (value + direction + photos.length) % photos.length);
  const launch = useCallback((element: HTMLElement | null, keyboard = false) => {
    trigger.current = element;
    restoreFocus.current = keyboard;
    const menu = document.getElementById("mobile-nav");
    if (menu) menu.hidden = true;
    const toggle = document.querySelector(".menu-toggle");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menu");
    setIndex(0);
    setOpen(true);
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    setNavHosts(Array.from(document.querySelectorAll<HTMLElement>("[data-portfolio-nav]")));
    const elements = Array.from(document.querySelectorAll<HTMLElement>("#conceitos .concept-visual"));
    const handleLaunch = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      launch(event.currentTarget instanceof HTMLElement ? event.currentTarget : null, event instanceof KeyboardEvent);
    };
    elements.forEach(element => {
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", "Ver mais projetos: abrir portfólio");
      element.setAttribute("aria-haspopup", "dialog");
      element.addEventListener("click", handleLaunch);
      element.addEventListener("keydown", handleLaunch);
    });
    return () => elements.forEach(element => {
      element.removeEventListener("click", handleLaunch);
      element.removeEventListener("keydown", handleLaunch);
      ["role", "tabindex", "aria-label", "aria-haspopup"].forEach(attribute => element.removeAttribute(attribute));
    });
  }, [launch]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    thumbnails.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    for (const offset of [-1, 1]) {
      const next = photos[(index + offset + photos.length) % photos.length];
      if (next) { const image = new Image(); image.src = next.url; }
    }
  }, [index, open]);

  const photo = photos[index];
  if (!photo) return null;
  return <>
    {navHosts.map((host, key) => createPortal(
      <Button variant="ghost" className="portfolio-nav-button" aria-haspopup="dialog" onClick={event => launch(event.currentTarget, event.detail === 0)}>Portfólio</Button>, host, String(key)
    ))}
    <dialog ref={dialog} className="project-gallery" aria-labelledby="gallery-title"
      onClose={() => { setOpen(false); if (restoreFocus.current) trigger.current?.focus({ preventScroll: true }); }}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      {open && <div className="gallery-layout">
        <header className="gallery-header">
          <div><p className="gallery-eyebrow">DRG ARQUITETURA</p><h2 id="gallery-title">Portfólio</h2></div>
          <Button variant="ghost" size="icon" className="gallery-control gallery-close" aria-label="Fechar galeria" title="Fechar galeria" onClick={() => dialog.current?.close()}><X /></Button>
        </header>
        <div className="project-gallery-stage">
          <Button variant="ghost" size="icon" className="gallery-control gallery-previous" aria-label="Foto anterior" title="Foto anterior" onClick={() => move(-1)}><ChevronLeft /></Button>
          <figure className="gallery-figure">
            <div className="gallery-image-space" onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => {
              const end = event.changedTouches[0]?.clientX;
              if (end !== undefined && touchStart.current !== null && Math.abs(end - touchStart.current) > 45) move(end < touchStart.current ? 1 : -1);
              touchStart.current = null;
            }}>
              {loadedUrl !== photo.url && <LoaderCircle className="gallery-loading" aria-label="Carregando foto" />}
              <img key={photo.url} className="project-gallery-photo" src={photo.url} alt={photo.caption} onLoad={() => setLoadedUrl(photo.url)} />
            </div>
            <figcaption className="gallery-caption" aria-live="polite">
              <div><h3>{photo.title}</h3><p>{photo.caption}</p></div>
              <span className="gallery-counter">{String(index + 1).padStart(2, "0")} / {photos.length}</span>
            </figcaption>
          </figure>
          <Button variant="ghost" size="icon" className="gallery-control gallery-next" aria-label="Próxima foto" title="Próxima foto" onClick={() => move(1)}><ChevronRight /></Button>
        </div>
        <div className="gallery-thumbnails" ref={thumbnails} aria-label="Selecionar foto">
          {photos.map((item, position) => <Button key={item.url} variant="ghost" className="gallery-thumbnail" aria-label={`Ver foto ${position + 1}: ${item.title}`} aria-current={position === index ? "true" : undefined} onClick={() => setIndex(position)}>
            <img src={item.url} alt="" loading="lazy" />
          </Button>)}
        </div>
      </div>}
    </dialog>
  </>;
}

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import mh1 from "@/assets/MH1.jpg.asset.json";
import mh2 from "@/assets/MH2.jpg.asset.json";
import mh3 from "@/assets/MH3.jpg.asset.json";
import mh4 from "@/assets/MH4.jpg.asset.json";
import mh5 from "@/assets/MH5.jpg.asset.json";
import rbc2 from "@/assets/RBC2.jpg.asset.json";
import rbc3 from "@/assets/RBC3.png.asset.json";
import rbc4 from "@/assets/RBC4.jpg.asset.json";
import aereaCaledonia1 from "@/assets/Aerea_caledonia_1.jpg.asset.json";
import aereaCaledonia2 from "@/assets/Aerea_2_caledonia_1.jpg.asset.json";
import ilhaBela from "@/assets/IB.jpg.asset.json";
import ilhaBelaAntes from "@/assets/IB_antes.jpg.asset.json";
import ilhaBelaDepois from "@/assets/IB_depois.jpg.asset.json";
import fachadaBs from "@/assets/Fachada_BS.jpg.asset.json";
import fachadaParigi from "@/assets/fachada_para_predio_-_Parigi.jpg.asset.json";
import "./project-gallery.css";

const photos = [
  { url: mh1.url, alt: "Banheiro com banheira e iluminação natural" },
  { url: mh2.url, alt: "Sala de estar com painel de televisão e plantas" },
  { url: mh3.url, alt: "Cozinha com bancada e armários planejados" },
  { url: mh4.url, alt: "Cozinha integrada com ilha e coifa" },
  { url: mh5.url, alt: "Detalhe de bancada e espelho em banheiro" },
  { url: rbc2.url, alt: "Ilha de cozinha com cooktop e plantas" },
  { url: rbc3.url, alt: "Quarto com luz natural e cabeceira estofada" },
  { url: rbc4.url, alt: "Cozinha e sala de jantar integradas" },
  { url: aereaCaledonia1.url, alt: "Vista aérea de casa com piscina, deck e área de lazer" },
  { url: aereaCaledonia2.url, alt: "Fachada de casa térrea com volumes brancos e revestimento geométrico" },
  { url: ilhaBelaAntes.url, alt: "Edifício residencial de quatro pavimentos antes da renovação da fachada" },
  { url: ilhaBelaDepois.url, alt: "Edifício residencial de quatro pavimentos após a renovação da fachada" },
  { url: ilhaBela.url, alt: "Entrada de edifício residencial com pilares em tom terracota" },
  { url: fachadaBs.url, alt: "Fachada de prédio contemporâneo de três pavimentos com esquadrias escuras" },
  { url: fachadaParigi.url, alt: "Projeto de fachada para o edifício Parigi em iluminação de entardecer" },
];

export function ProjectGallery() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const move = (direction: number) => setIndex(value => (value + direction + photos.length) % photos.length);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("#conceitos .concept-visual"));
    const launch = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      trigger.current = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
      setIndex(0);
      setOpen(true);
      dialog.current?.showModal();
    };
    elements.forEach(element => {
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", "Abrir galeria de projetos");
      element.setAttribute("aria-haspopup", "dialog");
      element.addEventListener("click", launch);
      element.addEventListener("keydown", launch);
    });
    return () => elements.forEach(element => {
      element.removeEventListener("click", launch);
      element.removeEventListener("keydown", launch);
      ["role", "tabindex", "aria-label", "aria-haspopup"].forEach(attribute => element.removeAttribute(attribute));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const photo = photos[index];
  if (!photo) return null;
  return (
    <dialog ref={dialog} className="project-gallery" aria-label="Galeria de projetos DRG Arquitetura"
      onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      {open && <>
        <Button variant="ghost" size="icon" className="gallery-control gallery-close" aria-label="Fechar galeria" title="Fechar galeria" onClick={() => dialog.current?.close()}><X /></Button>
        <div className="project-gallery-stage">
          <Button variant="ghost" size="icon" className="gallery-control gallery-previous" aria-label="Foto anterior" title="Foto anterior" onClick={() => move(-1)}><ChevronLeft /></Button>
          <img className="project-gallery-photo" src={photo.url} alt={photo.alt} />
          <Button variant="ghost" size="icon" className="gallery-control gallery-next" aria-label="Próxima foto" title="Próxima foto" onClick={() => move(1)}><ChevronRight /></Button>
        </div>
        <p className="gallery-counter" aria-live="polite">{index + 1} / {photos.length}</p>
      </>}
    </dialog>
  );
}
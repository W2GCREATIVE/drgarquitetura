import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import "../drg.css";
import bodyHtml from "../drg-body.html?raw";
import configJs from "../drg-legacy/config.js?raw";
import calculatorJs from "../drg-legacy/calculator.js?raw";
import appJs from "../drg-legacy/app.js?raw";

const title = "Arquiteto em Itajaí, Camboriú e Balneário Camboriú | DRG Arquitetura";
const description =
  "DRG Arquitetura: projetos de arquitetura, interiores e acompanhamento em Itajaí, Camboriú e Balneário Camboriú. Planeje seu investimento e converse com Douglas pelo WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#202822" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: "DRG Arquitetura | Itajaí, Camboriú e Balneário Camboriú" },
      { property: "og:description", content: "Arquitetura e interiores para o seu jeito de viver em Itajaí, Camboriú e Balneário Camboriú." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

let started = false;

function Index() {
  useEffect(() => {
    if (started) return;
    started = true;
    // Executa os scripts originais do site sobre o HTML já renderizado.
    for (const code of [configJs, calculatorJs, appJs]) new Function(code).call(window);
  }, []);
  return <div className="drg-site" dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}

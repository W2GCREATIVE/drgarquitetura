import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import "../drg.css";
import bodyHtml from "../drg-body.html?raw";
import configJs from "../drg-legacy/config.js?raw";
import calculatorJs from "../drg-legacy/calculator.js?raw";
import appJs from "../drg-legacy/app.js?raw";

const title = "Arquitetura de interiores em Itajaí e região | DRG Arquitetura";
const description =
  "Projetos de interiores para apartamentos, arquitetura residencial e reformas em Itajaí, Camboriú e Balneário Camboriú. Converse com o arquiteto Douglas Gerst.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#41413e" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
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

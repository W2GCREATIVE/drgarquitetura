import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ProjectGallery } from "@/components/project-gallery";
import "../drg.css";
import bodyHtml from "../drg-body.html?raw";
import configJs from "../drg-legacy/config.js?raw";
import calculatorJs from "../drg-legacy/calculator.js?raw";
import appJs from "../drg-legacy/app.js?raw";

const title = "Arquiteto em Itajaí e Balneário Camboriú | DRG Arquitetura";
const description =
  "Arquiteto em Itajaí, Camboriú e Balneário Camboriú: projetos de interiores para apartamentos, arquitetura residencial e reformas. Converse com o arquiteto Douglas Gerst.";
const siteUrl = "https://drgarquitetura.com.br/";
const shareImage = "https://drgarquitetura.com.br/media/og-image.jpg";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "DRG Arquitetura",
  url: siteUrl,
  telephone: "+55-47-98818-8417",
  image: shareImage,
  address: {
    "@type": "PostalAddress",
    streetAddress: "R. Edmundo Souza Cunha",
    addressLocality: "Itajaí",
    addressRegion: "SC",
    postalCode: "88302-265",
    addressCountry: "BR",
  },
  areaServed: ["Itajaí", "Balneário Camboriú", "Camboriú"],
  founder: { "@type": "Person", name: "Douglas Roberto Gerst", jobTitle: "Arquiteto e Urbanista" },
  sameAs: [
    "https://www.instagram.com/douglasgerstarquiteto/",
    "https://www.facebook.com/douglasgerstarquiteto",
  ],
};

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#41413e" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: shareImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: shareImage },
    ],
    links: [{ rel: "canonical", href: siteUrl }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(structuredData) }],
  }),
  component: Index,
});

let started = false;

function Index() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("drg-visit")) return;
      sessionStorage.setItem("drg-visit", "1");
    } catch {
      /* storage unavailable */
    }
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ name: "visita" }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (started) return;
    started = true;
    // Executa os scripts originais do site sobre o HTML já renderizado.
    for (const code of [configJs, calculatorJs, appJs]) new Function(code).call(window);
  }, []);
  return <div className="drg-site"><div dangerouslySetInnerHTML={{ __html: bodyHtml }} /><ProjectGallery /></div>;
}

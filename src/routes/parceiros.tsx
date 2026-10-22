import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço do site antigo que ainda recebe visitas; leva para a página inicial.
export const Route = createFileRoute("/parceiros")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});

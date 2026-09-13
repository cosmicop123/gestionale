import type { NextConfig } from "next";

// Intestazioni di sicurezza di base (§8, M10 "hardening"): non sostituiscono
// un'analisi di sicurezza dedicata, ma sono un minimo a costo zero per
// un'app self-hosted che gestisce dati personali. Niente CSP: l'app usa
// script/stili inline generati da Next/Tailwind in vari punti e una CSP
// realmente efficace richiederebbe un audit dedicato di ogni pagina, fuori
// scope qui — meglio nessuna CSP che una permissiva al punto da non
// proteggere nulla.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

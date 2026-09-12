import { redirect } from "next/navigation";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { SidebarContenuto } from "@/components/layout/sidebar-contenuto";
import { BarraSuperiore } from "@/components/layout/barra-superiore";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const utente = await richiediUtente();

  // Finché l'amministratore non ha completato il wizard di primo avvio,
  // il resto dell'applicazione resta bloccato (§2/§13 della specifica: i
  // dati dell'ente non sono mai segnaposto in produzione).
  const associazione = await prisma.associazione.findFirst();
  if (associazione && !associazione.configurazioneCompletata) {
    if (utente.ruolo === "amministratore") {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 border-r p-4 lg:block">
        <SidebarContenuto ruolo={utente.ruolo} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperiore utente={{ email: utente.email, ruolo: utente.ruolo }} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

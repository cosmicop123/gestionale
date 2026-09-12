import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { etichettaRuolo } from "@/lib/validazioni/utente";

export default async function DashboardPage() {
  const utente = await richiediUtente();
  const [associazione, annoSocialeCorrente] = await Promise.all([
    prisma.associazione.findFirst(),
    prisma.annoSociale.findFirst({ where: { chiuso: false }, orderBy: { dataInizio: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {associazione?.denominazione ?? "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Accesso come {utente.email} — {etichettaRuolo(utente.ruolo)}
          {annoSocialeCorrente ? ` · Anno sociale ${annoSocialeCorrente.etichetta}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestionale in costruzione</CardTitle>
          <CardDescription>
            Autenticazione, ruoli, anagrafica ente e utenti sono ora attivi (milestone M1). I
            riquadri con soci attivi, saldo di cassa, prossime lezioni e scadenze descritti nella
            specifica saranno collegati ai dati reali a partire dalla milestone M2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Usa il menu laterale per vedere i moduli pianificati e la milestone in cui ciascuno
          diventerà disponibile. Come amministratore puoi già gestire i dati dell&apos;ente, gli
          anni sociali e gli utenti da &quot;Amministrazione&quot;.
        </CardContent>
      </Card>
    </div>
  );
}

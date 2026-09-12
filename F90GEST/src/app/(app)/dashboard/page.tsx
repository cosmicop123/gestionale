import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Panoramica dell&apos;associazione: soci, cassa, corsi e scadenze.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestionale in costruzione</CardTitle>
          <CardDescription>
            Questa è l&apos;impalcatura dell&apos;applicazione (milestone M0): struttura
            del progetto, schema dati e layout di base. I riquadri con soci attivi,
            saldo di cassa, prossime lezioni e scadenze descritti nella specifica
            saranno collegati ai dati reali a partire dalla milestone M1.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Usa il menu laterale per vedere i moduli pianificati e la milestone in cui
          ciascuno diventerà disponibile.
        </CardContent>
      </Card>
    </div>
  );
}

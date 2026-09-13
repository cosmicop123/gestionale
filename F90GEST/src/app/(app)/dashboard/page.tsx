import Link from "next/link";
import { Users, Wallet, ReceiptText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { etichettaRuolo } from "@/lib/validazioni/utente";
import { calcolaSaldoConto } from "@/lib/contabilita/saldo";

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

function RiquadroStato({
  icona: Icona,
  etichetta,
  valore,
  dettaglio,
  href,
}: {
  icona: typeof Users;
  etichetta: string;
  valore: string;
  dettaglio?: string;
  href?: string;
}) {
  const contenuto = (
    <Card className="h-full transition-colors hover:bg-accent/40">
      <CardContent className="flex items-start gap-4 pt-6">
        <div className="rounded-lg bg-muted p-2">
          <Icona className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{etichetta}</p>
          <p className="text-2xl font-semibold tracking-tight">{valore}</p>
          {dettaglio && <p className="text-xs text-muted-foreground">{dettaglio}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{contenuto}</Link> : contenuto;
}

export default async function DashboardPage() {
  const utente = await richiediUtente();
  const [associazione, annoSocialeCorrente] = await Promise.all([
    prisma.associazione.findFirst(),
    prisma.annoSociale.findFirst({ where: { chiuso: false }, orderBy: { dataInizio: "desc" } }),
  ]);

  const sociAttivi = await prisma.socio.count({
    where: { storicoStati: { some: { stato: "attivo", dataFine: null } } },
  });

  const quoteDaIncassare = await prisma.quota.findMany({
    where: { stato: { in: ["da_pagare", "parziale"] }, deletedAt: null },
    include: { pagamenti: true },
  });
  const totaleDaIncassare = quoteDaIncassare.reduce((somma, q) => {
    const pagato = q.pagamenti.reduce((s, p) => s + Number(p.importo), 0);
    return somma + (Number(q.importo) - pagato);
  }, 0);

  let saldoComplessivo = 0;
  let entrateCommerciali = 0;
  if (annoSocialeCorrente) {
    const [saldiAnno, movimentiAnno] = await Promise.all([
      prisma.saldoContoAnno.findMany({ where: { annoSocialeId: annoSocialeCorrente.id } }),
      prisma.movimentoPrimaNota.findMany({
        where: { data: { gte: annoSocialeCorrente.dataInizio, lte: annoSocialeCorrente.dataFine } },
        select: { contoId: true, tipo: true, importo: true, ricavoCommerciale: true },
      }),
    ]);
    for (const saldoConto of saldiAnno) {
      const movimentiConto = movimentiAnno
        .filter((m) => m.contoId === saldoConto.contoId)
        .map((m) => ({ tipo: m.tipo, importo: Number(m.importo) }));
      saldoComplessivo += calcolaSaldoConto(Number(saldoConto.saldoIniziale), movimentiConto);
    }
    entrateCommerciali = movimentiAnno
      .filter((m) => m.ricavoCommerciale && m.tipo === "entrata")
      .reduce((s, m) => s + Number(m.importo), 0);
  }

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RiquadroStato icona={Users} etichetta="Soci attivi" valore={String(sociAttivi)} href="/soci" />
        <RiquadroStato
          icona={Wallet}
          etichetta="Saldo cassa + banca"
          valore={formattaEuro(saldoComplessivo)}
          href="/contabilita"
        />
        <RiquadroStato
          icona={ReceiptText}
          etichetta="Quote da incassare"
          valore={formattaEuro(totaleDaIncassare)}
          dettaglio={`${quoteDaIncassare.length} quote`}
          href="/contabilita"
        />
        <RiquadroStato
          icona={TrendingUp}
          etichetta="Entrate potenzialmente commerciali"
          valore={formattaEuro(entrateCommerciali)}
          dettaglio="Esercizio corrente — verificare con il consulente fiscale (§7.3)"
          href="/contabilita"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestionale in costruzione</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Soci, contabilità (quote, pagamenti, ricevute, prima nota) sono attivi. Corsi, eventi,
          libri sociali, documenti e comunicazioni arrivano dalle prossime milestone — vedi il
          menu laterale per lo stato di ciascun modulo.
        </CardContent>
      </Card>
    </div>
  );
}

import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { calcolaSaldoConto } from "@/lib/contabilita/saldo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabPrimaNota } from "./tab-prima-nota";
import { TabConti } from "./tab-conti";
import { TabTipiQuota } from "./tab-tipi-quota";
import { TabQuote } from "./tab-quote";
import { TabRicevute } from "./tab-ricevute";

export default async function ContabilitaPage() {
  const utente = await richiediRuolo(["amministratore", "tesoriere", "segreteria", "sola_lettura"]);
  const puoScrivere = utente.ruolo === "amministratore" || utente.ruolo === "tesoriere";

  const annoSocialeCorrente = await prisma.annoSociale.findFirst({
    where: { chiuso: false },
    orderBy: { dataInizio: "desc" },
  });

  const [conti, tipiQuota, quote, ricevute, movimenti, soci] = await Promise.all([
    prisma.conto.findMany({
      where: { deletedAt: null },
      include: { saldiAnno: annoSocialeCorrente ? { where: { annoSocialeId: annoSocialeCorrente.id } } : false },
      orderBy: { nome: "asc" },
    }),
    annoSocialeCorrente
      ? prisma.tipoQuota.findMany({
          where: { annoSocialeId: annoSocialeCorrente.id, deletedAt: null },
          orderBy: { descrizione: "asc" },
        })
      : Promise.resolve([]),
    prisma.quota.findMany({
      where: { deletedAt: null },
      include: { persona: true, tipoQuota: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.ricevuta.findMany({
      include: { intestatario: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.movimentoPrimaNota.findMany({
      include: { conto: true, controparte: true },
      orderBy: { data: "desc" },
      take: 200,
    }),
    prisma.socio.findMany({
      include: { persona: { select: { id: true, nome: true, cognome: true } } },
      orderBy: { numeroLibroSoci: "asc" },
    }),
  ]);

  // Saldo corrente = saldo iniziale dell'anno + movimenti dell'anno (§7.2).
  const movimentiPerConto = new Map<string, { tipo: string; importo: number }[]>();
  for (const m of movimenti) {
    if (
      annoSocialeCorrente &&
      m.data >= annoSocialeCorrente.dataInizio &&
      m.data <= annoSocialeCorrente.dataFine
    ) {
      const lista = movimentiPerConto.get(m.contoId) ?? [];
      lista.push({ tipo: m.tipo, importo: Number(m.importo) });
      movimentiPerConto.set(m.contoId, lista);
    }
  }

  const contiConSaldo = conti.map((conto) => {
    const saldoAnno = conto.saldiAnno[0];
    const saldoCorrente = saldoAnno
      ? calcolaSaldoConto(Number(saldoAnno.saldoIniziale), movimentiPerConto.get(conto.id) ?? [])
      : null;
    return { ...conto, saldoIniziale: saldoAnno ? Number(saldoAnno.saldoIniziale) : null, saldoCorrente };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contabilità</h1>
        <p className="text-sm text-muted-foreground">
          Prima nota, conti, quote e ricevute
          {annoSocialeCorrente ? ` — anno sociale ${annoSocialeCorrente.etichetta}` : ""}.
        </p>
      </div>

      {!annoSocialeCorrente && (
        <p className="text-sm text-destructive">
          Nessun anno sociale aperto: crearne uno da Amministrazione prima di usare la contabilità.
        </p>
      )}

      <Tabs defaultValue="prima-nota">
        <TabsList>
          <TabsTrigger value="prima-nota">Prima nota</TabsTrigger>
          <TabsTrigger value="conti">Conti</TabsTrigger>
          <TabsTrigger value="tipi-quota">Tipi di quota</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="ricevute">Ricevute</TabsTrigger>
        </TabsList>
        <TabsContent value="prima-nota">
          <TabPrimaNota movimenti={movimenti} conti={conti} puoScrivere={puoScrivere} />
        </TabsContent>
        <TabsContent value="conti">
          <TabConti conti={contiConSaldo} puoScrivere={puoScrivere} />
        </TabsContent>
        <TabsContent value="tipi-quota">
          <TabTipiQuota tipiQuota={tipiQuota} annoSocialeAperto={!!annoSocialeCorrente} puoScrivere={puoScrivere} />
        </TabsContent>
        <TabsContent value="quote">
          <TabQuote
            quote={quote}
            tipiQuota={tipiQuota}
            soci={soci.map((s) => ({ personaId: s.personaId, nome: s.persona.nome, cognome: s.persona.cognome, numeroLibroSoci: s.numeroLibroSoci }))}
            puoScrivere={puoScrivere}
          />
        </TabsContent>
        <TabsContent value="ricevute">
          <TabRicevute ricevute={ricevute} puoScrivere={puoScrivere} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

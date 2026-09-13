import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabRegistroTrattamenti } from "@/components/privacy/tab-registro-trattamenti";
import { TabRichiesteInteressato } from "@/components/privacy/tab-richieste-interessato";
import { TabConsensi } from "@/components/privacy/tab-consensi";

export default async function PrivacyPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  const [trattamenti, richieste, persone] = await Promise.all([
    prisma.registroTrattamenti.findMany({ orderBy: { nomeTrattamento: "asc" } }),
    prisma.richiestaInteressato.findMany({ include: { persona: true }, orderBy: { dataRichiesta: "desc" } }),
    prisma.persona.findMany({
      where: { deletedAt: null },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, cognome: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-sm text-muted-foreground">
          Registro dei trattamenti, richieste dell&apos;interessato e gestione dei consensi (§7.5).
        </p>
      </div>

      <Tabs defaultValue="registro">
        <TabsList>
          <TabsTrigger value="registro">Registro dei trattamenti</TabsTrigger>
          <TabsTrigger value="richieste">Richieste dell&apos;interessato</TabsTrigger>
          <TabsTrigger value="consensi">Consensi</TabsTrigger>
        </TabsList>
        <TabsContent value="registro">
          <TabRegistroTrattamenti trattamenti={trattamenti} />
        </TabsContent>
        <TabsContent value="richieste">
          <TabRichiesteInteressato richieste={richieste} persone={persone} />
        </TabsContent>
        <TabsContent value="consensi">
          <TabConsensi persone={persone} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

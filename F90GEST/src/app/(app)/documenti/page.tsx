import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabDocumenti } from "@/components/documento/tab-documenti";
import { TabProtocollo } from "@/components/documento/tab-protocollo";
import { TabTemplate } from "@/components/documento/tab-template";

export default async function DocumentiPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  const [documenti, protocolli, template] = await Promise.all([
    prisma.documento.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.protocollo.findMany({ orderBy: [{ annoRiferimento: "desc" }, { numero: "desc" }] }),
    prisma.templateDocumento.findMany({ where: { deletedAt: null }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documenti e protocollo</h1>
        <p className="text-sm text-muted-foreground">
          Archivio documenti dell&apos;associazione e registro di protocollo in entrata/uscita.
        </p>
      </div>

      <Tabs defaultValue="documenti">
        <TabsList>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
          <TabsTrigger value="protocollo">Protocollo</TabsTrigger>
          <TabsTrigger value="template">Modelli di documento</TabsTrigger>
        </TabsList>
        <TabsContent value="documenti">
          <TabDocumenti documenti={documenti} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="protocollo">
          <TabProtocollo protocolli={protocolli} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="template">
          <TabTemplate template={template} puoGestire={puoGestire} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

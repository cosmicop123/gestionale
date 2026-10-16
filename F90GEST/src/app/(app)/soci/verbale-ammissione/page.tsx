import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { EditorComunicazione } from "@/components/compilatore/editor-comunicazione";
import { salvaComunicazioneInArchivio } from "@/lib/compilatore/actions";
import { elencoConsiglioDirettivoAttuale } from "@/lib/carica-sociale/elenco";
import { costruisciBozzaVerbaleAmmissione } from "@/lib/socio/verbale-ammissione-html";

const formattatoreData = new Intl.DateTimeFormat("it-IT");

/**
 * Documento rapido e indipendente (non legato al flusso Riunioni/Delibere
 * di Libri sociali, § nota fuori milestone): un punto d'ingresso dedicato
 * nella sezione Soci che apre lo stesso editor del Compilatore già
 * precompilato con l'elenco delle domande di ammissione in attesa e la
 * firma del Consiglio Direttivo attuale, da portare come proposta alla
 * riunione del Consiglio che decide l'ammissione.
 */
export default async function VerbaleAmmissionePage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  const [domandeInAttesa, consiglioDirettivo] = await Promise.all([
    prisma.domandaAmmissione.findMany({
      where: { stato: "in_valutazione", deletedAt: null },
      include: { persona: { select: { nome: true, cognome: true, codiceFiscale: true } } },
      orderBy: { dataDomanda: "asc" },
    }),
    elencoConsiglioDirettivoAttuale(),
  ]);

  const contenutoIniziale = costruisciBozzaVerbaleAmmissione({
    neoIscritti: domandeInAttesa.map((d) => ({
      cognome: d.persona.cognome,
      nome: d.persona.nome,
      codiceFiscale: d.persona.codiceFiscale,
      categoriaProposta: d.categoriaProposta,
      dataDomanda: formattatoreData.format(d.dataDomanda),
    })),
    consiglioDirettivo: consiglioDirettivo.map((t) => ({
      ruolo: t.ruolo,
      nome: t.persona.nome,
      cognome: t.persona.cognome,
    })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verbale di proposta ammissione</h1>
        <p className="text-sm text-muted-foreground">
          Precompilato con l&apos;elenco delle {domandeInAttesa.length} domande di ammissione in attesa di valutazione
          e la firma del Consiglio Direttivo attuale. Modifica il testo liberamente prima di esportarlo: non è un
          verbale di riunione formale, resta una proposta da portare al Consiglio.
        </p>
      </div>

      <EditorComunicazione
        contenutoIniziale={contenutoIniziale}
        titoloIniziale="Proposta di ammissione nuovi soci al Consiglio Direttivo"
        categoriaIniziale="verbali"
        rotaEsportaPdf="/compilatore/genera-pdf"
        salvaInArchivio={salvaComunicazioneInArchivio}
        redirectDopoSalvataggio="/documenti"
      />
    </div>
  );
}

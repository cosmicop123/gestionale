import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Esportazione dei dati personali di una persona per una richiesta di
 * accesso (§7.5, art. 15 GDPR): un riepilogo leggibile di ciò che il
 * gestionale conserva su di lei, non un dump grezzo delle tabelle interne.
 */
export async function costruisciEsportazionePersona(personaId: string): Promise<Record<string, unknown>> {
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    include: {
      ruoli: true,
      socio: { include: { storicoStati: true, tesseramenti: true } },
      quote: { include: { pagamenti: true } },
      iscrizioniCorso: { include: { corso: { select: { titolo: true } } } },
      partecipazioniEvento: { include: { evento: { select: { titolo: true } } } },
      consensi: true,
      richiesteInteressato: true,
    },
  });
  if (!persona) return { errore: "Persona non trovata." };

  return {
    generatoIl: new Date().toISOString(),
    datiAnagrafici: {
      nome: persona.nome,
      cognome: persona.cognome,
      codiceFiscale: persona.codiceFiscale,
      dataNascita: persona.dataNascita,
      email: persona.email,
      telefono: persona.telefono,
      residenza: {
        via: persona.residenzaVia,
        cap: persona.residenzaCap,
        comune: persona.residenzaComune,
        provincia: persona.residenzaProvincia,
      },
    },
    ruoli: persona.ruoli.map((r) => ({ tipo: r.tipo, dataInizio: r.dataInizio, dataFine: r.dataFine, attivo: r.attivo })),
    socio: persona.socio
      ? {
          numeroLibroSoci: persona.socio.numeroLibroSoci,
          categoria: persona.socio.categoria,
          storicoStati: persona.socio.storicoStati.map((s) => ({ stato: s.stato, dataInizio: s.dataInizio, dataFine: s.dataFine })),
          tesseramenti: persona.socio.tesseramenti.map((t) => ({ annoSocialeId: t.annoSocialeId, numeroTessera: t.numeroTessera })),
        }
      : null,
    quote: persona.quote.map((q) => ({
      importo: q.importo.toString(),
      scadenza: q.scadenza,
      stato: q.stato,
      pagamenti: q.pagamenti.map((p) => ({ importo: p.importo.toString(), data: p.data })),
    })),
    iscrizioniCorso: persona.iscrizioniCorso.map((i) => ({ corso: i.corso.titolo, stato: i.stato, dataIscrizione: i.dataIscrizione })),
    partecipazioniEvento: persona.partecipazioniEvento.map((p) => ({ evento: p.evento.titolo, dataCheckIn: p.dataCheckIn })),
    consensi: persona.consensi.map((c) => ({ tipo: c.tipo, stato: c.stato, data: c.data, modalita: c.modalita })),
    richiesteInteressatoPrecedenti: persona.richiesteInteressato.map((r) => ({ tipo: r.tipo, dataRichiesta: r.dataRichiesta, esito: r.esito })),
  };
}

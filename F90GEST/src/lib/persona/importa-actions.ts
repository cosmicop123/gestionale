"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { prossimoNumero } from "@/lib/numeratore";
import { validaRigaImport, type RigaGrezzaImport } from "@/lib/validazioni/import-soci";

// Limiti di sicurezza per l'import (§8, "xlsx" ha vulnerabilità note in
// lettura ma il parsing avviene lato client — qui si limita comunque la
// dimensione del batch per evitare transazioni abnormemente grandi).
const MASSIMO_RIGHE_IMPORT = 2000;

export type EsitoRigaImport = {
  indiceOriginale: number;
  esito: "importata" | "scartata";
  errori: string[];
  nomeCompleto: string;
};

export type EsitoImportazione =
  | { errore: string }
  | { successo: true; importate: number; scartate: number; dettaglio: EsitoRigaImport[] };

export async function importaPersone(righeGrezze: RigaGrezzaImport[]): Promise<EsitoImportazione> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  if (righeGrezze.length === 0) {
    return { errore: "Nessuna riga da importare." };
  }
  if (righeGrezze.length > MASSIMO_RIGHE_IMPORT) {
    return { errore: `Troppe righe in un'unica importazione (massimo ${MASSIMO_RIGHE_IMPORT}).` };
  }

  // Rivalidazione server-side: non ci si fida della validazione già fatta
  // nel browser (§8), che serve solo per l'anteprima immediata all'utente.
  const righeValidate = righeGrezze.map((riga, indice) => validaRigaImport(riga, indice));

  const codiciFiscaliVisti = new Set<string>();
  const numeriLibroSociVisti = new Set<number>();
  for (const riga of righeValidate) {
    if (!riga.valida) continue;
    if (riga.dati.codiceFiscale) {
      if (codiciFiscaliVisti.has(riga.dati.codiceFiscale)) {
        riga.valida = false;
        riga.errori.push("Codice fiscale duplicato all'interno del file.");
      } else {
        codiciFiscaliVisti.add(riga.dati.codiceFiscale);
      }
    }
    if (riga.dati.numeroLibroSoci !== null) {
      if (numeriLibroSociVisti.has(riga.dati.numeroLibroSoci)) {
        riga.valida = false;
        riga.errori.push("Numero libro soci duplicato all'interno del file.");
      } else {
        numeriLibroSociVisti.add(riga.dati.numeroLibroSoci);
      }
    }
  }

  const codiciFiscaliDaControllare = righeValidate
    .filter((r) => r.valida && r.dati.codiceFiscale)
    .map((r) => r.dati.codiceFiscale as string);
  const numeriLibroSociDaControllare = righeValidate
    .filter((r) => r.valida && r.dati.numeroLibroSoci !== null)
    .map((r) => r.dati.numeroLibroSoci as number);

  const [personeEsistenti, sociEsistenti] = await Promise.all([
    codiciFiscaliDaControllare.length
      ? prisma.persona.findMany({ where: { codiceFiscale: { in: codiciFiscaliDaControllare } } })
      : Promise.resolve([]),
    numeriLibroSociDaControllare.length
      ? prisma.socio.findMany({ where: { numeroLibroSoci: { in: numeriLibroSociDaControllare } } })
      : Promise.resolve([]),
  ]);
  const codiciFiscaliEsistenti = new Set(personeEsistenti.map((p) => p.codiceFiscale));
  const numeriLibroSociEsistenti = new Set(sociEsistenti.map((s) => s.numeroLibroSoci));

  for (const riga of righeValidate) {
    if (!riga.valida) continue;
    if (riga.dati.codiceFiscale && codiciFiscaliEsistenti.has(riga.dati.codiceFiscale)) {
      riga.valida = false;
      riga.errori.push("Esiste già una persona con questo codice fiscale nel gestionale.");
    }
    if (riga.dati.numeroLibroSoci !== null && numeriLibroSociEsistenti.has(riga.dati.numeroLibroSoci)) {
      riga.valida = false;
      riga.errori.push("Numero libro soci già assegnato nel gestionale.");
    }
  }

  const righeDaImportare = righeValidate.filter((r) => r.valida);
  const dettaglio: EsitoRigaImport[] = [];

  await prisma.$transaction(async (tx) => {
    for (const riga of righeDaImportare) {
      const numeroLibroSoci = riga.dati.numeroLibroSoci ?? (await prossimoNumero(tx, "libro_soci"));

      const persona = await tx.persona.create({
        data: {
          nome: riga.dati.nome,
          cognome: riga.dati.cognome,
          codiceFiscale: riga.dati.codiceFiscale,
          dataNascita: riga.dati.dataNascita,
          email: riga.dati.email,
          telefono: riga.dati.telefono,
          createdById: utente.id,
        },
      });

      // Le date di domanda/delibera non sono tracciate nei fogli Excel
      // storici: si usa la data di decorrenza fornita come approssimazione
      // ragionevole per tutte e tre, dato che si tratta di soci già
      // esistenti e non di nuove ammissioni da deliberare.
      const socio = await tx.socio.create({
        data: {
          personaId: persona.id,
          numeroLibroSoci,
          categoria: riga.dati.categoria,
          dataDomandaAmmissione: riga.dati.dataDecorrenza,
          dataDeliberaAmmissione: riga.dati.dataDecorrenza,
          dataDecorrenza: riga.dati.dataDecorrenza,
          createdById: utente.id,
        },
      });

      await tx.socioStato.create({
        data: {
          socioId: socio.id,
          stato: "attivo",
          dataInizio: riga.dati.dataDecorrenza,
          estremiDelibera: "Importato da foglio Excel/CSV esistente",
          createdById: utente.id,
        },
      });

      dettaglio.push({
        indiceOriginale: riga.indiceOriginale,
        esito: "importata",
        errori: [],
        nomeCompleto: `${riga.dati.cognome} ${riga.dati.nome}`,
      });
    }
  });

  for (const riga of righeValidate) {
    if (riga.valida) continue;
    dettaglio.push({
      indiceOriginale: riga.indiceOriginale,
      esito: "scartata",
      errori: riga.errori,
      nomeCompleto: `${riga.dati.cognome} ${riga.dati.nome}`.trim() || `Riga ${riga.indiceOriginale + 1}`,
    });
  }
  dettaglio.sort((a, b) => a.indiceOriginale - b.indiceOriginale);

  await registraAudit({
    utenteId: utente.id,
    entita: "Persona",
    entitaId: "import-massivo",
    azione: "importazione_excel",
    diff: { importate: righeDaImportare.length, scartate: righeValidate.length - righeDaImportare.length },
  });

  revalidatePath("/soci");
  revalidatePath("/soci/libro-soci");

  return {
    successo: true,
    importate: righeDaImportare.length,
    scartate: righeValidate.length - righeDaImportare.length,
    dettaglio,
  };
}

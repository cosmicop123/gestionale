import "server-only";
import { prisma } from "@/lib/prisma";

export type RigaLibroSoci = {
  numeroLibroSoci: number;
  cognome: string;
  nome: string;
  categoria: string;
  dataDecorrenza: Date;
  stato: string;
};

/**
 * Ricostruisce il libro soci "com'era" ad una data di riferimento: per ogni
 * socio già ammesso a quella data, determina lo stato applicabile in quel
 * momento a partire dallo storico append-only di SocioStato (§7.1, §6).
 */
export async function libroSociAllaData(dataRiferimento: Date): Promise<RigaLibroSoci[]> {
  const soci = await prisma.socio.findMany({
    where: { dataDecorrenza: { lte: dataRiferimento } },
    include: {
      persona: { select: { nome: true, cognome: true } },
      storicoStati: { where: { dataInizio: { lte: dataRiferimento } }, orderBy: { dataInizio: "desc" } },
    },
    orderBy: { numeroLibroSoci: "asc" },
  });

  const righe: RigaLibroSoci[] = [];
  for (const socio of soci) {
    const statoApplicabile = socio.storicoStati[0]; // dataInizio <= riferimento, più recente
    if (!statoApplicabile) continue; // nessuno stato ancora registrato a quella data
    if (statoApplicabile.dataFine && statoApplicabile.dataFine <= dataRiferimento) continue;

    righe.push({
      numeroLibroSoci: socio.numeroLibroSoci,
      cognome: socio.persona.cognome,
      nome: socio.persona.nome,
      categoria: socio.categoria,
      dataDecorrenza: socio.dataDecorrenza,
      stato: statoApplicabile.stato,
    });
  }

  return righe;
}

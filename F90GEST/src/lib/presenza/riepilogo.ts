import "server-only";
import { prisma } from "@/lib/prisma";
import { calcolaPresenze, type EsitoCalcoloPresenze } from "./calcolo-presenze";

/**
 * Calcola ore frequentate e percentuale di presenza di un'iscrizione su
 * tutte le lezioni del corso (§6 M4), non solo quelle per cui esiste già una
 * riga Presenza: una lezione "svolta" senza presenza rilevata conta come non
 * frequentata (vedi `calcolaPresenze`), non viene semplicemente ignorata.
 */
export async function calcolaRiepilogoPresenzeIscrizione(iscrizioneId: string): Promise<EsitoCalcoloPresenze> {
  const iscrizione = await prisma.iscrizioneCorso.findUniqueOrThrow({
    where: { id: iscrizioneId },
    select: { corsoId: true },
  });

  const [lezioni, presenze] = await Promise.all([
    prisma.lezione.findMany({
      where: { corsoId: iscrizione.corsoId, deletedAt: null },
      select: { id: true, durataOre: true, stato: true },
    }),
    prisma.presenza.findMany({
      where: { iscrizioneId },
      select: { lezioneId: true, stato: true },
    }),
  ]);

  const presenzaPerLezione = new Map(presenze.map((p) => [p.lezioneId, p.stato]));

  return calcolaPresenze(
    lezioni.map((l) => ({
      durataOre: Number(l.durataOre),
      statoLezione: l.stato,
      statoPresenza: presenzaPerLezione.get(l.id) ?? null,
    }))
  );
}

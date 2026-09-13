"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaEmissioneTessera, type DatiEmissioneTessera } from "@/lib/validazioni/tesseramento";

export type EsitoEmissioneTessera = { errore: string } | { successo: true; tesseramentoId: string };

export async function emettiTessera(datiGrezzi: DatiEmissioneTessera): Promise<EsitoEmissioneTessera> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaEmissioneTessera.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const [socio, annoSociale] = await Promise.all([
    prisma.socio.findUnique({ where: { id: dati.socioId } }),
    prisma.annoSociale.findUnique({ where: { id: dati.annoSocialeId } }),
  ]);
  if (!socio) return { errore: "Socio non trovato." };
  if (!annoSociale) return { errore: "Anno sociale non trovato." };
  if (annoSociale.chiuso) return { errore: "Non è possibile emettere tessere per un anno sociale chiuso." };

  try {
    const tesseramento = await prisma.tesseramento.create({
      data: {
        socioId: socio.id,
        annoSocialeId: annoSociale.id,
        // Numero leggibile e comunque univoco: <numero libro soci>/<anno sociale>.
        numeroTessera: `${String(socio.numeroLibroSoci).padStart(4, "0")}/${annoSociale.etichetta}`,
        dataEmissione: new Date(),
        canale: "sportello",
        createdById: utente.id,
      },
    });

    await registraAudit({
      utenteId: utente.id,
      entita: "Tesseramento",
      entitaId: tesseramento.id,
      azione: "emissione",
    });

    revalidatePath(`/soci/${socio.personaId}`);
    return { successo: true, tesseramentoId: tesseramento.id };
  } catch (errore) {
    if (errore instanceof Prisma.PrismaClientKnownRequestError && errore.code === "P2002") {
      return { errore: "Il socio ha già un tesseramento per questo anno sociale." };
    }
    throw errore;
  }
}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import argon2 from "argon2";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Credenziali del primo amministratore: da cambiare subito al primo accesso.
// Il wizard di primo avvio (milestone M1) guiderà la personalizzazione
// dell'anagrafica ente e la creazione di un utente amministratore reale.
const ADMIN_EMAIL = "admin@example.org";
const ADMIN_PASSWORD_INIZIALE = "CambiaSubito!2026";

async function main() {
  const associazioneEsistente = await prisma.associazione.findFirst();
  if (!associazioneEsistente) {
    await prisma.associazione.create({
      data: {
        // Dati generici segnaposto: l'ente è mono-istanza e questi valori
        // vanno personalizzati dal wizard di primo avvio (§2 della specifica).
        denominazione: "Nuova Associazione",
        codiceFiscale: "00000000000",
        sedeLegaleVia: "Via da definire, 1",
        sedeLegaleCap: "00000",
        sedeLegaleComune: "Da definire",
        sedeLegaleProvincia: "XX",
        regimeFiscale: "Da definire — verificare con il proprio consulente fiscale",
        configurazioneCompletata: false,
      },
    });
    console.log("Creata Associazione segnaposto (da personalizzare al primo avvio).");
  }

  const oggi = new Date();
  const annoCorrente = oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1;
  const etichettaAnno = `${annoCorrente}/${annoCorrente + 1}`;
  const annoSocialeEsistente = await prisma.annoSociale.findUnique({
    where: { etichetta: etichettaAnno },
  });
  if (!annoSocialeEsistente) {
    await prisma.annoSociale.create({
      data: {
        etichetta: etichettaAnno,
        dataInizio: new Date(`${annoCorrente}-09-01`),
        dataFine: new Date(`${annoCorrente + 1}-08-31`),
      },
    });
    console.log(`Creato AnnoSociale ${etichettaAnno}.`);
  }

  const adminEsistente = await prisma.utente.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!adminEsistente) {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD_INIZIALE);
    await prisma.utente.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        ruolo: "amministratore",
      },
    });
    console.log("Creato utente amministratore iniziale:");
    console.log(`  email:    ${ADMIN_EMAIL}`);
    console.log(`  password: ${ADMIN_PASSWORD_INIZIALE}  (da cambiare subito al primo accesso)`);
  }

  // Parametri di base non hardcoded nel codice (§3.4 della specifica).
  const parametriDefault: Array<{ chiave: string; valore: string; descrizione: string }> = [
    {
      chiave: "contabilita.soglia_bollo_euro",
      valore: "77.47",
      descrizione: "Soglia oltre la quale è dovuta l'imposta di bollo sulle ricevute (art. 13 tariffa DPR 642/1972).",
    },
    {
      chiave: "contabilita.importo_bollo_euro",
      valore: "2.00",
      descrizione: "Importo dell'imposta di bollo applicata quando dovuta.",
    },
    {
      chiave: "contabilita.soglia_giustificativo_obbligatorio_euro",
      valore: "100.00",
      descrizione: "Soglia oltre la quale è obbligatorio un allegato giustificativo (o motivazione) per le uscite di prima nota.",
    },
    {
      chiave: "contabilita.rendiconto_forma_aggregata",
      valore: "true",
      descrizione: "Se true, il rendiconto per cassa è redatto in forma aggregata (enti con entrate sotto i 60.000 €).",
    },
    {
      chiave: "contabilita.nature_fiscali_soggette_a_bollo",
      valore: '["corrispettivo_specifico","attivita_commerciale"]',
      descrizione:
        "Elenco (JSON) delle nature fiscali per cui si applica il bollo oltre soglia. Proposta di default: verificare con il proprio consulente fiscale.",
    },
    {
      chiave: "corsi.percentuale_minima_presenza_default",
      valore: "70",
      descrizione: "Percentuale minima di presenza di default per l'emissione dell'attestato di un nuovo corso.",
    },
  ];

  for (const parametro of parametriDefault) {
    await prisma.parametro.upsert({
      where: { chiave: parametro.chiave },
      update: {},
      create: parametro,
    });
  }
  console.log(`Verificati/creati ${parametriDefault.length} parametri di base.`);

  // Numeratori delle numerazioni progressive obbligatorie (§7.1, §7.4, §6, §5.4).
  const numeratoriDefault: Array<{ entita: string; annoRiferimento: number | null }> = [
    { entita: "ricevuta", annoRiferimento: oggi.getFullYear() },
    { entita: "protocollo_entrata", annoRiferimento: oggi.getFullYear() },
    { entita: "protocollo_uscita", annoRiferimento: oggi.getFullYear() },
    { entita: "libro_soci", annoRiferimento: null },
    { entita: "attestato", annoRiferimento: null },
    { entita: "riunione_assemblea", annoRiferimento: null },
    { entita: "riunione_direttivo", annoRiferimento: null },
  ];

  // Nota: l'indice composto (entita, annoRiferimento) su Prisma/SQLite non
  // accetta null nella where clause di un upsert, quindi per i numeratori
  // non annuali si usa un find-then-create esplicito.
  for (const numeratore of numeratoriDefault) {
    const esistente = await prisma.numeratore.findFirst({
      where: { entita: numeratore.entita, annoRiferimento: numeratore.annoRiferimento },
    });
    if (!esistente) {
      await prisma.numeratore.create({ data: numeratore });
    }
  }
  console.log(`Verificati/creati ${numeratoriDefault.length} numeratori.`);
}

main()
  .catch((errore) => {
    console.error(errore);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

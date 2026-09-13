import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { validaArchivioBackup, NOME_FILE_DATABASE_NELLO_ZIP } from "./archivio";

describe("validaArchivioBackup", () => {
  it("accetta un archivio con il file del database", () => {
    const zip = new AdmZip();
    zip.addFile(NOME_FILE_DATABASE_NELLO_ZIP, Buffer.from("contenuto finto del database"));
    expect(validaArchivioBackup(zip)).toEqual({ valido: true });
  });

  it("rifiuta un archivio senza il file del database", () => {
    const zip = new AdmZip();
    zip.addFile("altro-file.txt", Buffer.from("non è un backup"));
    const esito = validaArchivioBackup(zip);
    expect(esito.valido).toBe(false);
  });

  it("rifiuta un archivio con percorsi di path traversal", () => {
    // AdmZip#addFile normalizza da solo i ".." iniziali: per simulare uno ZIP
    // creato con un altro strumento (l'unico scenario realistico di un file
    // caricato da un utente) si forza il nome della voce direttamente,
    // verificando che sopravviva a un giro di scrittura/lettura reale.
    const zip = new AdmZip();
    zip.addFile(NOME_FILE_DATABASE_NELLO_ZIP, Buffer.from("contenuto finto"));
    zip.addFile("legittimo.txt", Buffer.from("tentativo malevolo")).entryName = "../../etc/passwd";
    const zipRiletto = new AdmZip(zip.toBuffer());
    const esito = validaArchivioBackup(zipRiletto);
    expect(esito.valido).toBe(false);
  });
});

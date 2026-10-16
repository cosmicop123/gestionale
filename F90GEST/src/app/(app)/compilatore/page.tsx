import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { EditorComunicazione } from "@/components/compilatore/editor-comunicazione";
import { salvaComunicazioneInArchivio } from "@/lib/compilatore/actions";

export default async function CompilatorePage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compilatore</h1>
        <p className="text-sm text-muted-foreground">
          Scrivi e formatta una comunicazione (lettera, avviso, circolare...) ed esportala in PDF, oppure salvala
          nell&apos;archivio documenti.
        </p>
      </div>

      <EditorComunicazione rotaEsportaPdf="/compilatore/genera-pdf" salvaInArchivio={salvaComunicazioneInArchivio} />
    </div>
  );
}

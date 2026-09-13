"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ottieniDatiRendiconto } from "@/lib/rendiconto/dati";
import {
  CATEGORIE_RENDICONTO_ENTRATA,
  CATEGORIE_RENDICONTO_USCITA,
  ETICHETTE_CATEGORIE_RENDICONTO,
  SEZIONI_MODELLO_D,
  ETICHETTE_SEZIONI_MODELLO_D,
} from "@/lib/validazioni/contabilita";
import { aggiornaMappaturaRendiconto, impostaFormaRendiconto } from "@/lib/rendiconto/actions";

type DatiRendicontoAnno = Awaited<ReturnType<typeof ottieniDatiRendiconto>>;

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

type Sezione = (typeof SEZIONI_MODELLO_D)[number];

function DialogMappatura({ mappaturaIniziale }: { mappaturaIniziale: Record<string, string> }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [inAttesa, setInAttesa] = useState(false);
  const [mappatura, setMappatura] = useState(mappaturaIniziale as Record<string, Sezione>);
  const tutteLeCategorie = [...CATEGORIE_RENDICONTO_ENTRATA, ...CATEGORIE_RENDICONTO_USCITA];

  async function onSalva() {
    setInAttesa(true);
    const esito = await aggiornaMappaturaRendiconto(mappatura);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Mappatura aggiornata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings /> Mappatura categorie → sezioni
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mappatura categorie di prima nota sulle sezioni del rendiconto</DialogTitle>
          <DialogDescription>
            Decide a quale sezione (A-E) del Mod. D appartiene ciascuna categoria. È una scelta
            dell&apos;associazione: verificare con il proprio consulente prima di approvare il rendiconto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {tutteLeCategorie.map((categoria) => (
            <div key={categoria} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-normal">{ETICHETTE_CATEGORIE_RENDICONTO[categoria]}</Label>
              <Select
                value={mappatura[categoria]}
                onValueChange={(v) => setMappatura((prec) => ({ ...prec, [categoria]: v as Sezione }))}
              >
                <SelectTrigger className="w-40" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEZIONI_MODELLO_D.map((sezione) => (
                    <SelectItem key={sezione} value={sezione}>
                      {sezione}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onSalva} disabled={inAttesa}>
            {inAttesa && <Loader2 className="animate-spin" />}
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TabRendiconto({
  dati,
  puoScrivere,
}: {
  dati: DatiRendicontoAnno[];
  puoScrivere: boolean;
}) {
  const router = useRouter();
  const [annoSocialeId, setAnnoSocialeId] = useState(dati[0]?.annoSociale.id ?? "");
  const [cambioFormaInCorso, setCambioFormaInCorso] = useState(false);
  const selezionato = dati.find((d) => d.annoSociale.id === annoSocialeId);

  async function onCambiaForma(formaAggregata: boolean) {
    setCambioFormaInCorso(true);
    const esito = await impostaFormaRendiconto(formaAggregata);
    setCambioFormaInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  if (dati.length === 0 || !selezionato) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Nessun anno sociale presente: crearne uno da Amministrazione per generare un rendiconto.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={annoSocialeId} onValueChange={setAnnoSocialeId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dati.map((d) => (
              <SelectItem key={d.annoSociale.id} value={d.annoSociale.id}>
                {d.annoSociale.etichetta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          {puoScrivere && <DialogMappatura mappaturaIniziale={selezionato.mappaturaCategorieRendiconto} />}
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/contabilita/rendiconto/${selezionato.annoSociale.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download /> PDF
            </a>
          </Button>
        </div>
      </div>

      {puoScrivere && (
        <label className="flex items-center gap-2">
          <Checkbox
            checked={selezionato.formaAggregata}
            disabled={cambioFormaInCorso}
            onCheckedChange={(v) => onCambiaForma(v === true)}
          />
          <span className="text-sm">
            Rendiconto in forma aggregata (senza dettaglio per categoria — per enti con entrate fino a 60.000 €)
          </span>
        </label>
      )}

      {selezionato.rendiconto.categorieNonMappate.length > 0 && (
        <p className="text-sm text-destructive">
          Categorie senza sezione assegnata (incluse nei totali ma non nelle sezioni A-E):{" "}
          {selezionato.rendiconto.categorieNonMappate
            .map((c) => ETICHETTE_CATEGORIE_RENDICONTO[c] ?? c)
            .join(", ")}
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avanzo/disavanzo di esercizio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totale entrate</span>
              <span>{formattaEuro(selezionato.rendiconto.totaleEntrate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totale uscite</span>
              <span>{formattaEuro(selezionato.rendiconto.totaleUscite)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Avanzo/disavanzo</span>
              <span>{formattaEuro(selezionato.rendiconto.avanzoDisavanzo)}</span>
            </div>
            <div className="mt-2 flex justify-between text-muted-foreground">
              <span>Cassa e banca a inizio periodo</span>
              <span>{formattaEuro(selezionato.saldoInizialeComplessivo)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cassa e banca a fine periodo</span>
              <span>{formattaEuro(selezionato.saldoFinaleComplessivo)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrate potenzialmente commerciali (§7.3)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Su totale entrate</span>
              <span>
                {formattaEuro(selezionato.entrateCommerciali)} di {formattaEuro(selezionato.rendiconto.totaleEntrate)}
              </span>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              Solo un&apos;esposizione dei movimenti già segnati come potenzialmente commerciali in base alla
              natura fiscale scelta al momento della registrazione: la qualificazione fiscale definitiva resta di
              competenza dell&apos;associazione e del proprio consulente.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {selezionato.rendiconto.sezioni.map((sezione) => (
          <Card key={sezione.sezione}>
            <CardHeader>
              <CardTitle className="text-sm">{ETICHETTE_SEZIONI_MODELLO_D[sezione.sezione]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {!selezionato.formaAggregata &&
                sezione.dettaglioEntrate.map((riga) => (
                  <div key={`e-${riga.categoria}`} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Entrate — {ETICHETTE_CATEGORIE_RENDICONTO[riga.categoria] ?? riga.categoria}
                    </span>
                    <span>{formattaEuro(riga.importo)}</span>
                  </div>
                ))}
              {!selezionato.formaAggregata &&
                sezione.dettaglioUscite.map((riga) => (
                  <div key={`u-${riga.categoria}`} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Uscite — {ETICHETTE_CATEGORIE_RENDICONTO[riga.categoria] ?? riga.categoria}
                    </span>
                    <span>{formattaEuro(riga.importo)}</span>
                  </div>
                ))}
              {selezionato.formaAggregata && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Totale entrate</span>
                    <span>{formattaEuro(sezione.entrate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Totale uscite</span>
                    <span>{formattaEuro(sezione.uscite)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Avanzo/disavanzo sezione</span>
                <span>{formattaEuro(sezione.avanzo)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

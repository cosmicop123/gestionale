import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { libroSociAllaData } from "@/lib/socio/libro-soci";
import { ETICHETTE_CATEGORIE_SOCIO } from "@/lib/validazioni/socio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VARIANTE_PER_STATO: Record<string, "success" | "warning" | "secondary" | "outline"> = {
  attivo: "success",
  in_attesa: "warning",
  sospeso: "secondary",
  cessato: "outline",
};

export default async function LibroSociPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { data } = await searchParams;
  const dataRiferimento = data ? new Date(data) : new Date();
  const dataRiferimentoIso = dataRiferimento.toISOString().slice(0, 10);

  const righe = await libroSociAllaData(dataRiferimento);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Libro soci</h1>
        <p className="text-sm text-muted-foreground">
          Registro dinamico: mostra chi risultava socio alla data scelta (§7.1).
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data di riferimento</Label>
              <Input id="data" type="date" name="data" defaultValue={dataRiferimentoIso} />
            </div>
            <Button type="submit" variant="outline">
              Aggiorna
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" asChild>
                <a href={`/soci/libro-soci/export?data=${dataRiferimentoIso}&formato=csv`}>
                  Esporta CSV
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/soci/libro-soci/export?data=${dataRiferimentoIso}&formato=xlsx`}>
                  Esporta XLSX
                </a>
              </Button>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N.</TableHead>
                <TableHead>Cognome e nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Socio dal</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {righe.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessun socio risulta iscritto a questa data.
                  </TableCell>
                </TableRow>
              )}
              {righe.map((riga) => (
                <TableRow key={riga.numeroLibroSoci}>
                  <TableCell>{riga.numeroLibroSoci}</TableCell>
                  <TableCell className="font-medium">
                    {riga.cognome} {riga.nome}
                  </TableCell>
                  <TableCell>
                    {ETICHETTE_CATEGORIE_SOCIO[riga.categoria as keyof typeof ETICHETTE_CATEGORIE_SOCIO] ??
                      riga.categoria}
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("it-IT").format(riga.dataDecorrenza)}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANTE_PER_STATO[riga.stato] ?? "outline"}>{riga.stato}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

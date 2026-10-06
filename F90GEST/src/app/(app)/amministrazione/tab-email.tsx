"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Plug, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  schemaCasellaEmail,
  TIPI_CASELLA_EMAIL,
  ETICHETTE_TIPI_CASELLA_EMAIL,
  LIVELLI_SICUREZZA_EMAIL,
  ETICHETTE_SICUREZZA_EMAIL,
  type DatiCasellaEmail,
} from "@/lib/validazioni/casella-email";
import {
  creaCasellaEmail,
  modificaCasellaEmail,
  eliminaCasellaEmail,
  testaConnessioneCasella,
  sincronizzaCasellaEmail,
} from "@/lib/casella-email/actions";

export type CasellaEmailRiga = {
  id: string;
  tipo: string;
  etichetta: string;
  indirizzoEmail: string;
  smtpHost: string;
  smtpPorta: number;
  smtpSicurezza: string;
  smtpUtente: string;
  imapHost: string;
  imapPorta: number;
  imapSicurezza: string;
  imapUtente: string;
  attiva: boolean;
  ultimaSincImap: string | null;
};

const VALORI_VUOTI: DatiCasellaEmail = {
  tipo: "ordinaria",
  etichetta: "",
  indirizzoEmail: "",
  smtpHost: "",
  smtpPorta: "587",
  smtpSicurezza: "starttls",
  smtpUtente: "",
  smtpPassword: "",
  imapHost: "",
  imapPorta: "993",
  imapSicurezza: "tls",
  imapUtente: "",
  imapPassword: "",
  attiva: true,
};

function DialogCasella({ casella }: { casella?: CasellaEmailRiga }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DatiCasellaEmail>({
    resolver: zodResolver(schemaCasellaEmail),
    defaultValues: casella
      ? {
          tipo: casella.tipo as DatiCasellaEmail["tipo"],
          etichetta: casella.etichetta,
          indirizzoEmail: casella.indirizzoEmail,
          smtpHost: casella.smtpHost,
          smtpPorta: String(casella.smtpPorta),
          smtpSicurezza: casella.smtpSicurezza as DatiCasellaEmail["smtpSicurezza"],
          smtpUtente: casella.smtpUtente,
          smtpPassword: "",
          imapHost: casella.imapHost,
          imapPorta: String(casella.imapPorta),
          imapSicurezza: casella.imapSicurezza as DatiCasellaEmail["imapSicurezza"],
          imapUtente: casella.imapUtente,
          imapPassword: "",
          attiva: casella.attiva,
        }
      : VALORI_VUOTI,
  });

  async function onSubmit(dati: DatiCasellaEmail) {
    const esito = casella ? await modificaCasellaEmail(casella.id, dati) : await creaCasellaEmail(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(casella ? "Casella aggiornata." : "Casella creata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        {casella ? (
          <Button variant="ghost" size="icon">
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Nuova casella
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{casella ? "Modifica casella email" : "Nuova casella email"}</DialogTitle>
          <DialogDescription>
            Per lasciare invariata una password già salvata, lascia il relativo campo vuoto.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo di casella</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPI_CASELLA_EMAIL.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ETICHETTE_TIPI_CASELLA_EMAIL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etichetta">Nome descrittivo</Label>
              <Input id="etichetta" {...register("etichetta")} />
              {errors.etichetta && <p className="text-sm text-destructive">{errors.etichetta.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="indirizzoEmail">Indirizzo email</Label>
            <Input id="indirizzoEmail" type="email" {...register("indirizzoEmail")} />
            {errors.indirizzoEmail && <p className="text-sm text-destructive">{errors.indirizzoEmail.message}</p>}
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium">Invio (SMTP)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Host</Label>
                <Input id="smtpHost" {...register("smtpHost")} />
                {errors.smtpHost && <p className="text-sm text-destructive">{errors.smtpHost.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPorta">Porta</Label>
                <Input id="smtpPorta" type="number" {...register("smtpPorta")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpSicurezza">Sicurezza</Label>
                <Controller
                  control={control}
                  name="smtpSicurezza"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="smtpSicurezza" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIVELLI_SICUREZZA_EMAIL.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ETICHETTE_SICUREZZA_EMAIL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUtente">Utente</Label>
                <Input id="smtpUtente" {...register("smtpUtente")} />
                {errors.smtpUtente && <p className="text-sm text-destructive">{errors.smtpUtente.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="smtpPassword">Password</Label>
                <Input id="smtpPassword" type="password" placeholder={casella ? "••••••••" : ""} {...register("smtpPassword")} />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium">Ricezione (IMAP)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="imapHost">Host</Label>
                <Input id="imapHost" {...register("imapHost")} />
                {errors.imapHost && <p className="text-sm text-destructive">{errors.imapHost.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapPorta">Porta</Label>
                <Input id="imapPorta" type="number" {...register("imapPorta")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapSicurezza">Sicurezza</Label>
                <Controller
                  control={control}
                  name="imapSicurezza"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="imapSicurezza" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIVELLI_SICUREZZA_EMAIL.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ETICHETTE_SICUREZZA_EMAIL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapUtente">Utente</Label>
                <Input id="imapUtente" {...register("imapUtente")} />
                {errors.imapUtente && <p className="text-sm text-destructive">{errors.imapUtente.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="imapPassword">Password</Label>
                <Input id="imapPassword" type="password" placeholder={casella ? "••••••••" : ""} {...register("imapPassword")} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <Controller
              control={control}
              name="attiva"
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )}
            />
            <span className="text-sm font-medium">
              Casella attiva (usata per inviare le comunicazioni, se del tipo &quot;ordinaria&quot;)
            </span>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabEmail({ caselle }: { caselle: CasellaEmailRiga[] }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState<string | null>(null);

  async function onTesta(casellaId: string) {
    setInAttesa(casellaId);
    const esito = await testaConnessioneCasella(casellaId);
    setInAttesa(null);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    if (esito.smtp.ok && esito.imap.ok) {
      toast.success("Connessione SMTP e IMAP riuscite.");
    } else {
      const dettagli = [
        !esito.smtp.ok && `SMTP: ${esito.smtp.errore}`,
        !esito.imap.ok && `IMAP: ${esito.imap.errore}`,
      ]
        .filter(Boolean)
        .join(" — ");
      toast.error(`Connessione non riuscita. ${dettagli}`);
    }
  }

  async function onSincronizza(casellaId: string) {
    setInAttesa(casellaId);
    const esito = await sincronizzaCasellaEmail(casellaId);
    setInAttesa(null);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(esito.nuovi > 0 ? `Scaricati ${esito.nuovi} nuovi messaggi.` : "Nessun nuovo messaggio.");
    router.refresh();
  }

  async function onElimina(casellaId: string) {
    const esito = await eliminaCasellaEmail(casellaId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Configura qui le caselle email (ordinarie e PEC) con cui il gestionale può inviare le comunicazioni del
          modulo omonimo e scaricare la posta in arrivo (consultabile da Comunicazioni → Posta in arrivo).
        </p>
        <div className="flex justify-end">
          <DialogCasella />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Indirizzo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Ultima sincronizzazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caselle.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nessuna casella email configurata.
                </TableCell>
              </TableRow>
            )}
            {caselle.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Badge variant={c.tipo === "pec" ? "default" : "outline"}>
                    {ETICHETTE_TIPI_CASELLA_EMAIL[c.tipo as keyof typeof ETICHETTE_TIPI_CASELLA_EMAIL] ?? c.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{c.etichetta}</TableCell>
                <TableCell>{c.indirizzoEmail}</TableCell>
                <TableCell>
                  <Badge variant={c.attiva ? "default" : "outline"}>{c.attiva ? "Attiva" : "Disattivata"}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.ultimaSincImap ? new Date(c.ultimaSincImap).toLocaleString("it-IT") : "mai"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Verifica connessione"
                      disabled={inAttesa === c.id}
                      onClick={() => onTesta(c.id)}
                    >
                      {inAttesa === c.id ? <Loader2 className="animate-spin" /> : <Plug />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sincronizza posta in arrivo"
                      disabled={inAttesa === c.id}
                      onClick={() => onSincronizza(c.id)}
                    >
                      <RefreshCw />
                    </Button>
                    <DialogCasella casella={c} />
                    <Button variant="ghost" size="icon" onClick={() => onElimina(c.id)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

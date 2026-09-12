"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, KeyRound, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Utente } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RUOLI_APPLICATIVI,
  etichettaRuolo,
  schemaNuovoUtente,
  schemaModificaUtente,
  schemaResetPassword,
  type DatiNuovoUtente,
  type DatiModificaUtente,
} from "@/lib/validazioni/utente";
import { creaUtente, modificaUtente, resettaPasswordUtente } from "@/lib/utenti/actions";

function formattaDataOra(data: Date | null): string {
  if (!data) return "Mai";
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(data)
  );
}

function FormNuovoUtente({ onCreato }: { onCreato: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DatiNuovoUtente>({
    resolver: zodResolver(schemaNuovoUtente),
    defaultValues: { email: "", ruolo: "segreteria", password: "" },
  });

  async function onSubmit(dati: DatiNuovoUtente) {
    const esito = await creaUtente(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Utente creato.");
    reset();
    onCreato();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="nuovo-email">Email</Label>
        <Input id="nuovo-email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nuovo-ruolo">Ruolo</Label>
        <Controller
          control={control}
          name="ruolo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="nuovo-ruolo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RUOLI_APPLICATIVI.map((ruolo) => (
                  <SelectItem key={ruolo} value={ruolo}>
                    {etichettaRuolo(ruolo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nuovo-password">Password iniziale</Label>
        <Input id="nuovo-password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Comunicarla all&apos;utente fuori dal gestionale: gli verrà chiesto di conservarla con cura.
        </p>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Crea utente
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormModificaUtente({ utente, onSalvato }: { utente: Utente; onSalvato: () => void }) {
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<DatiModificaUtente>({
    resolver: zodResolver(schemaModificaUtente),
    defaultValues: { ruolo: utente.ruolo as DatiModificaUtente["ruolo"], attivo: utente.attivo },
  });

  async function onSubmit(dati: DatiModificaUtente) {
    const esito = await modificaUtente(utente.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Utente aggiornato.");
    onSalvato();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="modifica-ruolo">Ruolo</Label>
        <Controller
          control={control}
          name="ruolo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="modifica-ruolo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RUOLI_APPLICATIVI.map((ruolo) => (
                  <SelectItem key={ruolo} value={ruolo}>
                    {etichettaRuolo(ruolo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="attivo"
          render={({ field }) => (
            <Checkbox
              id="modifica-attivo"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
          )}
        />
        <Label htmlFor="modifica-attivo">Utente attivo (può accedere al gestionale)</Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Salva
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormResetPassword({ utente, onFatto }: { utente: Utente; onFatto: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string }>({ resolver: zodResolver(schemaResetPassword) });

  async function onSubmit(dati: { password: string }) {
    const esito = await resettaPasswordUtente(utente.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Password aggiornata. Le sessioni aperte di questo utente sono state chiuse.");
    onFatto();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="reset-password">Nuova password</Label>
        <Input id="reset-password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Reimposta password
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TabUtenti({
  utenti,
  emailUtenteCorrente,
}: {
  utenti: Utente[];
  emailUtenteCorrente: string;
}) {
  const [dialogNuovoAperto, setDialogNuovoAperto] = useState(false);
  const [utenteInModifica, setUtenteInModifica] = useState<Utente | null>(null);
  const [utenteInResetPassword, setUtenteInResetPassword] = useState<Utente | null>(null);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Chi può accedere al gestionale e con quale ruolo.
          </p>
          <Dialog open={dialogNuovoAperto} onOpenChange={setDialogNuovoAperto}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Nuovo utente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo utente</DialogTitle>
                <DialogDescription>
                  Crea un accesso per un membro del direttivo o un docente.
                </DialogDescription>
              </DialogHeader>
              <FormNuovoUtente onCreato={() => setDialogNuovoAperto(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Ultimo accesso</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utenti.map((utente) => (
              <TableRow key={utente.id}>
                <TableCell className="font-medium">
                  {utente.email}
                  {utente.email === emailUtenteCorrente && (
                    <span className="ml-2 text-xs text-muted-foreground">(tu)</span>
                  )}
                </TableCell>
                <TableCell>{etichettaRuolo(utente.ruolo)}</TableCell>
                <TableCell>
                  {utente.attivo ? (
                    <Badge variant="success">Attivo</Badge>
                  ) : (
                    <Badge variant="secondary">Sospeso</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formattaDataOra(utente.ultimoAccesso)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setUtenteInModifica(utente)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUtenteInResetPassword(utente)}
                  >
                    <KeyRound />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!utenteInModifica} onOpenChange={(aperto) => !aperto && setUtenteInModifica(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica utente</DialogTitle>
            <DialogDescription>{utenteInModifica?.email}</DialogDescription>
          </DialogHeader>
          {utenteInModifica && (
            <FormModificaUtente
              utente={utenteInModifica}
              onSalvato={() => setUtenteInModifica(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!utenteInResetPassword}
        onOpenChange={(aperto) => !aperto && setUtenteInResetPassword(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reimposta password</DialogTitle>
            <DialogDescription>{utenteInResetPassword?.email}</DialogDescription>
          </DialogHeader>
          {utenteInResetPassword && (
            <FormResetPassword
              utente={utenteInResetPassword}
              onFatto={() => setUtenteInResetPassword(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

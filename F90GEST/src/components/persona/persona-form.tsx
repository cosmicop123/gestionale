"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { schemaPersona, type DatiPersona } from "@/lib/validazioni/persona";
import { isMinorenne } from "@/lib/persona/eta";
import { creaPersona, aggiornaPersona } from "@/lib/persona/actions";

type ProprietaPersonaForm = {
  personaId?: string;
  valoriIniziali?: Partial<DatiPersona>;
};

const VALORI_VUOTI: DatiPersona = {
  nome: "",
  cognome: "",
  codiceFiscale: "",
  dataNascita: "",
  comuneNascita: "",
  provinciaNascita: "",
  sesso: undefined,
  residenzaVia: "",
  residenzaCap: "",
  residenzaComune: "",
  residenzaProvincia: "",
  email: "",
  telefono: "",
  note: "",
  genitore: undefined,
};

export function PersonaForm({ personaId, valoriIniziali }: ProprietaPersonaForm) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DatiPersona>({
    resolver: zodResolver(schemaPersona),
    defaultValues: { ...VALORI_VUOTI, ...valoriIniziali },
  });

  const dataNascita = useWatch({ control, name: "dataNascita" });
  const mostraCampiGenitore = !!dataNascita && isMinorenne(new Date(dataNascita));

  async function onSubmit(dati: DatiPersona) {
    setInAttesa(true);
    try {
      const esito = personaId
        ? await aggiornaPersona(personaId, dati)
        : await creaPersona(dati);
      if ("errore" in esito) {
        toast.error(esito.errore);
        return;
      }
      toast.success(personaId ? "Dati aggiornati." : "Persona creata.");
      router.push(`/soci/${esito.personaId}`);
      router.refresh();
    } catch {
      toast.error("Errore imprevisto. Riprova.");
    } finally {
      setInAttesa(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Dati anagrafici</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cognome">Cognome *</Label>
            <Input id="cognome" {...register("cognome")} />
            {errors.cognome && <p className="text-sm text-destructive">{errors.cognome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codiceFiscale">Codice fiscale *</Label>
            <Input id="codiceFiscale" maxLength={16} className="uppercase" {...register("codiceFiscale")} />
            {errors.codiceFiscale && (
              <p className="text-sm text-destructive">{errors.codiceFiscale.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataNascita">Data di nascita</Label>
            <Input id="dataNascita" type="date" {...register("dataNascita")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comuneNascita">Comune di nascita</Label>
            <Input id="comuneNascita" {...register("comuneNascita")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provinciaNascita">Provincia di nascita</Label>
            <Input id="provinciaNascita" maxLength={2} {...register("provinciaNascita")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sesso">Sesso</Label>
            <Controller
              control={control}
              name="sesso"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="sesso" className="w-full">
                    <SelectValue placeholder="Non specificato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Residenza</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="residenzaVia">Indirizzo</Label>
            <Input id="residenzaVia" {...register("residenzaVia")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residenzaCap">CAP</Label>
            <Input id="residenzaCap" maxLength={5} {...register("residenzaCap")} />
            {errors.residenzaCap && (
              <p className="text-sm text-destructive">{errors.residenzaCap.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="residenzaComune">Comune</Label>
            <Input id="residenzaComune" {...register("residenzaComune")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residenzaProvincia">Provincia</Label>
            <Input id="residenzaProvincia" maxLength={2} {...register("residenzaProvincia")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Contatti</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input id="telefono" {...register("telefono")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" rows={3} {...register("note")} />
        </div>
      </section>

      {mostraCampiGenitore && (
        <section className="space-y-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
          <h2 className="text-sm font-semibold">
            Esercente la responsabilità genitoriale (persona minorenne)
          </h2>
          <p className="text-xs text-muted-foreground">
            Obbligatorio per i minorenni (§7.5): dati di almeno un genitore o tutore.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="genitore.genitoreNomeCognome">Nome e cognome *</Label>
              <Input id="genitore.genitoreNomeCognome" {...register("genitore.genitoreNomeCognome")} />
              {errors.genitore?.genitoreNomeCognome && (
                <p className="text-sm text-destructive">
                  {errors.genitore.genitoreNomeCognome.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="genitore.genitoreCodiceFiscale">Codice fiscale</Label>
              <Input id="genitore.genitoreCodiceFiscale" {...register("genitore.genitoreCodiceFiscale")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genitore.gradoParentela">Grado di parentela</Label>
              <Controller
                control={control}
                name="genitore.gradoParentela"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="genitore.gradoParentela" className="w-full">
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="genitore">Genitore</SelectItem>
                      <SelectItem value="tutore">Tutore</SelectItem>
                      <SelectItem value="altro_esercente">Altro esercente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genitore.genitoreEmail">Email</Label>
              <Input id="genitore.genitoreEmail" type="email" {...register("genitore.genitoreEmail")} />
              {errors.genitore?.genitoreEmail && (
                <p className="text-sm text-destructive">{errors.genitore.genitoreEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="genitore.genitoreTelefono">Telefono</Label>
              <Input id="genitore.genitoreTelefono" {...register("genitore.genitoreTelefono")} />
            </div>
          </div>
        </section>
      )}
      {errors.genitore && !errors.genitore.genitoreNomeCognome && (
        <p className="text-sm text-destructive">{errors.genitore.message as string}</p>
      )}

      <Button type="submit" disabled={inAttesa}>
        {inAttesa && <Loader2 className="animate-spin" />}
        {personaId ? "Salva modifiche" : "Crea persona"}
      </Button>
    </form>
  );
}

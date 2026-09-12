"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unstable_rethrow } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { schemaAccesso, type DatiAccesso } from "@/lib/validazioni/autenticazione";
import { accedi } from "./actions";

export function LoginForm() {
  const [inAttesa, setInAttesa] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatiAccesso>({
    resolver: zodResolver(schemaAccesso),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(dati: DatiAccesso) {
    setInAttesa(true);
    try {
      const esito = await accedi(dati);
      if ("errore" in esito) {
        setError("root", { message: esito.errore });
        toast.error(esito.errore);
      }
    } catch (errore) {
      // redirect() lancia un errore speciale gestito dal framework: va
      // sempre rilanciato, mai trattato come un vero errore applicativo.
      unstable_rethrow(errore);
      toast.error("Errore imprevisto durante l'accesso. Riprova.");
    } finally {
      setInAttesa(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="nome.cognome@esempio.it"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={inAttesa}>
            {inAttesa && <Loader2 className="animate-spin" />}
            Accedi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

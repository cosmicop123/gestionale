"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { schemaAccesso, type DatiAccesso } from "@/lib/validazioni/autenticazione";

export function LoginForm() {
  const [inAttesa, setInAttesa] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatiAccesso>({
    resolver: zodResolver(schemaAccesso),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit() {
    // L'autenticazione vera e propria (verifica argon2, creazione sessione
    // httpOnly) è prevista nella milestone M1: qui esiste solo la UI.
    setInAttesa(true);
    await new Promise((r) => setTimeout(r, 400));
    setInAttesa(false);
    toast.info("Accesso non ancora attivo", {
      description: "L'autenticazione sarà disponibile dalla milestone M1.",
    });
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
          <Button type="submit" className="w-full" disabled={inAttesa}>
            {inAttesa && <Loader2 className="animate-spin" />}
            Accedi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

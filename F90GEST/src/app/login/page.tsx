import { redirect } from "next/navigation";
import { ottieniUtenteCorrente } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Verifica reale (non solo presenza del cookie): se la sessione è valida
  // non ha senso mostrare di nuovo il form di accesso.
  const utente = await ottieniUtenteCorrente();
  if (utente) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">F90GEST</h1>
          <p className="text-sm text-muted-foreground">
            Gestionale dell&apos;associazione — accedi con le tue credenziali
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          Problemi di accesso? Contatta l&apos;amministratore del gestionale.
        </p>
      </div>
    </div>
  );
}

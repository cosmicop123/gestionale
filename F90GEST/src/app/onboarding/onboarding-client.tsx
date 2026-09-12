"use client";

import { useRouter } from "next/navigation";
import { EnteForm } from "@/components/ente/ente-form";
import type { DatiEnte } from "@/lib/validazioni/ente";

export function OnboardingClient({ valoriIniziali }: { valoriIniziali: DatiEnte }) {
  const router = useRouter();

  return (
    <EnteForm
      valoriIniziali={valoriIniziali}
      segnaConfigurazioneCompletata
      testoBottone="Completa la configurazione"
      onSalvato={() => {
        router.push("/dashboard");
        router.refresh();
      }}
    />
  );
}

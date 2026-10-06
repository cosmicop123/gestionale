"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnteForm } from "@/components/ente/ente-form";
import { LogoUpload } from "@/components/ente/logo-upload";
import type { DatiEnte } from "@/lib/validazioni/ente";

export function TabEnte({
  valoriIniziali,
  logoAllegatoId,
}: {
  valoriIniziali: DatiEnte;
  logoAllegatoId: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoUpload logoAllegatoId={logoAllegatoId} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <EnteForm valoriIniziali={valoriIniziali} testoBottone="Salva modifiche" />
        </CardContent>
      </Card>
    </div>
  );
}

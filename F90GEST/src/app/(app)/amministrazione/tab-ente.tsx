"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnteForm } from "@/components/ente/ente-form";
import { LogoUpload } from "@/components/ente/logo-upload";
import { FirmaUpload } from "@/components/ente/firma-upload";
import type { DatiEnte } from "@/lib/validazioni/ente";

export function TabEnte({
  valoriIniziali,
  logoAllegatoId,
  firmaPresidenteAllegatoId,
}: {
  valoriIniziali: DatiEnte;
  logoAllegatoId: string | null;
  firmaPresidenteAllegatoId: string | null;
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
        <CardHeader>
          <CardTitle className="text-base">Firma del Presidente</CardTitle>
        </CardHeader>
        <CardContent>
          <FirmaUpload firmaAllegatoId={firmaPresidenteAllegatoId} />
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

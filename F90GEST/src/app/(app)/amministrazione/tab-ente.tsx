"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EnteForm } from "@/components/ente/ente-form";
import type { DatiEnte } from "@/lib/validazioni/ente";

export function TabEnte({ valoriIniziali }: { valoriIniziali: DatiEnte }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <EnteForm valoriIniziali={valoriIniziali} testoBottone="Salva modifiche" />
      </CardContent>
    </Card>
  );
}

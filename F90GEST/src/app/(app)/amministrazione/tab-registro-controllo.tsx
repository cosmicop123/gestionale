"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type VoceAudit = {
  id: string;
  timestamp: Date;
  entita: string;
  entitaId: string;
  azione: string;
  ip: string | null;
  utente: { email: string } | null;
};

export function TabRegistroControllo({ voci }: { voci: VoceAudit[] }) {
  const [filtro, setFiltro] = useState("");

  const vociFiltrate = useMemo(() => {
    const termine = filtro.trim().toLowerCase();
    if (!termine) return voci;
    return voci.filter((v) =>
      [v.entita, v.entitaId, v.azione, v.utente?.email ?? ""].some((campo) => campo.toLowerCase().includes(termine))
    );
  }, [voci, filtro]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Ultime {voci.length} voci del registro di controllo (append-only, §7 — nessuna voce qui può essere
          cancellata o modificata).
        </p>
        <Input
          placeholder="Filtra per entità, azione o utente..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-sm"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e ora</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead>Entità</TableHead>
              <TableHead>Azione</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vociFiltrate.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessuna voce trovata.
                </TableCell>
              </TableRow>
            )}
            {vociFiltrate.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "medium" }).format(v.timestamp)}
                </TableCell>
                <TableCell>{v.utente?.email ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {v.entita} <span className="text-muted-foreground">({v.entitaId})</span>
                </TableCell>
                <TableCell>{v.azione}</TableCell>
                <TableCell className="text-muted-foreground">{v.ip ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

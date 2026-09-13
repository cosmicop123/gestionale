"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { vociNavigazione } from "./moduli-navigazione";

export function SidebarContenuto({
  onNavigate,
  ruolo,
}: {
  onNavigate?: () => void;
  /** Ruolo dell'utente corrente: nasconde le voci riservate ad altri ruoli (§6). */
  ruolo?: string;
}) {
  const pathname = usePathname();
  const voci = vociNavigazione.filter((voce) => !voce.soloRuoli || !ruolo || voce.soloRuoli.includes(ruolo));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2 px-2 py-1">
        <Landmark className="size-6 shrink-0" />
        <span className="font-semibold tracking-tight">F90GEST</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {voci.map((voce) => {
          const Icona = voce.icona;
          const selezionata = pathname === voce.href || pathname.startsWith(`${voce.href}/`);

          if (!voce.attivo) {
            return (
              <div
                key={voce.href}
                title={`Disponibile dalla milestone ${voce.disponibileDaMilestone}`}
                className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              >
                <Icona className="size-4 shrink-0" />
                <span className="flex-1">{voce.titolo}</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground/60">
                  {voce.disponibileDaMilestone}
                </Badge>
              </div>
            );
          }

          return (
            <Link
              key={voce.href}
              href={voce.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                selezionata && "bg-accent text-accent-foreground"
              )}
            >
              <Icona className="size-4 shrink-0" />
              {voce.titolo}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

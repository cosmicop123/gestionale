import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  GraduationCap,
  PartyPopper,
  BookMarked,
  FolderArchive,
  Mail,
  ShieldCheck,
  Settings,
} from "lucide-react";

export type VoceNavigazione = {
  titolo: string;
  href: string;
  icona: LucideIcon;
  /** Milestone in cui il modulo diventa disponibile: finché non è raggiunta il link è disabilitato. */
  disponibileDaMilestone: string;
  attivo: boolean;
  /** Se presente, la voce è visibile solo a questi ruoli (§6 tabella permessi). Assente = visibile a tutti i ruoli attivi. */
  soloRuoli?: string[];
};

// Struttura di navigazione dei moduli funzionali (§6 della specifica). Solo
// la Dashboard è collegata a una pagina reale in M0; gli altri compaiono
// disabilitati con l'indicazione della milestone che li introduce, per non
// generare link rotti verso pagine non ancora esistenti.
export const vociNavigazione: VoceNavigazione[] = [
  { titolo: "Dashboard", href: "/dashboard", icona: LayoutDashboard, disponibileDaMilestone: "M1", attivo: true },
  { titolo: "Soci e tesseramenti", href: "/soci", icona: Users, disponibileDaMilestone: "M2", attivo: true, soloRuoli: ["amministratore", "segreteria", "tesoriere", "sola_lettura"] },
  { titolo: "Contabilità", href: "/contabilita", icona: Wallet, disponibileDaMilestone: "M3", attivo: true, soloRuoli: ["amministratore", "tesoriere", "segreteria", "sola_lettura"] },
  { titolo: "Corsi", href: "/corsi", icona: GraduationCap, disponibileDaMilestone: "M4", attivo: true, soloRuoli: ["amministratore", "segreteria", "docente", "sola_lettura"] },
  { titolo: "Eventi", href: "/eventi", icona: PartyPopper, disponibileDaMilestone: "M7", attivo: true, soloRuoli: ["amministratore", "segreteria", "tesoriere", "sola_lettura"] },
  { titolo: "Libri sociali", href: "/libri-sociali", icona: BookMarked, disponibileDaMilestone: "M8", attivo: true, soloRuoli: ["amministratore", "segreteria", "tesoriere", "sola_lettura"] },
  { titolo: "Documenti e protocollo", href: "/documenti", icona: FolderArchive, disponibileDaMilestone: "M8", attivo: true, soloRuoli: ["amministratore", "segreteria", "tesoriere", "sola_lettura"] },
  { titolo: "Comunicazioni", href: "/comunicazioni", icona: Mail, disponibileDaMilestone: "M9", attivo: false },
  { titolo: "Privacy", href: "/privacy", icona: ShieldCheck, disponibileDaMilestone: "M9", attivo: false },
  { titolo: "Amministrazione", href: "/amministrazione", icona: Settings, disponibileDaMilestone: "M1", attivo: true, soloRuoli: ["amministratore"] },
];

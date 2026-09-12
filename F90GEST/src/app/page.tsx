import { redirect } from "next/navigation";
import { ottieniUtenteCorrente } from "@/lib/auth/session";

export default async function RootPage() {
  const utente = await ottieniUtenteCorrente();
  redirect(utente ? "/dashboard" : "/login");
}

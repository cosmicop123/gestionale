import { redirect } from "next/navigation";

export default function RootPage() {
  // L'autenticazione (M1) deciderà se rimandare a /login o /dashboard in
  // base alla sessione. Per ora la home rimanda sempre al login.
  redirect("/login");
}

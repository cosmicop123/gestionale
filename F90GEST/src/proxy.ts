import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NOME_COOKIE_SESSIONE } from "@/lib/auth/cookie-nome";

// Verifica solo ottimistica (presenza del cookie), MAI una query al DB: il
// proxy gira anche sulle richieste di prefetch e su ogni rotta del progetto.
// La validazione reale della sessione (utente attivo, sessione non scaduta)
// avviene sempre lato server in `richiediUtente`/`richiediRuolo`, che
// restano l'unico controllo di autorizzazione su cui si può fare
// affidamento (§8: mai fidarsi solo del routing).
//
// Nota: qui si reindirizza solo l'assenza di cookie su rotta protetta. Il
// caso opposto (cookie presente ma sessione invalida/scaduta, su /login)
// è gestito dalla pagina di login stessa con una verifica reale sul DB:
// farlo qui, sulla sola presenza del cookie, creerebbe un loop di redirect
// tra /login e /dashboard quando il cookie è scaduto lato server ma non
// ancora cancellato lato client.
// "/iscrizione" (§6 M5) è la pagina pubblica di iscrizione ai corsi: nessun
// accesso richiesto, dati sensibili raccolti lì (consensi, dati di minori)
// gestiti interamente da server action con propria validazione e rate
// limiting, mai dal solo routing (§8).
const ROTTE_PUBBLICHE = ["/login", "/iscrizione"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const haCookieSessione = request.cookies.has(NOME_COOKIE_SESSIONE);
  const ePubblica = ROTTE_PUBBLICHE.some((rotta) => pathname.startsWith(rotta));

  if (!haCookieSessione && !ePubblica) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

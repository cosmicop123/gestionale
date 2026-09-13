import { NextResponse } from "next/server";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { templateSitoPubblicoValido } from "@/lib/validazioni/sito-pubblico";
import { generaAnteprimaSitoPubblico } from "@/lib/sito-pubblico/genera";

export async function GET(request: Request) {
  await richiediRuolo(["amministratore"]);

  const template = new URL(request.url).searchParams.get("template") ?? "";
  if (!templateSitoPubblicoValido(template)) {
    return NextResponse.json({ errore: "Template non valido." }, { status: 400 });
  }

  const html = await generaAnteprimaSitoPubblico(template);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

import { describe, expect, it } from "vitest";
import { escapeHtml, escapeHtmlConACapo } from "./escape-html";

describe("escapeHtml", () => {
  it("escapa i caratteri speciali HTML", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'test'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;test&#39;"
    );
  });

  it("lascia invariato un testo senza caratteri speciali", () => {
    expect(escapeHtml("Corso di pittura")).toBe("Corso di pittura");
  });
});

describe("escapeHtmlConACapo", () => {
  it("converte gli a-capo in <br> dopo l'escape", () => {
    expect(escapeHtmlConACapo("Riga 1\nRiga <2>")).toBe("Riga 1<br>Riga &lt;2&gt;");
  });
});

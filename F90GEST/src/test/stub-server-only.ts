// Stub per i test: "server-only" lancia volutamente un errore quando
// importato fuori dal bundler di Next.js (che lo neutralizza lato server).
// Sotto Vitest usiamo questo alias per poter testare direttamente la logica
// di moduli server-only pura (es. rate limiting) senza dover passare da un
// mock dell'intero modulo.
export {};

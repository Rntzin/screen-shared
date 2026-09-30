const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1 pra evitar confusão

export function gerarCodigo(tamanho = 6): string {
  let codigo = "";
  for (let i = 0; i < tamanho; i++) {
    codigo += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return codigo;
}

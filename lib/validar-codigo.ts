export function validarCodigo(codigo: string): boolean {
  return /^[A-Z0-9]{1,10}$/i.test(codigo);
}

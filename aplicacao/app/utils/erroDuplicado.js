export function constraintDuplicada(err) {
  return String(err?.constraint || "").toLowerCase();
}

export function ehDuplicadoDe(err, campo) {
  return constraintDuplicada(err).includes(campo);
}

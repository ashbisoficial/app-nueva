/**
 * Nombre completo mostrable de una Persona (sección 3.2): nombres + apellidos.
 * Compatible hacia atrás con Personas creadas antes de separar ambos campos
 * (que solo tienen el `nombre` legado, de un único campo de texto).
 */
export function nombreCompleto(p: { nombres?: string; apellidos?: string; nombre?: string }): string {
  const completo = [p.nombres, p.apellidos]
    .filter((parte) => !!parte?.trim())
    .join(' ')
    .trim();
  return completo || p.nombre?.trim() || '';
}

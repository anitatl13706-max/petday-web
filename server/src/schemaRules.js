/** Read-only, conservative check of package names in the PostgreSQL booking CHECK definition.
 * It is diagnostic only: no data or schema is changed. */
export function missingServiceNames(constraintDefinition, serviceNames) {
  const definition = String(constraintDefinition || '');
  return [...serviceNames].filter(name => !definition.includes("'" + name.replaceAll("'", "''") + "'"));
}

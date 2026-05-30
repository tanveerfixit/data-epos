/**
 * Safely build a display name for a customer, stripping out literal "null" strings.
 * Priority: first_name + last_name → name → 'Unknown'
 */
export function safeCustomerName(customer: {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
}): string {
  // Try first_name + last_name first
  const first = stripNull(customer.first_name);
  const last = stripNull(customer.last_name);
  if (first || last) {
    return `${first} ${last}`.trim();
  }
  // Fall back to name field
  const name = stripNull(customer.name);
  return name || 'Unknown';
}

/**
 * Strip literal "null" strings and trim whitespace
 */
function stripNull(val: string | null | undefined): string {
  if (val === null || val === undefined) return '';
  // Remove literal word "null" (case-insensitive, whole word)
  return val.replace(/\bnull\b/gi, '').trim();
}

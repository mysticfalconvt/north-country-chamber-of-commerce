/**
 * HTML escape utility for preventing XSS in email templates
 *
 * This escapes HTML special characters to prevent injection attacks
 * when user-provided content is embedded in HTML email templates.
 */

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escape HTML special characters in a string
 * @param str - The string to escape
 * @returns The escaped string safe for HTML embedding
 */
export function escapeHtml(str: string): string {
  if (!str) return ''
  return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Escape for use in HTML attributes (more restrictive)
 * @param str - The string to escape
 * @returns The escaped string safe for HTML attribute values
 */
export function escapeHtmlAttribute(str: string): string {
  if (!str) return ''
  return escapeHtml(str).replace(/`/g, '&#96;')
}

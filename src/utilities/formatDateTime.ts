export const formatDateTime = (timestamp: string, locale: 'en' | 'fr' = 'en'): string => {
  const now = new Date()
  let date = now
  if (timestamp) date = new Date(timestamp)
  const months = date.getMonth()
  const days = date.getDate()

  const MM = months + 1 < 10 ? `0${months + 1}` : months + 1
  const DD = days < 10 ? `0${days}` : days
  const YYYY = date.getFullYear()

  // French uses DD/MM/YYYY format, English uses MM/DD/YYYY
  if (locale === 'fr') {
    return `${DD}/${MM}/${YYYY}`
  }
  return `${MM}/${DD}/${YYYY}`
}

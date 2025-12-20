import type { Access } from 'payload'

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false

  if (user.role === 'admin') return true

  return user.id === id
}

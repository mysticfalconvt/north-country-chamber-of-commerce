import type { Access } from 'payload'

export const chamberStaffOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin' || user.role === 'chamber_staff'
}

import type { Access } from 'payload'

/**
 * Restricts admin panel access to only admin and chamber_staff roles.
 * Business members should not have access to the admin panel.
 */
export const adminPanelAccess: Access = ({ req: { user } }) => {
  return user?.role === 'admin' || user?.role === 'chamber_staff'
}

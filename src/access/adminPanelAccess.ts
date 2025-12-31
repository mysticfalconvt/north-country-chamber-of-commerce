import type { AccessArgs } from 'payload'

/**
 * Restricts admin panel access to only admin and chamber_staff roles.
 * Business members should not have access to the admin panel.
 */
export const adminPanelAccess = ({ req: { user } }: AccessArgs): boolean => {
  return user?.role === 'admin' || user?.role === 'chamber_staff'
}

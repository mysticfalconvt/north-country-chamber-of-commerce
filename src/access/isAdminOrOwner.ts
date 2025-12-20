import type { Access } from 'payload'

// For business members to update their own business
export const isAdminOrOwner: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.role === 'admin' || user.role === 'chamber_staff') {
    return true
  }

  // If business_member, filter to only their business
  if (user.role === 'business_member' && user.business) {
    return {
      id: {
        equals: user.business,
      },
    }
  }

  return false
}

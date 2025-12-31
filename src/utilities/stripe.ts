import Stripe from 'stripe'

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

/**
 * Create a Stripe Checkout session for membership payment
 */
export async function createCheckoutSession({
  businessId,
  businessName,
  tier,
  amount,
  userId,
  successUrl,
  cancelUrl,
}: {
  businessId: string
  businessName: string
  tier: string
  amount: number
  userId?: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
            description: `Annual membership for ${businessName}`,
          },
          unit_amount: Math.round(amount * 100), // Convert dollars to cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      businessId,
      tier,
      userId: userId || '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'required',
  })

  return session
}

/**
 * Retrieve a Stripe customer
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer as Stripe.Customer
  } catch (error) {
    console.error(`Failed to retrieve customer ${customerId}:`, error)
    return null
  }
}

/**
 * Create or update Stripe customer
 */
export async function createOrUpdateCustomer({
  email,
  name,
  metadata,
}: {
  email: string
  name: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    // Update existing customer
    const customer = await stripe.customers.update(existingCustomers.data[0].id, {
      name,
      metadata,
    })
    return customer
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  })

  return customer
}

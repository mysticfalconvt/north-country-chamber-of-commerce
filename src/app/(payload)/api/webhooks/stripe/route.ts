import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendWelcomeEmail } from '@/utilities/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Disable body parsing for this route - Stripe needs raw body
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      payload.logger.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      payload.logger.error(`Webhook signature verification failed: ${err}`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    payload.logger.info(`Received Stripe webhook: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        payload.logger.info('Processing checkout.session.completed event')

        // Get metadata from the checkout session
        const businessId = session.metadata?.businessId
        const tier = session.metadata?.tier

        payload.logger.info(`Metadata - businessId: ${businessId}, tier: ${tier}`)

        if (!businessId || !tier) {
          payload.logger.error('Missing metadata in checkout session')
          break
        }

        // Validate businessId is a valid number
        const businessIdNum = parseInt(businessId, 10)
        if (isNaN(businessIdNum)) {
          payload.logger.error(`Invalid businessId in checkout session: ${businessId}`)
          break
        }

        payload.logger.info(`Creating membership for business ${businessIdNum}, tier ${tier}`)

        // Calculate membership dates (1 year from today)
        const startDate = new Date()
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)

        // Create membership record - we need to await it to ensure it completes
        // The afterChange hook updating the business is what's slow
        try {
          payload.logger.info('Starting membership creation...')
          const membership = await payload.create({
            collection: 'memberships',
            data: {
              business: businessIdNum,
              tier: tier,
              amount: session.amount_total ? session.amount_total / 100 : 0, // Convert cents to dollars
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              paymentStatus: 'paid',
              autoRenew: false,
              paymentMethod: 'stripe',
              stripeCustomerId: session.customer as string,
              stripeInvoiceId: session.invoice as string,
              invoiceUrl: session.invoice as string, // You can get actual invoice URL if needed
            },
          })

          payload.logger.info(`✓ Created membership ${membership.id} for business ${businessId}`)

          // Update the business with the new membership tier and expiration
          await payload.update({
            collection: 'businesses',
            id: businessIdNum,
            data: {
              membershipTier: tier,
              membershipExpires: endDate.toISOString(),
              membershipStatus: 'active',
            },
          })

          payload.logger.info(`✓ Updated business ${businessId} with membership tier ${tier}`)

          // Get the business to check if it has an owner
          const business = await payload.findByID({
            collection: 'businesses',
            id: businessIdNum,
          })

          // Create user account if one doesn't exist
          if (!business.owner && business.email) {
            try {
              // Generate a temporary password
              const tempPassword =
                Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

              // Create the user
              const newUser = await payload.create({
                collection: 'users',
                data: {
                  email: business.email,
                  password: tempPassword,
                  name: business.name,
                  role: 'business_member',
                  business: businessIdNum,
                },
              })

              // Update business with owner
              await payload.update({
                collection: 'businesses',
                id: businessIdNum,
                data: {
                  owner: newUser.id,
                },
              })

              payload.logger.info(`✓ Created user account ${newUser.id} for business ${businessId}`)

              // Send welcome email with temporary password
              try {
                await sendWelcomeEmail({
                  to: business.email,
                  businessName: business.name,
                  tempPassword,
                })
                payload.logger.info(`✓ Sent welcome email to ${business.email}`)
              } catch (emailError) {
                payload.logger.error(`Failed to send welcome email: ${emailError}`)
                // Still log the password in case email fails
                payload.logger.info(`Temporary password for ${business.email}: ${tempPassword}`)
              }
            } catch (error) {
              payload.logger.error(`Failed to create user account: ${error}`)
            }
          }
        } catch (error) {
          payload.logger.error(`✗ Failed to create membership: ${error}`)
          if (error instanceof Error) {
            payload.logger.error(`Error stack: ${error.stack}`)
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        payload.logger.error(
          `Payment failed for ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`,
        )
        // Handle failed payment (send email notification, etc.)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // For future subscription support
        const subscription = event.data.object as Stripe.Subscription
        payload.logger.info(`Subscription ${event.type}: ${subscription.id}`)
        break
      }

      default:
        payload.logger.info(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    payload.logger.error(`Webhook error: ${error}`)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

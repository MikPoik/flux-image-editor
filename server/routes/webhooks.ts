import type { Express } from "express";
import { storage } from "../storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function setupWebhookRoutes(app: Express) {
  // Stripe webhook endpoint for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // You'll need to set STRIPE_WEBHOOK_SECRET in your environment
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);

        // Update billing period for subscription-related payments
        if ((invoice as any).subscription) {
          try {
            const user = await storage.getUserBySubscriptionId((invoice as any).subscription as string);
            if (user) {
              // Get subscription to get the current period
              const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);

              // Get billing period timestamps from subscription items (primary source)
              let periodStartTimestamp = null;
              let periodEndTimestamp = null;

              if (subscription.items?.data?.[0]) {
                const firstItem = subscription.items.data[0];
                periodStartTimestamp = firstItem.current_period_start;
                periodEndTimestamp = firstItem.current_period_end;
              }

              // Fallback to root subscription if items don't have the fields
              if (!periodStartTimestamp || !periodEndTimestamp) {
                periodStartTimestamp = (subscription as any).current_period_start || periodStartTimestamp;
                periodEndTimestamp = (subscription as any).current_period_end || periodEndTimestamp;
              }

              // Final fallback: use invoice period if subscription doesn't have billing period
              if (!periodStartTimestamp || !periodEndTimestamp) {
                periodStartTimestamp = invoice.period_start || periodStartTimestamp;
                periodEndTimestamp = invoice.period_end || periodEndTimestamp;
              }

              // Only update billing period if we have valid timestamps
              if (periodStartTimestamp && periodEndTimestamp && 
                  typeof periodStartTimestamp === 'number' && 
                  typeof periodEndTimestamp === 'number' &&
                  periodStartTimestamp > 0 && periodEndTimestamp > 0) {
                try {
                  const periodStart = new Date(periodStartTimestamp * 1000);
                  const periodEnd = new Date(periodEndTimestamp * 1000);

                  // Validate the dates are actually valid
                  if (!isNaN(periodStart.getTime()) && !isNaN(periodEnd.getTime()) && 
                      periodStart.getTime() > 0 && periodEnd.getTime() > 0) {
                    await storage.updateUserBillingPeriod(user.id, periodStart, periodEnd);
                    console.log(`Billing period updated for user ${user.id} on payment success`);
                    
                    // Always refresh credits on successful payment (new billing period)
                    await storage.refreshCredits(user.id);
                  } else {
                    await storage.refreshCredits(user.id);
                  }
                } catch (error) {
                  console.error(`Billing period update failed for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown error');
                  await storage.refreshCredits(user.id);
                }
              } else {
                await storage.refreshCredits(user.id);
              }
            }
          } catch (error) {
            console.error('Error processing invoice payment:', error instanceof Error ? error.message : 'Unknown error');
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);

        try {
          // Get user by customer ID - we need to implement this method
          const user = await storage.getUserByCustomerId(subscription.customer as string);
          if (user) {
            // Determine subscription tier based on price
            const price = subscription.items.data[0]?.price;
            let tier = 'basic';

            if (price?.id === process.env.VITE_STRIPE_PRICE_1499) {
              tier = 'premium-plus';
            } else if (price?.id === process.env.VITE_STRIPE_PRICE_999) {
              tier = 'premium';
            } else if (price?.id === process.env.VITE_STRIPE_PRICE_499) {
              tier = 'basic';
            }

            // Update user with new subscription - refresh credits for new subscription
            await storage.updateUserSubscription(user.id, tier, false, "active");
            await storage.updateUserStripeInfo(user.id, subscription.customer as string, subscription.id);

            // Set billing period from subscription
            if ((subscription as any).current_period_start && (subscription as any).current_period_end) {
              const periodStart = new Date((subscription as any).current_period_start * 1000);
              const periodEnd = new Date((subscription as any).current_period_end * 1000);
              await storage.updateUserBillingPeriod(user.id, periodStart, periodEnd);
            }

            console.log(`User ${user.id} subscription created: ${tier} plan`);
          }
        } catch (error) {
          console.error('Error processing subscription creation:', error);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);

        try {
          const user = await storage.getUserBySubscriptionId(subscription.id);
          if (user) {
            // Handle subscription status changes
            if (subscription.status === 'active') {
              await storage.updateUserSubscriptionStatus(user.id, "active");
            } else if (subscription.status === 'canceled') {
              await storage.updateUserSubscriptionStatus(user.id, "canceled");
            } else if (subscription.cancel_at_period_end) {
              await storage.updateUserSubscriptionStatus(user.id, "canceling");
            }

            // Update billing period
            if ((subscription as any).current_period_start && (subscription as any).current_period_end) {
              const periodStart = new Date((subscription as any).current_period_start * 1000);
              const periodEnd = new Date((subscription as any).current_period_end * 1000);
              await storage.updateUserBillingPeriod(user.id, periodStart, periodEnd);
            }

            console.log(`User ${user.id} subscription updated: status=${subscription.status}`);
          }
        } catch (error) {
          console.error('Error processing subscription update:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        try {
          const user = await storage.getUserBySubscriptionId(subscription.id);
          if (user) {
            // Revert to free tier - refresh credits to free tier limits
            await storage.updateUserSubscription(user.id, 'free', false, "canceled");
            console.log(`User ${user.id} reverted to free tier`);
          }
        } catch (error) {
          console.error('Error processing subscription deletion:', error);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        try {
          const userId = session.metadata?.userId;
          const priceId = session.metadata?.priceId;
          const isUpgrade = session.metadata?.isUpgrade === 'true';
          const existingSubscriptionId = session.metadata?.existingSubscriptionId;

          if (userId && session.subscription) {
            // Cancel existing subscription if this is an upgrade
            if (isUpgrade && existingSubscriptionId) {
              try {
                await stripe.subscriptions.cancel(existingSubscriptionId);
                console.log(`Canceled existing subscription ${existingSubscriptionId} for user ${userId}`);
              } catch (error) {
                console.error('Error canceling existing subscription:', error);
              }
            }

            // Determine subscription tier based on price ID
            let tier = 'basic';
            if (priceId === process.env.VITE_STRIPE_PRICE_1499) {
              tier = 'premium-plus';
            } else if (priceId === process.env.VITE_STRIPE_PRICE_999) {
              tier = 'premium';
            } else if (priceId === process.env.VITE_STRIPE_PRICE_499) {
              tier = 'basic';
            }

            // Update user's subscription tier and info
            const user = await storage.getUser(userId);
            if (user && user.stripeCustomerId) {
              await storage.updateUserStripeInfo(userId, user.stripeCustomerId, session.subscription as string);
              await storage.updateUserSubscription(userId, tier, false, "active");
              
              // Get subscription details to set billing period
              try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                if ((subscription as any).current_period_start && (subscription as any).current_period_end) {
                  const periodStart = new Date((subscription as any).current_period_start * 1000);
                  const periodEnd = new Date((subscription as any).current_period_end * 1000);
                  await storage.updateUserBillingPeriod(userId, periodStart, periodEnd);
                }
              } catch (error) {
                console.error('Error updating billing period:', error);
              }
              
              console.log(`Updated user ${userId} to ${tier} plan with subscription ${session.subscription}`);
            }
          }
        } catch (error) {
          console.error('Error processing checkout session completion:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  });
}
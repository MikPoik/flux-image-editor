import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function setupSubscriptionRoutes(app: Express) {
  // Create checkout session
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.claims.sub;

      console.log('Create subscription request:', { priceId, userId });

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      // Check if user has an existing subscription for upgrade handling
      let isUpgrade = false;
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          isUpgrade = true;
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Create checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription?canceled=true`,
        metadata: {
          userId: userId,
          priceId: priceId,
          isUpgrade: isUpgrade.toString(),
          existingSubscriptionId: user.stripeSubscriptionId || '',
        },
      });

      console.log('Checkout session created:', session.id);

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get subscription info
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let cancelAtPeriodEnd = false;
      let currentPeriodEnd = null;
      let hasActiveSubscription = false;

      // If user has a subscription, check its cancellation status
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
          hasActiveSubscription = subscription.status === 'active';

          // Use database current_period_end as primary source, fallback to Stripe
          console.log(`Debug currentPeriodEnd for user ${userId}:`, {
            databaseValue: user.currentPeriodEnd,
            databaseType: typeof user.currentPeriodEnd,
            stripeValue: subscription.current_period_end,
          });

          if (user.currentPeriodEnd) {
            currentPeriodEnd = Math.floor(user.currentPeriodEnd.getTime() / 1000);
          } else if ('current_period_end' in subscription) {
            currentPeriodEnd = (subscription as any).current_period_end;
            
            // Update database with the period end from Stripe if it's missing
            try {
              const periodStart = new Date(((subscription as any).current_period_start || subscription.created) * 1000);
              const periodEnd = new Date((subscription as any).current_period_end * 1000);
              await storage.updateUserBillingPeriod(userId, periodStart, periodEnd);
              console.log(`Updated missing billing period for user ${userId}`);
            } catch (error) {
              console.error('Failed to update missing billing period:', error);
            }
          }

          console.log(`Subscription status for user ${userId}:`, {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: currentPeriodEnd,
            databasePeriodEnd: user.currentPeriodEnd,
          });
        } catch (error) {
          console.error('Error retrieving subscription:', error);
          // If subscription retrieval fails, user probably doesn't have an active subscription
          hasActiveSubscription = false;
        }
      } else {
        console.log(`User ${userId} has no subscription`);
        // Still check if user has currentPeriodEnd in database (for canceled subscriptions)
        if (user.currentPeriodEnd) {
          currentPeriodEnd = Math.floor(user.currentPeriodEnd.getTime() / 1000);
        }
      }

      const response = {
        subscriptionTier: user.subscriptionTier || 'free',
        credits: user.credits || 30,
        maxCredits: user.maxCredits || 30,
        creditsResetDate: user.creditsResetDate ? Math.floor(user.creditsResetDate.getTime() / 1000) : null,
        hasActiveSubscription,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      };

      console.log(`Subscription info response for user ${userId}:`, response);

      res.json(response);
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ message: "Failed to get subscription info" });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get current subscription status first
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status === 'canceled') {
        return res.status(400).json({ message: "Subscription is already canceled" });
      }

      if (subscription.cancel_at_period_end) {
        return res.status(400).json({ message: "Subscription is already scheduled for cancellation" });
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update database to reflect the cancellation status
      await storage.updateUserSubscriptionStatus(userId, "canceling");

      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Resume subscription
  app.post('/api/resume-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get current subscription status first
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status === 'canceled') {
        return res.status(400).json({ message: "Subscription is already canceled and cannot be resumed" });
      }

      if (!subscription.cancel_at_period_end) {
        return res.status(400).json({ message: "Subscription is not scheduled for cancellation" });
      }

      // Resume subscription by removing cancellation
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database to reflect the active status
      await storage.updateUserSubscriptionStatus(userId, "active");

      res.json({ message: "Subscription has been resumed successfully" });
    } catch (error: any) {
      console.error('Resume subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Upgrade subscription endpoint
  app.post('/api/upgrade-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.claims.sub;

      console.log('Upgrade subscription request:', { priceId, userId });

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found to upgrade" });
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status !== 'active') {
        return res.status(400).json({ message: "Subscription is not active" });
      }

      // Update subscription with new price
      const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'always_invoice',
      });

      // Determine subscription tier based on price
      let tier = 'basic';

      if (priceId === process.env.VITE_STRIPE_PRICE_1499) {
        tier = 'premium-plus';
      } else if (priceId === process.env.VITE_STRIPE_PRICE_999) {
        tier = 'premium';
      } else if (priceId === process.env.VITE_STRIPE_PRICE_5) {
        tier = 'basic';
      }

      // Update user subscription details - preserve credits for upgrades
      await storage.updateUserSubscription(userId, tier, true, "active");

      console.log(`Subscription upgraded for user ${userId}: ${tier} plan`);

      res.json({ 
        message: "Subscription upgraded successfully",
        tier
      });

    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Add route to handle successful checkout session
  app.get('/api/checkout-session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      res.json({
        status: session.payment_status,
        subscriptionId: session.subscription,
      });
    } catch (error: any) {
      console.error('Error retrieving checkout session:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Manual billing period reset endpoint (for testing)
  app.post('/api/reset-billing-period', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.triggerBillingPeriodReset(userId);

      if (user) {
        res.json({ 
          message: "Billing period reset successfully",
          credits: user.credits,
          maxCredits: user.maxCredits,
          currentPeriodStart: user.currentPeriodStart,
          currentPeriodEnd: user.currentPeriodEnd
        });
      } else {
        res.status(500).json({ message: "Failed to reset billing period" });
      }
    } catch (error) {
      console.error('Manual billing period reset error:', error);
      res.status(500).json({ message: "Failed to reset billing period" });
    }
  });
}
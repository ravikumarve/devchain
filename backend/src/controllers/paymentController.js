const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();

const createCheckoutSession = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Validate product exists and get price
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description.substring(0, 300),
            },
            unit_amount: product.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase-cancel`,
      metadata: {
        productId,
        buyerId: userId,
      },
    });

    // Create order record with pending status
    await prisma.order.create({
      data: {
        buyerId: userId,
        productId,
        amount: product.price,
        stripeSessionId: session.id,
        status: 'pending',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Update order status to completed
      await prisma.order.update({
        where: { stripeSessionId: session.id },
        data: { status: 'completed' },
      });

      console.log(`Payment successful for session: ${session.id}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
};

// Initialize Stripe with trimmed key to avoid whitespace issues
const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Stripe checkout - https://stripe.com/docs/payments/checkout
// Stripe JS reference - https://stripe.com/docs/js
// Stripe API reference - https://stripe.com/docs/api

/**
 * @description - Create checkout session and send as response
 * @route - GET /checkout-session/:tourId
 */
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Check if Stripe is configured
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey || stripeKey.includes('<') || stripeKey === '') {
    return next(
      new AppError(
        'Payment system is not configured. Please contact the administrator.',
        500
      )
    );
  }

  if (!stripe) {
    return next(
      new AppError(
        'Stripe initialization failed. Please check your API key configuration.',
        500
      )
    );
  }

  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }

  // 2) Create checkout session
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Product information
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                `${req.protocol}://${req.get('host')}/img/tours/${
                  tour.imageCover
                }`,
              ],
            },
          },
        },
      ],
      mode: 'payment', // Accept one-time payments
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get(
        'host'
      )}/my-bookings?alert=booking&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
    });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return next(
      new AppError(
        `Stripe error: ${error.message || 'Invalid API key or configuration'}`,
        400
      )
    );
  }

  // 3) Send session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async (session) => {
  try {
    const tour = session.client_reference_id;
    const userDoc = await User.findOne({ email: session.customer_email });
    
    if (!userDoc) {
      console.error('User not found for email:', session.customer_email);
      return;
    }
    
    const user = userDoc.id;
    const price = session.amount_total / 100;

    // Check if booking already exists
    const existingBooking = await Booking.findOne({ tour, user });
    if (existingBooking) {
      console.log('Booking already exists for tour:', tour, 'user:', user);
      return;
    }

    await Booking.create({ tour, user, price });
    console.log('Booking created successfully for tour:', tour, 'user:', user);
  } catch (error) {
    console.error('Error creating booking:', error);
    // Don't throw - we don't want to fail the webhook
  }
};

/**
 * Middleware to create booking from Stripe checkout session (for development when webhooks don't work)
 */
exports.createBookingFromCheckout = catchAsync(async (req, res, next) => {
  const { session_id } = req.query;

  // If session_id exists, try to create booking from Stripe session
  if (session_id && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      // Only create booking if payment was successful
      if (session.payment_status === 'paid') {
        await createBookingCheckout(session);
      }
    } catch (error) {
      console.error('Error retrieving Stripe session:', error);
      // Continue anyway - booking might have been created via webhook
    }
  }

  next();
});

/**
 * Source - https://stripe.com/docs/payments/handling-payment-events
 * @description - (app.js) webhook endpoint after successful payment event
 * @route - POST /webhook-checkout
 */
exports.webhookCheckout = (req, res, next) => {
  if (!stripe) {
    return res.status(500).send('Stripe is not configured');
  }

  // Check webhook signature
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return res.status(500).send('Webhook secret is not configured');
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

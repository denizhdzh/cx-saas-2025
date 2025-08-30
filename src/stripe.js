import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - test key for now
const stripePromise = loadStripe('pk_test_51QT..._your_stripe_test_key_here');
 
export default stripePromise; 
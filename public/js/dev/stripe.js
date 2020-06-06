import axios from 'axios';
import { showAlert } from './alerts.js';
const stripe = Stripe(
  'pk_test_51GqmM9EfUzhXQujvN9wS4YLhG2UTeOHCJc2ZGmsYfUhVxqAihQ7xio54nlJylY2AhEfpTctOcCMgmJfr7qVb2P0a00FDWGi89v'
);

export const bookTour = async tourId => {
  try {
    // 1) Get session from server
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) create checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (error) {
    console.log(error);
    showAlert('error', err);
  }
};

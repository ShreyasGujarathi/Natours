import axios from 'axios';
import { showAlert } from './alerts';

// Configure axios to send cookies with requests (needed for JWT authentication)
axios.defaults.withCredentials = true;

const stripe = Stripe(
  'pk_test_51SOh2YA8Kb4XJXQLIoYxXQulX0cJIPoGeOba1GQoX2PNBPupOa50kZXOx66aTkHUXyTBGKoWApVKWUGUbheQCt1800PF1MQw94'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
      withCredentials: true,
    });

    // 2) Create checkout form + charge credit card
    const checkoutPageUrl = session.data.session.url;
    window.location.assign(checkoutPageUrl);
  } catch (error) {
    console.error('Booking error:', error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Unable to create booking session. Please try again.';
    showAlert('error', errorMessage);
  }
};

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import './style.scss';
import { Booking } from 'renderer/types';

interface StripePaymentFormProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: Booking;
}

// Form for collecting Stripe payment details
const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ 
  ajax_url, 
  setStep, 
  bookingData 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Generate the confirmation URL using event_url if available, or fall back to window.location.origin
    // This ensures we're using the same base URL that was used for the booking
    const baseUrl = bookingData.event_url || window.location.origin;
    const confirmUrl = `${baseUrl}/?quillbooking=booking&id=${bookingData.hash_id}&type=confirm`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // After successful payment, redirect to the confirmation page
        return_url: confirmUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment processing');
      setIsLoading(false);
    } else {
      // On successful payment, redirect will happen automatically
      // But in case it doesn't, we can handle success here
      setIsLoading(false);
      
      // Redirect to the confirmation page
      if (window.top) {
        window.top.location.href = confirmUrl;
      } else {
        window.location.href = confirmUrl;
      }
    }
  };

  const handleGoBack = () => {
    setStep(3); // Back to payment selection
  };

  return (
    <div className="stripe-payment-container">
      <div className="stripe-payment-header">
        <div
          className="stripe-payment-header-icon"
          onClick={handleGoBack}
        >
          <LeftArrowIcon />
        </div>
        <p>Payment Details</p>
      </div>
      
      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="payment-element-container">
          <PaymentElement />
        </div>
        
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
        
        <div className="payment-actions">
          <button 
            type="submit"
            className="pay-now-button" 
            disabled={isLoading || !stripe || !elements}
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StripePaymentForm; 
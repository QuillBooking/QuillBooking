import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './style.scss';

interface StripePaymentFormProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: any;
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.href}&booking_id=${bookingData.hash_id}&payment_status=success`,
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
        window.top.location.href = `${bookingData.event_url}/?quillbooking=booking&id=${bookingData.hash_id}&type=confirm`;
      } else {
        window.location.href = `${bookingData.event_url}/?quillbooking=booking&id=${bookingData.hash_id}&type=confirm`;
      }
    }
  };

  const handleGoBack = () => {
    setStep(3); // Back to payment selection
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="payment-element-container">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      <div className="payment-actions">
        <button 
          type="button" 
          className="back-button"
          onClick={handleGoBack}
          disabled={isLoading}
        >
          Back
        </button>
        <button 
          type="submit" 
          className="pay-button"
          disabled={isLoading || !stripe || !elements}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm; 
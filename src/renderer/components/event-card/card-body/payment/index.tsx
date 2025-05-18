import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './style.scss';

interface PaymentFormProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: any;
}

// Actual form for collecting payment details
const PaymentForm: React.FC<PaymentFormProps> = ({ ajax_url, setStep, bookingData }) => {
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
    setStep(2);
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

interface PaymentProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: any;
  event: any;
  totalPrice: number;
}

// Stripe Elements wrapper
const Payment: React.FC<PaymentProps> = ({ ajax_url, setStep, bookingData, event, totalPrice }) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the Stripe publishable key and create payment intent
    const initPayment = async () => {
      try {
        setLoading(true);
        console.log('Initializing payment for booking:', bookingData.hash_id);
        
        const formData = new FormData();
        formData.append('action', 'quillbooking_init_stripe');
        formData.append('booking_id', bookingData.hash_id);
        
        console.log('Sending request to', ajax_url);
        console.log('With booking_id:', bookingData.hash_id);
        
        const response = await fetch(ajax_url, {
          method: 'POST',
          body: formData
        });
        
        // Log the full response for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('The server returned an invalid response format');
        }
        
        if (!response.ok) {
          console.error('Server returned error status:', response.status);
          console.error('Error response:', data);
          
          const errorMessage = data && data.data && data.data.message 
            ? data.data.message 
            : 'An unknown error occurred while initializing payment';
            
          throw new Error(errorMessage);
        }
        
        console.log('Payment initialization response:', data);
        
        if (data.success) {
          // Load stripe with the publishable key
          console.log('Loading Stripe with publishable key');
          setStripePromise(loadStripe(data.data.publishable_key));
          setPaymentIntent(data.data.client_secret);
        } else {
          console.error('Payment initialization failed:', data);
          throw new Error(data.data && data.data.message ? data.data.message : 'Failed to initialize payment');
        }
      } catch (err: any) {
        console.error('Error in payment initialization:', err);
        setError(err.message || 'An error occurred while initializing payment');
      } finally {
        setLoading(false);
      }
    };
    
    initPayment();
  }, [ajax_url, bookingData.hash_id]);

  if (loading) {
    return <div className="loading-payment">Initializing payment...</div>;
  }

  if (error) {
    return (
      <div className="payment-error">
        <p>{error}</p>
        <button onClick={() => setStep(2)}>Go Back</button>
      </div>
    );
  }

  if (!stripePromise || !paymentIntent) {
    return (
      <div className="payment-error">
        <p>Unable to initialize payment system</p>
        <button onClick={() => setStep(2)}>Go Back</button>
      </div>
    );
  }

  const options = {
    clientSecret: paymentIntent,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="payment-container">
      <h3>Complete your booking with payment</h3>
      <div className="payment-details">
        <p className="payment-amount">
          Total: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: event.payments_settings?.currency || 'USD',
          }).format(totalPrice)}
        </p>
      </div>
      
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm 
          ajax_url={ajax_url} 
          setStep={setStep} 
          bookingData={bookingData}
        />
      </Elements>
    </div>
  );
};

export default Payment; 
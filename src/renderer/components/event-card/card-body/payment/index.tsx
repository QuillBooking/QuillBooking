import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './style.scss';
import PaymentSummary from './payment-summary';
import StripePaymentForm from './stripe-payment-form';
import { Booking, Event } from 'renderer/types';

interface PaymentProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: Booking;
  event: Event;
  totalPrice: number;
}

// Main Payment component
const Payment: React.FC<PaymentProps> = ({ ajax_url, setStep, bookingData, event, totalPrice }) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPaymentStep, setCurrentPaymentStep] = useState<number>(3); // 3 = Payment Summary, 4 = Stripe Form

  useEffect(() => {
    // Only initialize Stripe when moving to the Stripe form step
    if (currentPaymentStep === 4) {
      initStripe();
    } else {
      setLoading(false);
    }
  }, [currentPaymentStep]);

  const initStripe = async () => {
    try {
      setLoading(true);
      console.log('Initializing Stripe payment for booking:', bookingData.hash_id);
      
      const formData = new FormData();
      formData.append('action', 'quillbooking_init_stripe');
      formData.append('booking_id', bookingData.hash_id);
      
      console.log('Sending request to', ajax_url);
      
      const response = await fetch(ajax_url, {
        method: 'POST',
        body: formData
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('The server returned an invalid response format');
      }
      
      if (!data.success) {
        throw new Error(data.data && data.data.message ? data.data.message : 'Failed to initialize payment');
      }
      
      console.log('Payment initialization response:', data);
      
      setStripePromise(loadStripe(data.data.publishable_key));
      setPaymentIntent(data.data.client_secret);
    } catch (err: any) {
      console.error('Error in payment initialization:', err);
      setError(err.message || 'An error occurred while initializing payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle step changes from within this component
  const handleStepChange = (step: number) => {
    setCurrentPaymentStep(step);
    if (step < 3) {
      // If going back to a previous step outside this component
      setStep(step);
    }
  };

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

  // Payment Summary Step
  if (currentPaymentStep === 3) {
    return (
      <PaymentSummary
        ajax_url={ajax_url}
        setStep={handleStepChange}
        bookingData={bookingData}
        event={event}
        totalPrice={totalPrice}
      />
    );
  }

  // Stripe Payment Form Step
  if (currentPaymentStep === 4) {
    if (!stripePromise || !paymentIntent) {
      return (
        <div className="payment-error">
          <p>Unable to initialize payment system</p>
          <button onClick={() => handleStepChange(3)}>Go Back</button>
        </div>
      );
    }

    const options = {
      clientSecret: paymentIntent,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#953AE4',
          borderRadius: '8px',
        }
      },
    };

    return (
      <Elements stripe={stripePromise} options={options}>
        <StripePaymentForm
          ajax_url={ajax_url} 
          setStep={handleStepChange} 
          bookingData={bookingData}
        />
      </Elements>
    );
  }

  return null;
};

export default Payment; 
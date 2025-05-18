import React, { useState } from 'react';
import './style.scss';

interface PaymentSummaryProps {
  ajax_url: string;
  setStep: (step: number) => void;
  bookingData: any;
  event: any;
  totalPrice: number;
}

// Payment Summary component that allows selection between payment methods
const PaymentSummary: React.FC<PaymentSummaryProps> = ({ 
  ajax_url, 
  setStep, 
  bookingData, 
  event, 
  totalPrice 
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine available payment methods from event settings
  const paymentMethods = {
    stripe: event.payments_settings?.enable_stripe,
    paypal: event.payments_settings?.enable_paypal
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: event.payments_settings?.currency || 'USD',
    }).format(price);
  };

  const handleContinueToPayment = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('action', 'quillbooking_process_payment');
      formData.append('booking_hash_id', bookingData.hash_id);
      formData.append('payment_method', selectedPaymentMethod);

      const response = await fetch(ajax_url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.data?.message || 'Failed to process payment');
      }

      // For PayPal, redirect to payment URL
      if (selectedPaymentMethod === 'paypal' && data.data.redirect_url) {
        window.location.href = data.data.redirect_url;
        return;
      }

      // For Stripe, proceed to payment form
      if (selectedPaymentMethod === 'stripe') {
        setStep(4); // Move to Stripe payment form
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(2); // Back to questions
  };

  return (
    <div className="payment-summary">
      <h3>Payment Summary</h3>
      <div className="payment-amount">
        <p>You are now about to pay {formatPrice(totalPrice)} to attend the event under the name <strong>{bookingData.guest?.name}</strong></p>
      </div>
      
      <div className="payment-method-selection">
        <p>Select Payment Way</p>
        
        <div className="payment-methods">
          {paymentMethods.paypal && (
            <div 
              className={`payment-method-option ${selectedPaymentMethod === 'paypal' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('paypal')}
            >
              <img src="/wp-content/plugins/QuillBooking/assets/icons/paypal/paypal.png" alt="PayPal" />
            </div>
          )}
          
          {paymentMethods.stripe && (
            <div 
              className={`payment-method-option ${selectedPaymentMethod === 'stripe' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('stripe')}
            >
              <img src="/wp-content/plugins/QuillBooking/assets/icons/stripe/stripe.png" alt="Stripe" />
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
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
          type="button" 
          className="continue-button"
          onClick={handleContinueToPayment}
          disabled={isLoading || !selectedPaymentMethod}
        >
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSummary; 
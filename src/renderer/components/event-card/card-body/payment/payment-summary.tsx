import React, { useState, useEffect } from 'react';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import paypalIcon from '../../../../../../assets/icons/paypal/paypal.png';
import stripeIcon from '../../../../../../assets/icons/stripe/stripe.png';
import woocommerceIcon from '../../../../../../assets/icons/woocommerce/woocommerce.png';
import { Booking, Event } from 'renderer/types';

interface PaymentSummaryProps {
	ajax_url: string;
	setStep: (step: number) => void;
	bookingData: Booking;
	event: Event;
	totalPrice: number;
}

// Payment Summary component that allows selection between payment methods
const PaymentSummary: React.FC<PaymentSummaryProps> = ({
	ajax_url,
	setStep,
	bookingData,
	event,
	totalPrice,
}) => {
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
		string | null
	>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Determine available payment methods from event settings
	const paymentMethods = {
		stripe: event?.payments_settings?.enable_stripe,
		paypal: event?.payments_settings?.enable_paypal,
		woocommerce: event?.payments_settings?.enable_woocommerce,
	};

	// Check if any payment method is enabled
	const hasEnabledPaymentMethods =
		paymentMethods.stripe ||
		paymentMethods.paypal ||
		paymentMethods.woocommerce;

	useEffect(() => {
		// If no payment methods are enabled, show an error
		if (!hasEnabledPaymentMethods) {
			setError('No payment methods are enabled for this event.');
		}
	}, [hasEnabledPaymentMethods]);

	const handlePaymentMethodSelect = (method: string) => {
		setSelectedPaymentMethod(method);
	};

	// Get the selected duration from the booking data slot_time or fallback to event duration
	const selectedDuration = bookingData?.slot_time || event?.duration;

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: event?.payments_settings?.currency || 'USD',
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
			formData.append('booking_hash_id', bookingData?.hash_id);
			formData.append('payment_method', selectedPaymentMethod);

			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (!data?.success) {
				throw new Error(
					data?.data?.message || 'Failed to process payment'
				);
			}

			// For PayPal, redirect to payment URL
			if (
				selectedPaymentMethod === 'paypal' &&
				data?.data?.redirect_url
			) {
				window.location.href = data?.data?.redirect_url;
				return;
			}

			// For WooCommerce, redirect to checkout URL
			if (selectedPaymentMethod === 'woocommerce' && data?.data?.url) {
				window.location.href = data?.data?.url;
				return;
			}

			// For Stripe, proceed to payment form
			if (selectedPaymentMethod === 'stripe') {
				setStep(4); // Move to Stripe payment form
			}
		} catch (err: any) {
			setError(err?.message || 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoBack = () => {
		setStep(2); // Back to questions
	};

	return (
		<div className="payment-summary-container">
			<div className="payment-summary-header">
				<div
					className="payment-summary-header-icon"
					onClick={handleGoBack}
				>
					<LeftArrowIcon />
				</div>
				<p>Payment Summary</p>
			</div>

			<div className="payment-amount">
				<div className="info-icon">ℹ️</div>
				<p>
					You are now about to pay {formatPrice(totalPrice)} to attend
					the event under the name{' '}
					<strong>
						{event?.name} - For {selectedDuration} Minutes
					</strong>{' '}
					as the online booking fees.
				</p>
			</div>

			{hasEnabledPaymentMethods ? (
				<div className="payment-method-selection">
					<p>Select Payment Way</p>

					<div className="payment-methods">
						{paymentMethods.paypal && (
							<label
								className={`payment-method-radio ${selectedPaymentMethod === 'paypal' ? 'selected' : ''}`}
							>
								<input
									type="radio"
									name="payment-method"
									value="paypal"
									checked={selectedPaymentMethod === 'paypal'}
									onChange={() =>
										handlePaymentMethodSelect('paypal')
									}
								/>
								<img src={paypalIcon} alt="PayPal" />
							</label>
						)}

						{paymentMethods.stripe && (
							<label
								className={`payment-method-radio ${selectedPaymentMethod === 'stripe' ? 'selected' : ''}`}
							>
								<input
									type="radio"
									name="payment-method"
									value="stripe"
									checked={selectedPaymentMethod === 'stripe'}
									onChange={() =>
										handlePaymentMethodSelect('stripe')
									}
								/>
								<img src={stripeIcon} alt="Stripe" />
							</label>
						)}
					</div>
				</div>
			) : (
				<div className="payment-error-message">
					<p>
						No payment methods are available for this event. Please
						contact the event organizer.
					</p>
				</div>
			)}

			{error && <div className="error-message">{error}</div>}

			<div className="payment-actions">
				<button
					type="button"
					className="continue-to-payment-button"
					onClick={handleContinueToPayment}
					disabled={isLoading || !selectedPaymentMethod}
				>
					{isLoading ? 'Processing...' : 'Continue to Payments'}
				</button>
			</div>
		</div>
	);
};

export default PaymentSummary;

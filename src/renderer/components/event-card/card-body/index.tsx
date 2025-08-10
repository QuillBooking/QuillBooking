import { useEffect, useState } from 'react';
import { Booking, Event } from '../../../types';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import QuestionsComponents from './questions';
import Reschedule from '../../reschedule';
import { Col, Row, Skeleton, Space } from 'antd';
import { get } from 'lodash';
import { get_location } from '@quillbooking/utils';
import tinycolor from 'tinycolor2';
import { applyFilters } from '@wordpress/hooks';

interface CardBodyProps {
	event: Event;
	ajax_url: string;
	type?: string;
	booking?: Booking;
	url: string;
	globalCurrency: string;
}

// Shimmer Loader Component with Tailwind CSS
const ShimmerLoader = () => {
	return (
		<div
			style={{
				margin: 'auto',
				padding: 24,
				background: '#fff',
			}}
		>
			{/* Header */}
			<Row align="middle" gutter={16}>
				<Col>
					<Skeleton.Avatar active size="large" shape="circle" />
				</Col>
			</Row>

			<div style={{ marginTop: 24 }}>
				{/* Title + Description */}
				<Space direction="vertical" size={16} style={{ width: '100%' }}>
					<Skeleton.Input
						active
						size="default"
						style={{ width: '70%' }}
					/>
					<Skeleton.Input
						active
						size="small"
						style={{ width: '90%' }}
					/>
					<Skeleton.Input
						active
						size="small"
						style={{ width: '80%' }}
					/>
				</Space>
			</div>

			{/* Large block (e.g. calendar area) */}
			<div style={{ marginTop: 32 }}>
				<Skeleton.Input
					active
					block
					style={{ height: 200, borderRadius: 8 }}
				/>
			</div>

			{/* Bottom buttons/selects */}
			<Row gutter={16} style={{ marginTop: 24 }}>
				<Col span={6}>
					<Skeleton.Input active style={{ width: '50%' }} />
				</Col>
			</Row>
		</div>
	);
};

const CardBody: React.FC<CardBodyProps> = ({
	event,
	ajax_url,
	type = 'schedule',
	booking,
	url,
	globalCurrency,
}) => {
	const baseColor = tinycolor(event.color);
	const lightColor = baseColor.lighten(40).toString();
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [timeZone, setTimeZone] = useState<string>(
		event.limits_data?.timezone_lock?.enable
			? event.limits_data?.timezone_lock?.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	const [step, setStep] = useState<number>(1);
	const [selectedDuration, setSelectedDuration] = useState<number>(
		event.duration
	);
	const [bookingData, setBookingData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalPrice, setTotalPrice] = useState<number>(0);
	const [hostIds, setHostIds] = useState<number[]>([]);
	// Get prefilled data from URL parameters
	const [prefilledData, setPrefilledData] = useState<{
		name?: string;
		email?: string;
	}>({});

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const prefilledName = searchParams.get('username');
		const prefilledEmail = searchParams.get('email');

		if (prefilledName || prefilledEmail) {
			setPrefilledData({
				name: prefilledName || undefined,
				email: prefilledEmail || undefined,
			});
		}
	}, []);

	// Calculate price based on whether it's multi-duration or not
	const calculatePrice = () => {
		const isMultiDurations =
			event.additional_settings?.allow_attendees_to_select_duration;
		const paymentSettings = get(event, 'payments_settings', {});
		const isPaymentEnabled = get(paymentSettings, 'enable_payment', false);

		if (!isPaymentEnabled) return 0;

		if (isMultiDurations && selectedDuration) {
			const durationStr = selectedDuration.toString();
			return get(
				paymentSettings,
				['multi_duration_items', durationStr, 'price'],
				0
			);
		} else {
			const items = get(paymentSettings, 'items', []) as Array<{
				item: string;
				price: number;
			}>;
			if (items.length > 0) {
				return items[0].price;
			}
		}

		return 0;
	};

	// Update price when duration changes
	useEffect(() => {
		setTotalPrice(calculatePrice());
	}, [selectedDuration, event]);

	const proActive = (window as any).quillbooking?.pro_active === true;
	const requiresPayment =
		event.payments_settings?.enable_payment && totalPrice > 0 && proActive;
	const hasPaymentGateways =
		proActive &&
		(event.payments_settings?.enable_stripe ||
			event.payments_settings?.enable_paypal ||
			event.payments_settings?.type === 'woocommerce');

	const handleSelectedTime = (time: string | null) => {
		setSelectedTime(time);
		if (!time) {
			setStep(1);
			return;
		}
		setStep(2);
	};

	const handleSave = async (values: any) => {
		console.log('Submitting booking form', { values, event });

		try {
			console.log('Submitting booking form', { values, event });

			// Get prefilled data from URL parameters
			const currentUrlParams = new URLSearchParams(
				window.location.search
			);
			const prefilledName = currentUrlParams.get('username');
			const prefilledEmail = currentUrlParams.get('email');

			// Use prefilled data if available, otherwise use form values
			const finalName = prefilledName || values['name'];
			const finalEmail = prefilledEmail || values['email'];

			const formData = new FormData();
			formData.append('action', 'quillbooking_booking');
			formData.append('id', event.id.toString());
			formData.append('timezone', timeZone || '');
			formData.append(
				'start_date',
				(selectedDate ? selectedDate.format('YYYY-MM-DD') : '') +
					' ' +
					(selectedTime + ':00' || '')
			);
			formData.append('duration', selectedDuration.toString());

			if (hostIds.length > 0) {
				formData.append('host_ids', hostIds.join(','));
			}

			// Check if WooCommerce is enabled
			const isWooCommerceEnabled =
				event.payments_settings?.type === 'woocommerce';

			// If payment is required, we need to include a payment method
			if (requiresPayment && hasPaymentGateways) {
				formData.append('status', 'pending');

				// If WooCommerce is enabled, always use it directly
				if (isWooCommerceEnabled) {
					console.log(
						'WooCommerce payment method selected automatically'
					);
					formData.append('payment_method', 'woocommerce');
				}
				// For PayPal only, use it directly without showing payment selection screen
				else if (
					event.payments_settings?.enable_paypal &&
					!event.payments_settings?.enable_stripe
				) {
					console.log('PayPal payment method selected automatically');
					formData.append('payment_method', 'paypal');
				}
				// For Stripe only, use it directly without showing payment selection screen
				else if (
					event.payments_settings?.enable_stripe &&
					!event.payments_settings?.enable_paypal
				) {
					console.log('Stripe payment method selected automatically');
					formData.append('payment_method', 'stripe');
				}
				// For multiple payment methods, default to Stripe if available
				else {
					// Default to Stripe if available, otherwise PayPal
					const defaultMethod = event.payments_settings?.enable_stripe
						? 'stripe'
						: event.payments_settings?.enable_paypal
							? 'paypal'
							: null;

					if (defaultMethod) {
						formData.append('payment_method', defaultMethod);
					}
				}
			}

			formData.append(
				'invitees',
				JSON.stringify([
					{
						name: finalName,
						email: finalEmail,
					},
				])
			);

			// Handle location field
			const location = get_location(
				event.location,
				values.location,
				values['location-data']
			);
			formData.append('location', JSON.stringify(location));

			// Filter values for custom fields
			const filteredValues = { ...values };
			delete filteredValues['name'];
			delete filteredValues['email'];
			delete filteredValues['field'];
			delete filteredValues['location'];
			if (filteredValues['location-data']) {
				delete filteredValues['location-data'];
			}

			if (values['location-select']) {
				delete filteredValues['location-select'];
			}

			if (values['field'] && values['field']['location-select']) {
				filteredValues['location'] = values['field']['location-select'];
			}

			formData.append('fields', JSON.stringify(filteredValues));

			console.log('AJAX URL:', ajax_url);
			console.log('Booking formData prepared');

			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			console.log('Booking response:', data);

			if (!data.success) {
				throw new Error(data.data?.message || 'Unknown error occurred');
			}

			// Check if we're in inline embed mode first
			const embedUrlParams = new URLSearchParams(window.location.search);
			const isInlineEmbedMode =
				embedUrlParams.get('embed_type') === 'Inline';

			// Check for WooCommerce URL response first (it has different format)
			if (data.data.url) {
				if (isInlineEmbedMode) {
					console.log(
						'WooCommerce payment in inline embed mode - sending postMessage to parent'
					);
					const paymentData = {
						type: 'quillbooking_payment_redirect',
						blockId: embedUrlParams.get('blockId') || 'unknown',
						url: data.data.url,
						paymentType: 'woocommerce',
					};
					if (window.parent && window.parent !== window) {
						window.parent.postMessage(
							JSON.stringify(paymentData),
							'*'
						);
					}
					return;
				} else {
					console.log(
						'WooCommerce payment, redirecting to checkout:',
						data.data.url
					);
					(window.top || window).location.href = data.data.url;
					return;
				}
			}

			// Handle different payment flows based on payment type and response
			if (data.data.booking && data.data.booking.hash_id) {
				// If it's a PayPal redirect, handle it directly
				if (data.data.redirect_url) {
					if (isInlineEmbedMode) {
						console.log(
							'PayPal payment in inline embed mode - sending postMessage to parent'
						);
						const paymentData = {
							type: 'quillbooking_payment_redirect',
							blockId: embedUrlParams.get('blockId') || 'unknown',
							url: data.data.redirect_url,
							paymentType: 'paypal',
							bookingId: data.data.booking.hash_id,
						};
						if (window.parent && window.parent !== window) {
							window.parent.postMessage(
								JSON.stringify(paymentData),
								'*'
							);
						}
						return;
					} else {
						console.log(
							'PayPal payment, redirecting to:',
							data.data.redirect_url
						);
						(window.top || window).location.href =
							data.data.redirect_url;
						return;
					}
				}

				// For Stripe payments, go to payment step only if Stripe is enabled
				if (
					requiresPayment &&
					hasPaymentGateways &&
					!isWooCommerceEnabled &&
					event.payments_settings?.enable_stripe &&
					formData.get('payment_method') === 'stripe' &&
					(window as any).quillbooking?.pro_active === true
				) {
					console.log(
						'Stripe payment required, transitioning to payment step',
						{
							requiresPayment,
							bookingData: data.data.booking,
						}
					);
					setBookingData(data?.data?.booking);
					setStep(3); // Payment step
				} else {
					// Handle confirmation based on embed mode (already checked above)
					if (isInlineEmbedMode) {
						// Send postMessage instead of redirecting
						console.log(
							'Inline embed mode detected, sending postMessage instead of redirect'
						);
						const confirmationData = {
							type: 'quillbooking_confirmation',
							blockId: embedUrlParams.get('blockId') || 'unknown',
							bookingId: data.data.booking.hash_id,
							eventId: event.id || 'unknown',
							bookingDate: selectedDate,
							bookingTime: selectedTime,
							status: 'confirmed',
							bookingData: data.data.booking,
						};

						// Send to parent window
						if (window.parent && window.parent !== window) {
							window.parent.postMessage(
								JSON.stringify(confirmationData),
								'*'
							);
						}

						// Also dispatch a global event for same-window integration
						window.dispatchEvent(
							new CustomEvent('quillbooking_confirmation', {
								detail: confirmationData,
							})
						);

						// Show success message in iframe instead of redirect
						document.body.innerHTML = `
							<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#28a745;text-align:center;background:#f8f9fa;">
								<div style="padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px;">
									<div style="font-size:48px;margin-bottom:16px;">✅</div>
									<h2 style="margin: 0 0 16px 0; color: #28a745;">Booking Confirmed!</h2>
									<p style="margin: 0; color: #6c757d;">Your appointment has been successfully scheduled.</p>
									<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 14px; color: #495057;">
										<strong>Booking ID:</strong> ${data.data.booking.hash_id}<br/>
										<strong>Date:</strong> ${selectedDate}<br/>
										<strong>Time:</strong> ${selectedTime}
									</div>
								</div>
							</div>
						`;
					} else {
						// Normal redirect for non-embed mode
						const redirectUrl = `${url}/?quillbooking=booking&id=${data.data.booking.hash_id}&type=confirm`;
						console.log('Redirect URL:', redirectUrl);
						(window.top || window).location.href = redirectUrl;
					}
				}
			} else {
				console.error(
					'Could not find booking hash_id in response:',
					data
				);
			}
		} catch (error) {
			console.error('Error during booking submission:', error);
		}
	};

	useEffect(() => {
		if (event.additional_settings?.allow_attendees_to_select_duration) {
			setSelectedDuration(event.additional_settings.default_duration);
		}
	}, [event]);

	return (
		<>
			{isLoading && <ShimmerLoader />}

			<div
				className="event-card-details"
				style={{ display: isLoading ? 'none' : 'block' }}
			>
				<Hosts hosts={event.hosts} />
				<EventDetails
					event={event}
					selectedDuration={selectedDuration}
					setSelectedDuration={setSelectedDuration}
					step={step}
					selectedDate={selectedDate}
					selectedTime={selectedTime}
					booking={booking ?? null}
					globalCurrency={globalCurrency}
				/>
				{selectedTime && step === 2 ? (
					type === 'reschedule' ? (
						<Reschedule
							ajax_url={ajax_url}
							setStep={setStep}
							fields={event.fields}
							booking={booking ?? null}
							selectedDate={selectedDate}
							selectedTime={selectedTime}
							timezone={timeZone}
							url={url}
							baseColor={event.color}
							darkColor={tinycolor(event.color)
								.darken(20)
								.toString()}
						/>
					) : (
						<QuestionsComponents
							fields={event.fields}
							setStep={setStep}
							onSubmit={handleSave}
							baseColor={event.color}
							darkColor={tinycolor(event.color)
								.darken(20)
								.toString()}
							prefilledData={prefilledData}
						/>
					)
				) : step === 3 &&
				  requiresPayment &&
				  hasPaymentGateways &&
				  bookingData &&
				  event.payments_settings?.enable_stripe && // Only show payment component for Stripe
				  (window as any).quillbooking?.pro_active === true ? (
					(() => {
						// Use the filter to get the payment component
						const paymentComponent = applyFilters(
							'quillbooking.renderer.payment_component',
							null,
							{
								ajax_url,
								setStep,
								bookingData,
								event,
								totalPrice,
								baseColor: event.color,
								darkColor: tinycolor(event.color)
									.darken(20)
									.toString(),
							}
						);
						return paymentComponent as React.ReactNode;
					})()
				) : (
					<DateTimePicker
						setIsLoading={setIsLoading}
						selectedTime={selectedTime}
						event={event}
						selectedDate={selectedDate}
						setSelectedDate={setSelectedDate}
						setHostIds={setHostIds}
						timeZone={timeZone}
						setTimeZone={setTimeZone}
						setSelectedTime={handleSelectedTime}
						ajax_url={ajax_url}
						selectedDuration={selectedDuration}
						baseColor={event.color}
						lightColor={lightColor}
					/>
				)}
			</div>
		</>
	);
};

export default CardBody;

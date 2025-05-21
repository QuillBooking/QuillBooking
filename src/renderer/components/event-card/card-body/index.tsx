import { useEffect, useState } from 'react';
import { Booking, Event } from '../../../types';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import QuestionsComponents from './questions';
import Reschedule from '../../reschedule';
import Payment from './payment';
import { Col, Row, Skeleton, Space } from 'antd';

interface CardBodyProps {
	event: Event;
	ajax_url: string;
	type?: string;
	booking?: Booking;
	url: string;
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
			<Skeleton.Input active size="default" style={{ width: '70%' }} />
			<Skeleton.Input active size="small" style={{ width: '90%' }} />
			<Skeleton.Input active size="small" style={{ width: '80%' }} />
		  </Space>
		</div>
  
		{/* Large block (e.g. calendar area) */}
		<div style={{ marginTop: 32 }}>
		  <Skeleton.Input active block style={{ height: 200, borderRadius: 8 }} />
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
}) => {
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [timeZone, setTimeZone] = useState<string>(
		event.limits_data.timezone_lock.enable
			? event.limits_data.timezone_lock.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	const [step, setStep] = useState<number>(1);
	const [selectedDuration, setSelectedDuration] = useState<number>(
		event.duration
	);
	const [bookingData, setBookingData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Calculate total price from items if payments are enabled
	const totalPrice =
		event.payments_settings?.items?.reduce(
			(sum, item) => sum + item.price,
			0
		) || 0;
	const requiresPayment =
		event.payments_settings?.enable_payment && totalPrice > 0;
	const hasPaymentGateways =
		event.payments_settings?.enable_stripe ||
		event.payments_settings?.enable_paypal ||
		event.payments_settings?.enable_woocommerce;

	const handleSelectedTime = (time: string | null) => {
		setSelectedTime(time);
		if (!time) {
			setStep(1);
			return;
		}
		setStep(2);
	};

	const handleSave = async (values: any) => {
		try {
			console.log('Submitting booking form', { values, event });

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

			// If payment is required, we need to include a payment method
			// Add default payment method if available, to be selected properly in payment step
			if (requiresPayment && hasPaymentGateways) {
				// Default to the first available payment method
				const defaultMethod = event.payments_settings?.enable_stripe
					? 'stripe'
					: event.payments_settings?.enable_paypal
						? 'paypal'
						: event.payments_settings?.enable_woocommerce
							? 'woocommerce'
							: null;

				if (defaultMethod) {
					formData.append('payment_method', defaultMethod);
				}
			}

			formData.append(
				'invitees',
				JSON.stringify([
					{
						name: values['name'],
						email: values['email'],
					},
				])
			);

			// Handle location field
			if (values['location-select']) {
				formData.append(
					'location',
					JSON.stringify(values['location-select'])
				);
			} else {
				formData.append('location', event.location[0].type);
			}

			// Filter values for custom fields
			const filteredValues = { ...values };
			delete filteredValues['name'];
			delete filteredValues['email'];
			delete filteredValues['field'];

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

			// Check for WooCommerce URL response first (it has different format)
			if (data.data.url) {
				console.log(
					'WooCommerce payment, redirecting to checkout:',
					data.data.url
				);
				(window.top || window).location.href = data.data.url;
				return;
			}

			// If payment is required and we have payment gateways, go to payment step
			if (requiresPayment && hasPaymentGateways) {
				console.log('Payment required, transitioning to payment step', {
					requiresPayment,
					bookingData: data.data.booking,
				});
				setBookingData(data.data.booking);
				setStep(3); // Payment step
			} else {
				// Otherwise redirect to confirmation
				console.log(
					'No payment required or no payment gateways configured, redirecting to confirmation'
				);

				// Make sure we have a booking with hash_id before trying to use it
				if (data.data.booking && data.data.booking.hash_id) {
					const redirectUrl = `${url}/?quillbooking=booking&id=${data.data.booking.hash_id}&type=confirm`;
					console.log('Redirect URL:', redirectUrl);
					(window.top || window).location.href = redirectUrl;
				} else {
					console.error(
						'Could not find booking hash_id in response:',
						data
					);
				}
			}
		} catch (error) {
			console.error('Error during booking submission:', error);
		}
	};

	useEffect(() => {
		if (event.additional_settings?.allow_attendees_to_select_duration) {
			setSelectedDuration(event.additional_settings.default_duration);
		}
		
		// Simulate loading time for the shimmer effect
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000); // Show shimmer for 10 seconds
		
		return () => clearTimeout(timer);
	}, [event]);

	if (isLoading) {
		return <ShimmerLoader />;
	}

	return (
		<div className="event-card-details">
			<Hosts hosts={event.hosts} />
			<EventDetails
				event={event}
				selectedDuration={selectedDuration}
				setSelectedDuration={setSelectedDuration}
				step={step}
				selectedDate={selectedDate}
				selectedTime={selectedTime}
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
					/>
				) : (
					<QuestionsComponents
						fields={event.fields}
						setStep={setStep}
						onSubmit={handleSave}
					/>
				)
			) : step === 3 &&
			  requiresPayment &&
			  hasPaymentGateways &&
			  bookingData ? (
				<Payment
					ajax_url={ajax_url}
					setStep={setStep}
					bookingData={bookingData}
					event={event}
					totalPrice={totalPrice}
				/>
			) : (
				<DateTimePicker
					selectedTime={selectedTime}
					event={event}
					selectedDate={selectedDate}
					setSelectedDate={setSelectedDate}
					timeZone={timeZone}
					setTimeZone={setTimeZone}
					setSelectedTime={handleSelectedTime}
					ajax_url={ajax_url}
					selectedDuration={selectedDuration}
				/>
			)}
		</div>
	);
};

export default CardBody;
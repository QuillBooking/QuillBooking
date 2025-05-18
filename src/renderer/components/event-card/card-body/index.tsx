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

interface CardBodyProps {
	event: Event;
	ajax_url: string;
	type?: string;
	booking?: Booking;
	url: string;
}

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
		Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	const [step, setStep] = useState<number>(1);
	const [selectedDuration, setSelectedDuration] = useState<number>(
		event.duration
	);
	const [bookingData, setBookingData] = useState<any>(null);
	
	// Calculate total price from items if payments are enabled
	const totalPrice = event.payments_settings?.items?.reduce((sum, item) => sum + item.price, 0) || 0;
	const requiresPayment = event.payments_settings?.enable_payment && totalPrice > 0;
	const hasPaymentGateways = (event.payments_settings?.enable_stripe || event.payments_settings?.enable_paypal);

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
				const defaultMethod = event.payments_settings?.enable_stripe ? 'stripe' : 
				                     (event.payments_settings?.enable_paypal ? 'paypal' : null);
				
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
				formData.append('location', JSON.stringify(values['location-select']));
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
			
			// If payment is required and we have payment gateways, go to payment step
			if (requiresPayment && hasPaymentGateways) {
				console.log('Payment required, transitioning to payment step', { 
					requiresPayment, 
					bookingData: data.data.booking 
				});
				setBookingData(data.data.booking);
				setStep(3); // Payment step
			} else {
				// Otherwise redirect to confirmation
				console.log('No payment required or no payment gateways configured, redirecting to confirmation');
				const redirectUrl = `${url}/?quillbooking=booking&id=${data.data.booking.hash_id}&type=confirm`;
				console.log('Redirect URL:', redirectUrl);
				(window.top || window).location.href = redirectUrl;
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
			) : step === 3 && requiresPayment && hasPaymentGateways && bookingData ? (
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

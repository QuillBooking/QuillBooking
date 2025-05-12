import { useEffect, useState } from 'react';
import { Booking, Event } from '../../../types';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import QuestionsComponents from './questions';
import Reschedule from '../../reschedule';

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
	url
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

	const handleSelectedTime = (time: string | null) => {
		setSelectedTime(time);
		if (!time) {
			setStep(1);
			return;
		}
		setStep(2);
	};

	const handleSave = async (values: any) => {
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

		formData.append(
			'invitees',
			JSON.stringify([
				{
					name: values['name'],
					email: values['email'],
				},
			])
		);

		formData.append('location', JSON.stringify(values['location-select']));
		const filteredValues = { ...values };
		delete filteredValues['name'];
		delete filteredValues['email'];
		delete filteredValues['field'];

		if (values['location-select']) {
			delete filteredValues['location-select'];
		}
		if (values['field']) {
			filteredValues['location'] = values['field']['location-select'];
		}

		formData.append('fields', JSON.stringify(filteredValues));

		try {
			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				const data = await response.json();
				(window.top || window).location.href =
					`${url}/?quillbooking=booking&id=${data.data.booking.hash_id}&type=confirm`;
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
		}
	};

	useEffect(() => {
		if (event.additional_settings.allow_attendees_to_select_duration) {
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
					/>
				) : (
					<QuestionsComponents
						fields={event.fields}
						setStep={setStep}
						onSubmit={handleSave}
					/>
				)
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

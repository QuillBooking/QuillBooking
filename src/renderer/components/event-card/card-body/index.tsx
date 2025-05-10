import { useState } from 'react';
import { Event } from '../../../types';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import QuestionsComponents from './questions';
import ConfigAPI from '@quillbooking/config';

interface CardBodyProps {
	event: Event;
}

const CardBody: React.FC<CardBodyProps> = ({ event }) => {
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [timeZone, setTimeZone] = useState<string>(
		Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	const [step, setStep] = useState<number>(1);
	const ajax_url = ConfigAPI.getAjaxUrl();

	const handleSelectedTime = (time: string) => {
		setSelectedTime(time);
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
		formData.append('duration', event.duration.toString());

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
				const baseUrl =
					window.top?.location?.origin || window.location.origin;
				(window.top || window).location.href =
					`${baseUrl}/?quillbooking=booking&id=${data.data.booking.hash_id}&type=confirm`;
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
		}
	};

	return (
		<div className="event-card-details">
			<Hosts hosts={event.hosts} />
			<EventDetails event={event} />
			{selectedTime && step === 2 ? (
				<QuestionsComponents
					fields={event.fields}
					setStep={setStep}
					onSubmit={handleSave}
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
				/>
			)}
		</div>
	);
};

export default CardBody;

import { useState } from 'react';
import { Event } from '../../../types';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import QuestionsComponents from './questions';

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

	const handleSelectedTime = (time: string) => {
		setSelectedTime(time);
		setStep(2);
	};
	
	const handleSave = (values: any) => {
		console.log('handke save:', values);
	};

	console.log('event', event.fields);
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

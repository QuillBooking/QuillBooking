import { Dayjs } from 'dayjs';
import './style.scss';

interface TimePickerProps {
	selectedAvailability: string | null;
	selectedDate: Dayjs;
	selectedTime: string | null;
	setSelectedTime: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({
	selectedAvailability,
	selectedDate,
	selectedTime,
	setSelectedTime
}) => {
	const getTimeSlots = () => {
		return selectedAvailability
			? selectedAvailability[selectedDate.format('YYYY-MM-DD')].map(
					(slot: {
						start: string;
						end: string;
						remaining: number;
					}) => {
						if (slot.remaining === 0) return null;
						const timeString = slot.start.split(' ')[1];
						const time = timeString.split(':');
						return `${time[0]}:${time[1]}`;
					}
				)
			: [];
	};

	const timeSlots = getTimeSlots();
	return (
		<div className="time-picker-container">
			<p className="time-picker-title">
				{selectedDate.format('dddd, MMMM D')}
			</p>
			<div className="time-slots-container">
				{timeSlots.length > 0 &&
					timeSlots.map((slot: string, index: number) => (
						<div
							key={index}
							className={`time-slot ${selectedTime === slot ? 'active' : ''}`}
							onClick={() => setSelectedTime(slot)}
						>
							{slot}
						</div>
					))}
			</div>
		</div>
	);
};

export default TimePicker;

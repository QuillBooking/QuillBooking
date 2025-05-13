import { Event } from '../../../../types';
import ClockIcon from '../../../../icons/clock-icon';
import LocationIcon from '../../../../icons/location-icon';
import './style.scss';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs'; // import dayjs
import { __ } from '@wordpress/i18n';
import CalendarIcon from '../../../../icons/calendar-icon';

interface EventDetailsProps {
	event: Event;
	setSelectedDuration: (duration: number) => void;
	selectedDuration: number;
	step: number;
	selectedDate: Dayjs | null;
	selectedTime: string | null; // time string like '14:30'
}

const EventDetails: React.FC<EventDetailsProps> = ({
	event,
	setSelectedDuration,
	selectedDuration,
	step,
	selectedDate,
	selectedTime,
}) => {
	const isMultiDurations =
		event.additional_settings.allow_attendees_to_select_duration;

	let timeRangeText = '';
	if (selectedDate && selectedTime) {
		const time = dayjs(selectedTime, 'HH:mm'); // parse string
		const endTime = time.add(selectedDuration, 'minute');
		timeRangeText = `${time.format('HH:mm')} - ${endTime.format(
			'HH:mm'
		)}, ${selectedDate.format('dddd, MMMM DD, YYYY')}`;
	}

	return (
		<div className="event-details-container">
			<h1 className="event-header">{event.name}</h1>
			<div className="event-details">
				<div className="detail-row">
					<ClockIcon width={20} height={20} />
					{isMultiDurations && step === 1 ? (
						<div className="event-duration-multi">
							{event.additional_settings.selectable_durations.map(
								(duration, index) => (
									<button
										key={index}
										onClick={() =>
											setSelectedDuration(duration)
										}
										className={`duration-btn ${selectedDuration === duration ? 'selected' : ''}`}
									>
										{duration} Minutes
									</button>
								)
							)}
						</div>
					) : (
						<p>
							{selectedDuration} {__('min', '@quillbooking')}
						</p>
					)}
				</div>

				{event.location.length === 1 && (
					<div className="detail-row">
						<LocationIcon height={20} width={20} />
						<p>{event.location[0].type.split('_').join(' ')}</p>
					</div>
				)}

				{timeRangeText && (
					<div className="detail-row">
						<CalendarIcon height={20} width={20} />
						<p>{timeRangeText}</p>
					</div>
				)}
			</div>
			<p className="event-description">{event.description}</p>
		</div>
	);
};

export default EventDetails;

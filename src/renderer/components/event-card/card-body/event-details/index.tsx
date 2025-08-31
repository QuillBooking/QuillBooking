import { RendererEvent } from '@quillbooking/types';
import ClockIcon from '../../../../icons/clock-icon';
import LocationIcon from '../../../../icons/location-icon';
import './style.scss';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs'; // import dayjs
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import CalendarIcon from '../../../../icons/calendar-icon';

interface EventDetailsProps {
	event: RendererEvent;
	setSelectedDuration: (duration: number) => void;
	selectedDuration: number;
	step: number;
	selectedDate: Dayjs | null;
	selectedTime: string | null; // time string like '14:30'
	booking?: any; // Optional booking data, if needed
	globalCurrency: string;
	timeFormat: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({
	event,
	setSelectedDuration,
	selectedDuration,
	step,
	selectedDate,
	selectedTime,
	booking, // Optional booking data, if needed
	globalCurrency,
	timeFormat,
}) => {
	const isMultiDurations =
		event.additional_settings.allow_attendees_to_select_duration;

	// Helper function to format time based on timeFormat prop
	const formatTimeDisplay = (time: string) => {
		const displayFormat = timeFormat === '24' ? 'HH:mm' : 'hh:mm A';
		return dayjs(time, 'HH:mm').format(displayFormat);
	};

	let timeRangeText = '';
	if (selectedDate && selectedTime) {
		const time = dayjs(selectedTime, 'HH:mm'); // parse string
		const endTime = time.add(selectedDuration, 'minute');
		timeRangeText = `${formatTimeDisplay(selectedTime)} - ${formatTimeDisplay(endTime.format('HH:mm'))}, ${selectedDate.format('dddd, MMMM DD, YYYY')}`;
	}

	// Use the WordPress filter to render the price display component
	// This allows the Pro plugin to handle all payment-related logic
	const PriceDisplayComponent = applyFilters(
		'quillbooking.renderer.price_display',
		null,
		{
			event,
			selectedDuration,
			globalCurrency,
		}
	) as React.ReactNode;

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
										{duration} {__('min', '@quillbooking')}
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

				{/* Price display - handled by Pro plugin via filter */}
				{PriceDisplayComponent}

				{/* location */}
				{event.location.length === 1 && (
					<div className="detail-row">
						<LocationIcon height={20} width={20} />
						<p>{event.location[0].type.split('_').join(' ')}</p>
					</div>
				)}

				{booking?.location && (
					<div className="detail-row">
						<LocationIcon height={20} width={20} />
						<p>
							{booking.location['label']}
							{[
								'online',
								'zoom',
								'ms-teams',
								'google-meet',
							].includes(booking.location['type']) ? (
								<>
									:{' '}
									<a
										href={booking.location['value']}
										target="_blank"
										rel="noopener noreferrer"
										className="link"
									>
										{booking.location['value']}
									</a>
								</>
							) : (
								<>: {booking.location['value']}</>
							)}
						</p>
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

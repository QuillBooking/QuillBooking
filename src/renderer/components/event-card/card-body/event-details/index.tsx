import { Event } from '../../../../types';
import ClockIcon from '../../../../icons/clock-icon';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { LocationIcon } from '../../../../../components';

interface EventDetailsProps {
	event: Event;
	setSelectedDuration: (duration: number) => void;
	selectedDuration: number;
	step: number;
}

const EventDetails: React.FC<EventDetailsProps> = ({
	event,
	setSelectedDuration,
	selectedDuration,
	step,
}) => {
	const isMultiDurations =
		event.additional_settings.allow_attendees_to_select_duration;

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
				{/* location */}
				{event.location.length === 1 && (
					<div className="detail-row">
						<LocationIcon width={20} height={20} rectFill={false} />
						<p>{event.location[0].type.split('_').join(' ')}</p>
					</div>
				)}
			</div>
			<p className="event-description">{event.description}</p>
		</div>
	);
};

export default EventDetails;

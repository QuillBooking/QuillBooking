import { Event } from '../../../../types';
import ClockIcon from '../../../../icons/clock-icon';
import './style.scss';
import { __ } from '@wordpress/i18n';

interface EventDetailsProps {
	event: Event;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
	return (
		<div className="event-details-container">
			<h1 className="event-header">{event.name}</h1>
			<div className="event-details">
				<div className="event-duration">
					<ClockIcon width={20} height={20} />
					<p>
						{event.duration} {__('min', '@quillbooking')}
					</p>
				</div>
			</div>
			<p className="event-description">{event.description}</p>
		</div>
	);
};

export default EventDetails;

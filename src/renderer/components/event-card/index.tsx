import { Event } from '../../types';
import CardBody from './card-body';
import Header from './header';
import './style.scss';

interface EventCardProps {
	event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
	return (
		<div className="event-card-container">
			<div className="event-card-wrapper">
        <Header />
        <CardBody event={event} />
			</div>
		</div>
	);
};
export default EventCard;

import { Event } from '../../types';
import CardBody from './card-body';
import Header from './header';
import './style.scss';

interface EventCardProps {
	event: Event;
	ajax_url: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, ajax_url }) => {
	return (
		<div className="event-card-container">
			<div className="event-card-wrapper">
        <Header />
        <CardBody event={event} ajax_url={ajax_url}/>
			</div>
		</div>
	);
};
export default EventCard;

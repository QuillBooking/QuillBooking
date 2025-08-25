import { RendererEvent } from '@quillbooking/types';
import CardBody from './card-body';
import Header from './header';
import './style.scss';

interface EventCardProps {
	event: RendererEvent;
	ajax_url: string;
	url: string;
	globalCurrency: string;
}

const EventCard: React.FC<EventCardProps> = ({
	event,
	ajax_url,
	url,
	globalCurrency,
}) => {
	return (
		<div className="event-card-container">
			<div className="event-card-wrapper">
				<Header color={event.color} />
				<CardBody
					event={event}
					ajax_url={ajax_url}
					url={url}
					globalCurrency={globalCurrency}
				/>
			</div>
		</div>
	);
};
export default EventCard;

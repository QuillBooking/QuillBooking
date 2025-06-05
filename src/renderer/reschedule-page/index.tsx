import { Booking, Event } from '../types';
// import CardBody from './card-body';
// import Header from './header';
import Header from '../components/event-card/header';
import './style.scss';
import CardBody from '../components/event-card/card-body';

interface ReschedulePageProps {
	event: Event;
	ajax_url: string;
	type: string;
	booking: Booking;
	url: string;
	globalCurrency: string;
}

const ReschedulePage: React.FC<ReschedulePageProps> = ({
	event,
	ajax_url,
	type,
	booking,
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
					type={type}
					booking={booking}
					url={url}
					globalCurrency={globalCurrency}
				/>
			</div>
		</div>
	);
};
export default ReschedulePage;

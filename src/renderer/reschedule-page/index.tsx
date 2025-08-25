import { RendererBooking, RendererEvent } from '@quillbooking/types';
// import CardBody from './card-body';
// import Header from './header';
import Header from '../components/event-card/header';
import './style.scss';
import CardBody from '../components/event-card/card-body';

interface ReschedulePageProps {
	event: RendererEvent;
	ajax_url: string;
	type: string;
	booking: RendererBooking;
	url: string;
	globalCurrency: string;
	canReschedule?: boolean;
	rescheduleDeniedMessage?: string;
}

const ReschedulePage: React.FC<ReschedulePageProps> = ({
	event,
	ajax_url,
	type,
	booking,
	url,
	globalCurrency,
	canReschedule = true,
	rescheduleDeniedMessage = '',
}) => {
	// If rescheduling is not allowed, show denial message
	if (!canReschedule) {
		return (
			<div className="event-card-container">
				<div className="event-card-wrapper">
					<Header color={event.color} />
					<div className="reschedule-denied-container">
						<div className="reschedule-denied-message">
							{rescheduleDeniedMessage ||
								'Rescheduling is not allowed for this booking.'}
						</div>
					</div>
				</div>
			</div>
		);
	}

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

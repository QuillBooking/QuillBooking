/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import { Booking } from 'client/types';
import {
	PriceIcon,
	ClockIcon,
	LocationIcon,
	LinkIcon,
	AttendeeIcon,
	LocationDisplay,
	EventUrl,
} from '@quillbooking/components';
import { NavLink as Link } from '@quillbooking/navigation';

interface CardDetailsProps {
	booking: Booking;
	period: string;
}

const CardDetails: React.FC<CardDetailsProps> = ({ booking, period }) => {
	const eventTitle = booking.booking_title || booking.event?.name || '';
	return (
		<Flex gap={12} wrap="wrap" className="flex-1 min-w-0">
			<div className="flex-1 min-w-[200px] max-w-[400px]">
				<Link to={`bookings/${booking.id}/${period}`}>
					<p className="text-lg font-bold text-color-primary-text py-1 break-words">
						{eventTitle}
					</p>
				</Link>
				<Flex gap={3} align="center" className="my-1">
					<ClockIcon />
					<p className="break-words text-sm">
						{`${booking.event.duration} ${__('min', 'quillbooking')} `}{' '}
						{booking.time_span}
					</p>
				</Flex>
				<Flex gap={3} align="center">
					<LocationIcon rectFill={false} width={18} height={18} />
					<LocationDisplay location={booking.location} />
				</Flex>
			</div>

			<div className="flex-1 min-w-[200px] max-w-[400px]">
				<Flex gap={6} align="center">
					<PriceIcon width={18} height={18} rectFill={false} />
					<span className="text-[#71717A] text-xs">
						{__('Price', 'quillbooking')}
					</span>
					<span className="text-[#007AFF] text-sm font-[500] capitalize">
						{booking.order == null &&
							booking.event.payments_settings.enable_payment &&
							__('Not Paid Yet', 'quillbooking')}
						{booking.order != null && booking.order.total}
						{!booking.event.payments_settings.enable_payment &&
							__('Free', 'quillbooking')}
					</span>
				</Flex>

				<Flex gap={3} align="center" className="my-1">
					<span className="text-color-primary-text">
						<AttendeeIcon width={18} height={18} />
					</span>
					<p className="text-sm">
						{__('Attendees', 'quillbooking')} 1{' '}
						{__('person', 'quillbooking')}
					</p>
				</Flex>
				<Flex gap={3} align="center" className="overflow-hidden">
					<span className="text-color-primary-text flex-shrink-0">
						<LinkIcon width={18} height={18} />
					</span>
					<EventUrl
						calendarSlug={booking.event.calendar.slug}
						eventSlug={booking.event.slug}
					/>
				</Flex>
			</div>
		</Flex>
	);
};

export default CardDetails;

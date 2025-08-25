/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/types';
import {
	CardHeader,
	EventUrl,
	LocationDisplay,
	PriceIcon,
} from '@quillbooking/components';
import {
	AllCalendarIcon,
	CalendarInformationIcon,
	ClockIcon,
	HostIcon,
	LinkIcon,
	LocationIcon,
	StatusIcon,
} from '@quillbooking/components';
import InfoItem from '../info-items';

/*
 * Main Meeting Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
}

const MeetingInformation: React.FC<BookingDetailsProps> = ({ booking }) => {
	const eventTitle = booking.booking_title || booking.event?.name || '';
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Booking Information', 'quillbooking')}
				description={__(
					'All Data about Booking Information',
					'quillbooking'
				)}
				icon={<CalendarInformationIcon width={24} height={24} />}
			/>
			<InfoItem
				title={__('Event Title', 'quillbooking')}
				content={eventTitle}
				icon={<AllCalendarIcon width={24} height={24} />}
			/>

			<div className="grid grid-cols-2 gap-4">
				<InfoItem
					title={__('Event Host', 'quillbooking')}
					content={booking.hosts
						.map((host) => host.display_name)
						.join('- ')}
					icon={<HostIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Duration', 'quillbooking')}
					content={booking.event?.duration}
					icon={<ClockIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Location', 'quillbooking')}
					content={<LocationDisplay location={booking.location} />}
					icon={
						<LocationIcon width={24} height={24} rectFill={false} />
					}
				/>
				<InfoItem
					title={__('Status', 'quillbooking')}
					content={booking.status}
					icon={<StatusIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Price', 'quillbooking')}
					content={
						<span className="text-[#007AFF] text-sm font-[500] capitalize">
							{booking.order == null &&
								booking.event.payments_settings
									.enable_payment &&
								__('Not Paid Yet', 'quillbooking')}
							{booking.order != null && booking.order.total}
							{!booking.event.payments_settings.enable_payment &&
								__('Free', 'quillbooking')}
						</span>
					}
					icon={<PriceIcon rectFill={false} width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Link', 'quillbooking')}
					content={
						<EventUrl
							className="text-lg leading-4 font-medium capitalize"
							calendarSlug={booking.event.calendar.slug}
							eventSlug={booking.event.slug}
						/>
					}
					icon={<LinkIcon width={24} height={24} />}
				/>
			</div>
		</div>
	);
};

export default MeetingInformation;

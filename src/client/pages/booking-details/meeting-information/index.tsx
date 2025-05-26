/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import { CardHeader } from '@quillbooking/components';
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
				content={booking.event.name}
				icon={<AllCalendarIcon width={24} height={24} />}
			/>

			<div className="grid grid-cols-2 gap-4">
				<InfoItem
					title={__('Event Host', 'quillbooking')}
					content={booking.calendar?.user?.display_name}
					icon={<HostIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Duration', 'quillbooking')}
					content={booking.event?.duration}
					icon={<ClockIcon width={24} height={24} />}
				/>
				<InfoItem
					title={__('Event Location', 'quillbooking')}
					content={
						booking.location['label'] +
						': ' +
						booking.location['value']
					}
					icon={
						<LocationIcon width={24} height={24} rectFill={false} />
					}
				/>
				<InfoItem
					title={__('Status', 'quillbooking')}
					content={booking.status}
					icon={<StatusIcon width={24} height={24} />}
				/>
				{/* <InfoItem
					title={__('Price', 'quillbooking')}
					content={booking.event.name}
					icon={<AllCalendarIcon width={24} height={24} />}
				/> */}
				<InfoItem
					title={__('Event Link', 'quillbooking')}
					content={booking.event_url}
					icon={<LinkIcon width={24} height={24} />}
					link={true}
				/>
			</div>
		</div>
	);
};

export default MeetingInformation;

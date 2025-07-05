/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/types';
import {
	AttendeeIcon,
	ClockIcon,
	EmailIcon,
	TeamOutlinedIcon,
	TimezoneIcon,
} from '@quillbooking/components';
import { CardHeader } from '@quillbooking/components';
import InfoItem from '../info-items';

/*
 * Main Invitee Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
	handleStatusUpdated?: () => void;
}

const InviteeInformation: React.FC<BookingDetailsProps> = ({
	booking,
	handleStatusUpdated,
}) => {
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
			<CardHeader
				title={__('Invitees Information', 'quillbooking')}
				description={__(
					'All Data about Invitees Information',
					'quillbooking'
				)}
				icon={<TeamOutlinedIcon width={24} height={24} />}
			/>
			<div className="flex flex-col gap-4">
				<InfoItem
					icon={<AttendeeIcon width={24} height={24} />}
					title={__('Invitee Name', 'quillbooking')}
					content={
						Array.isArray(booking.guest)
							? booking.guest.map((g) => g.name).join(', ')
							: booking.guest?.name
					}
				/>

				<InfoItem
					icon={<EmailIcon width={24} height={24} />}
					title={__('Invitee Email', 'quillbooking')}
					content={
						Array.isArray(booking.guest)
							? booking.guest.map((g) => g.email).join(', ')
							: booking.guest?.email
					}
				/>

				<InfoItem
					icon={<TimezoneIcon width={24} height={24} />}
					title={__('Invitee Timezone', 'quillbooking')}
					content={booking.timezone}
				/>

				<InfoItem
					icon={<ClockIcon width={24} height={24} />}
					title={__('Booked At', 'quillbooking')}
					content={booking.created_at}
				/>
			</div>
		</div>
	);
};

export default InviteeInformation;

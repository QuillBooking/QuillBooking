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
import { convertTimezone, getCurrentTimezone } from '@quillbooking/utils';
import InfoItem from '../info-items';

/*
 * Main Invitee Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
	timeFormat: string;
}

const InviteeInformation: React.FC<BookingDetailsProps> = ({
	booking,
	timeFormat,
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
					content={(() => {
						if (!booking.created_at) return '';

						const { date, time } = convertTimezone(
							booking.created_at,
							getCurrentTimezone()
						);

						// Convert to Date object and format properly
						const formattedDate = new Date(
							`${date} ${time}`
						).toLocaleString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit',
							hour12: timeFormat === '12', // Use global time format setting
						});

						return formattedDate;
					})()}
				/>
			</div>
		</div>
	);
};

export default InviteeInformation;

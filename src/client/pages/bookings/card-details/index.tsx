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
	CopyWhiteIcon,
} from '@quillbooking/components';
import { useCopyToClipboard } from '@quillbooking/hooks';
import { NavLink as Link } from '@quillbooking/navigation';

interface CardDetailsProps {
	booking: Booking;
	period: string;
}

const CardDetails: React.FC<CardDetailsProps> = ({ booking, period }) => {
	const copyToClipboard = useCopyToClipboard();

	return (
		<Flex gap={100}>
			<div>
				<Link to={`bookings/${booking.id}/${period}`}>
					<p className="text-xl font-bold text-color-primary-text py-1">
						{booking.event.name}
					</p>
				</Link>
				<Flex gap={5} align="center" className="my-1">
					<ClockIcon />
					<p>
						{`${booking.event.duration} ${__('min', 'quillbooking')} `}{' '}
						{booking.time_span}
					</p>
				</Flex>
				<Flex gap={5} align="center">
					<LocationIcon rectFill={false} width={20} height={20} />
					{booking.event.location.length > 0 &&
						booking.event.location.map((location, index) => (
							<p key={index}>{location.type}</p>
						))}
				</Flex>
			</div>

			<div>
				<Flex gap={10} align="center">
					<PriceIcon width={20} height={21} rectFill={false} />
					<span className="text-[#71717A] text-[12px]">
						{__('Price', 'quillbooking')}
					</span>
					<span className="text-[#007AFF] text-[14px] font-[500] capitalize">
						{__('Free', 'quillbooking')}
					</span>
				</Flex>

				<Flex gap={5} align="center" className="my-1">
					<span className="text-color-primary-text">
						<AttendeeIcon />
					</span>
					<p>
						{__('Attendees', 'quillbooking')} 1
						{__('person', 'quillbooking')}
					</p>
				</Flex>
				<Flex gap={5} align="center">
					<span className="text-color-primary-text">
						<LinkIcon width={24} height={24} />
					</span>
					<a target="_blank" href={booking.event_url}>
						{booking.event_url}
					</a>
					<span
						className="flex items-center gap-1 ml-2 text-color-primary cursor-pointer"
						onClick={() =>
							copyToClipboard(
								booking.event_url,
								__('Event URL copied', 'quillbooking')
							)
						}
					>
						<CopyWhiteIcon width={16} height={16} />
						{__('Copy', 'quillbooking')}
					</span>
				</Flex>
			</div>
		</Flex>
	);
};

export default CardDetails;

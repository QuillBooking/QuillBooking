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
		<Flex gap={12} wrap="wrap" className="flex-1 min-w-0">
			<div className="flex-1 min-w-[200px] max-w-[400px]">
				<Link to={`bookings/${booking.id}/${period}`}>
					<p className="text-lg font-bold text-color-primary-text py-1 break-words">
						{booking.event.name}
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
					{booking.event.location.length > 0 &&
						booking.event.location.map((location, index) => (
							<p
								key={index}
								className="break-words text-s capitalize"
							>
								{location.type.split('_').join(' ')}
							</p>
						))}
				</Flex>
			</div>

			<div className="flex-1 min-w-[200px] max-w-[400px]">
				<Flex gap={6} align="center">
					<PriceIcon width={18} height={18} rectFill={false} />
					<span className="text-[#71717A] text-xs">
						{__('Price', 'quillbooking')}
					</span>
					<span className="text-[#007AFF] text-sm font-[500] capitalize">
						{__('Free', 'quillbooking')}
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
					<a
						target="_blank"
						href={booking.event_url}
						className="truncate text-sm"
					>
						{booking.event_url}
					</a>
					<span
						className="flex items-center gap-1 ml-1 text-color-primary cursor-pointer flex-shrink-0 text-sm"
						onClick={() =>
							copyToClipboard(
								booking.event_url,
								__('Event URL copied', 'quillbooking')
							)
						}
					>
						<CopyWhiteIcon width={14} height={14} />
						{__('Copy', 'quillbooking')}
					</span>
				</Flex>
			</div>
		</Flex>
	);
};

export default CardDetails;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography } from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import { convertTimezone, getCurrentTimezone } from '@quillbooking/utils';
import { CardHeader } from '@quillbooking/components';
import { CompassIcon, FailIcon, SuccesIcon } from '@quillbooking/components';

/*
 * Main Meeting Activites Component
 */
const { Text } = Typography;

interface MeetingActivitiesProps {
	booking: Booking;
}

const MeetingActivities: React.FC<MeetingActivitiesProps> = ({ booking }) => {
	return (
		<div className="border px-10 py-8 rounded-2xl flex flex-col gap-5 max-h-[500px] overflow-y-auto">
			<CardHeader
				title={__('Meeting Activities', 'quillbooking')}
				description={__(
					'Timeline about all Booking Activities',
					'quillbooking'
				)}
				icon={<CompassIcon />}
			/>
			{(booking.logs?.length ?? 0) > 0 ? (
				booking.logs?.map((log) => (
					<div className="flex gap-2">
						<div
							className={`border-2 ${log.type == 'info' ? 'border-[#A5E0B5]' : 'border-[#F7A8A4]'} rounded-3xl`}
						></div>
						<div className="bg-[#F1F1F2] p-2 rounded-md h-fit self-center">
							{log.type == 'info' ? <SuccesIcon /> : <FailIcon />}
						</div>
						<div className="flex flex-col">
							{(() => {
								const { date, time } = convertTimezone(
									log.created_at,
									getCurrentTimezone()
								);

								// Convert to Date object
								const formattedDate = new Date(
									`${date} ${time}`
								).toLocaleString('en-US', {
									year: 'numeric',
									month: 'long', // "March"
									hour: 'numeric',
									minute: '2-digit',
									hour12: true, // AM/PM format
								});

								return <p>{formattedDate}</p>;
							})()}
							<p className="text-sm text-color-primary-text font-semibold">
								{log.message}
							</p>
						</div>
					</div>
				))
			) : (
				<Text type="secondary">
					{__(
						'No activities have been recorded for this booking',
						'quillbooking'
					)}
				</Text>
			)}
		</div>
	);
};

export default MeetingActivities;

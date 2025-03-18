/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Typography } from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import { convertTimezone, getCurrentTimezone } from '@quillbooking/utils';

/*
 * Main Meeting Activites Component
 */
const { Text } = Typography;

interface MeetingActivitiesProps {
	booking: Booking;
}

const MeetingActivities: React.FC<MeetingActivitiesProps> = ({ booking }) => {
	return (
		<Card title="Meeting Activities">
			{(booking.logs?.length ?? 0) > 0 ? (
				booking.logs?.map((log) => (
					<div key={log.id}>
						{(() => {
							const { date, time } = convertTimezone(log.created_at, getCurrentTimezone());
							return (
								<>
									<Text>{date}</Text>
									{" "}
									<Text>{time}</Text>
									{" "}
								</>
							);
						})()}
						<Text>{log.message}</Text>
						<Text>{log.type}</Text>
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
		</Card>
	);
};

export default MeetingActivities;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';


/**
 * External dependencies
 */
import {
	Card,
	Space,
	Typography,
} from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import { getMetaValue } from '@quillbooking/utils';

/*
 * Main Meeting Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
}

type FieldItem = {
	label: string;
	value: string;
};

const { Text } = Typography;

const MeetingInformation: React.FC<BookingDetailsProps>= ({booking}) => {
	const [fields, setFields] = useState<FieldItem[]>([]);

	useEffect(() => {
		if(booking && booking.meta) setFields(getMetaValue(booking.meta, 'fields'));
	}
	, [booking]);
	return (
		<Card title="Meeting Information">
			<Space
				direction="vertical"
				size="middle"
				style={{ display: 'flex' }}
			>
				<Text>
					<strong>{__('Meeting Host', 'quillbooking')}:</strong>{' '}
					{booking.calendar?.user?.display_name}
				</Text>

				<Text>
					<strong>{__('Meeting Title', 'quillbooking')}:</strong>{' '}
					{booking.event?.name}
				</Text>

				<Text>
					<strong>{__('Meeting Duration', 'quillbooking')}:</strong>{' '}
					{booking.event?.duration} {__('minutes', 'quillbooking')}
				</Text>

				<Text>
					<strong>{__('Status', 'quillbooking')}:</strong>{' '}
					{booking.status}
				</Text>

				{fields.map((field:any, index) => (
					<Text key={index}>
						<strong>{field.label}:</strong> {field.value}
					</Text>
				))}
			</Space>
		</Card>
	);
};

export default MeetingInformation;

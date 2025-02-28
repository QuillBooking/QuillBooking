/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlusOutlined } from '@ant-design/icons';

/**
 * External dependencies
 */
import { Button, Flex, Popover, Typography } from 'antd';

/**
 * Main Bookings Component.
 */
const { Title, Text } = Typography;

const BookingsHeader: React.FC = () => {
	return (
		<Flex justify="space-between" align="center">
			<Title level={3}>{__('Bookings', 'quillbooking')}</Title>
			<Popover
				content={
					<Text>{__('Create Booking Manually', 'quillbooking')}</Text>
				}
				trigger={'click'}
			>
				<Button>
					<PlusOutlined />
				</Button>
			</Popover>
		</Flex>
	);
};

export default BookingsHeader;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlusOutlined } from '@ant-design/icons';

/**
 * External dependencies
 */
import { Button, Flex } from 'antd';

/*
 * Internal dependencies
 */
import { Header } from '@quillbooking/components';

interface BookingsHeaderProps {
	handleOpen: (state: boolean) => void;
}
/**
 * Main Bookings Component.
 */
const BookingsHeader: React.FC<BookingsHeaderProps> = ({ handleOpen }) => {
	return (
		<Flex justify="space-between" align="center">
			<Header
				header={__('Bookings', 'quillbooking')}
				subHeader={__(
					'See your scheduled events from your calendar events links.',
					'quillbooking'
				)}
			/>
			<Button
				type="primary"
				className="bg-color-primary text-white"
				size="large"
				onClick={() => {
					handleOpen(true);
				}}
			>
				<PlusOutlined />
				{__('Booking Manually', 'quillbooking')}
			</Button>
		</Flex>
	);
};

export default BookingsHeader;

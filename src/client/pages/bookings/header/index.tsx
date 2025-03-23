/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Popover } from 'antd';

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
	const [visible, setVisible] = useState<boolean>(false);

	return (
		<Flex justify="space-between" align="center">
			<Header
				header={__('Bookings', 'quillbooking')}
				subHeader={__(
					'See your scheduled events from your calendar events links.',
					'quillbooking'
				)}
			/>
			<Popover
				content={
					<Button
						type="link"
						onClick={() => {
							handleOpen(true);
							setVisible(false);
						}}
					>
						{__('Create Booking Manually', 'quillbooking')}
					</Button>
				}
				trigger={'click'}
				open={visible}
				onOpenChange={(visible) => setVisible(visible)}
			>
				<Button>
					<PlusOutlined />
				</Button>
			</Popover>
		</Flex>
	);
};

export default BookingsHeader;

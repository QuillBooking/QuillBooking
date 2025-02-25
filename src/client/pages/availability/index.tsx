/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { Button, Flex, Segmented, Typography } from 'antd';
import AddAvailabilitySechduleModal from './add-schedule-modal';
import AvailabilityList from './availability-list';

/**
 * Main Calendars Component.
 */
const { Title, Paragraph } = Typography;
const Availability: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [isFiltered, setIsFiltered] = useState<boolean>(false);
	return (
		<>
			<Flex justify="space-between" align="center">
				<Typography>
					<Title level={1}>
						{__('Availability', 'quillbooking')}
					</Title>
					<Paragraph>
						{__(
							'Configure times when you are available for bookings.',
							'quillbooking'
						)}
					</Paragraph>
				</Typography>

				<Flex justify="space-between" align="center" gap={10}>
					<Segmented<string>
						options={[
							__('My Schedule', 'quillbooking'),
							__('All Schedule', 'quillbooking'),
						]}
						onChange={() => {
							setIsFiltered((prev) => !prev);
						}}
					/>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						size="large"
						onClick={() => {
							setOpen(true);
						}}
					>
						{__('Add New', 'quillbooking')}
					</Button>
				</Flex>
			</Flex>

			<AvailabilityList isFiltered={isFiltered} />

			{open && (
				<AddAvailabilitySechduleModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => setOpen(false)}
				/>
			)}
		</>
	);
};

export default Availability;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Segmented, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import AddAvailabilitySechduleModal from './add-schedule-modal';
import AvailabilityList from './availability-list';

const { Title, Text } = Typography;

const Availability: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [isFiltered, setIsFiltered] = useState(false);

	// Toggle the filter state
	const handleSegmentChange = useCallback(() => {
		setIsFiltered((prev) => !prev);
	}, []);

	// Open the "Add New" modal
	const handleAddNew = useCallback(() => {
		setOpen(true);
	}, []);

	// Close the modal when done or on cancel
	const handleCloseModal = useCallback(() => {
		setOpen(false);
	}, []);

	return (
		<>
			<Flex justify="space-between" align="center">
				<div>
					<Title level={1}>{__('Availability', 'quillbooking')}</Title>
					<Text>
						{__(
							'Configure times when you are available for bookings.',
							'quillbooking'
						)}
					</Text>
				</div>

				<Flex justify="space-between" align="center" gap={10}>
					<Segmented<string>
						options={[
							__('My Schedule', 'quillbooking'),
							__('All Schedule', 'quillbooking'),
						]}
						onChange={handleSegmentChange}
					/>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						size="large"
						onClick={handleAddNew}
					>
						{__('Add New', 'quillbooking')}
					</Button>
				</Flex>
			</Flex>

			<AvailabilityList isFiltered={isFiltered} />

			{open && (
				<AddAvailabilitySechduleModal
					open={open}
					onClose={handleCloseModal}
					onSaved={handleCloseModal}
				/>
			)}
		</>
	);
};

export default Availability;

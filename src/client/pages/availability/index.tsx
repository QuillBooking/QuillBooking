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
import { Button, Flex } from 'antd';
import AddAvailabilityScheduleModal from './add-schedule-modal';
import AvailabilityList from './availability-list';
import { Header } from '@quillbooking/components';
import SchedulesType from './schedules-type';
import { useCurrentUser } from '@quillbooking/hooks';

/**
 * Main Calendars Component.
 */
const Availability: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [showAllSchedules, setShowAllSchedules] = useState<boolean>(false);
	const canManageAllAvailability = useCurrentUser().hasCapability(
		'quillbooking_manage_all_availability'
	);

	return (
		<>
			<Flex justify="space-between" align="center">
				<Header
					header={__('Availability', 'quillbooking')}
					subHeader={__(
						'Configure times when you are available for bookings.',
						'quillbooking'
					)}
				/>

				<Button
					className="px-8"
					type="primary"
					icon={<PlusOutlined />}
					size="middle"
					onClick={() => {
						setOpen(true);
					}}
				>
					{__('Add New', 'quillbooking')}
				</Button>
			</Flex>

			<SchedulesType
				canManageAllAvailability={canManageAllAvailability}
				showAllSchedules={showAllSchedules}
				setShowAllSchedules={setShowAllSchedules}
			/>

			<AvailabilityList
				showAllSchedules={showAllSchedules}
				openAvailabilityModal={setOpen}
			/>

			<AddAvailabilityScheduleModal open={open} setOpen={setOpen} />
		</>
	);
};

export default Availability;

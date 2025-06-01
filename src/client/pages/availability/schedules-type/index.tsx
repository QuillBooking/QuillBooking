/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import ScheduleItem from './schedule-item';

interface SchedulesTypeProps {
	canManageAllAvailability: boolean;
	showAllSchedules: boolean;
	setShowAllSchedules: (isFiltered: boolean) => void;
}
const SchedulesType: React.FC<SchedulesTypeProps> = ({
	canManageAllAvailability,
	showAllSchedules,
	setShowAllSchedules,
}) => {
	return (
		<div className="my-4 p-4 rounded-md border border-gray-200">
			<Flex align="center" gap={10}>
				{canManageAllAvailability && (
					<ScheduleItem
						title={__('All Schedule', 'quillbooking')}
						active={showAllSchedules}
						onClick={() => setShowAllSchedules(true)}
					/>
				)}
				<ScheduleItem
					title={__('My Schedule', 'quillbooking')}
					active={!showAllSchedules}
					onClick={() => setShowAllSchedules(false)}
				/>
			</Flex>
		</div>
	);
};

export default SchedulesType;

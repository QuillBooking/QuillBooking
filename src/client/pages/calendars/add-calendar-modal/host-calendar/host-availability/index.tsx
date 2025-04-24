/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card, Flex, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, Schedule, ShareEventIcon } from '@quillbooking/components';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { getCurrentTimezone } from '@quillbooking/utils';
import { Calendar } from 'client/types';

const customAvailability = {
	id: 'default',
	user_id: 'default',
	name: __('Default', 'quillbooking'),
	timezone: getCurrentTimezone(),
	weekly_hours: DEFAULT_WEEKLY_HOURS,
	override: {},
};

interface HostAvailabilityProps {
	formData: Partial<Calendar & { members: number[] }>;
	updateFormData: (
		key: keyof HostAvailabilityProps['formData'],
		value: any
	) => void;
	open: boolean;
	loading: boolean;
	closeHandler: () => void;
	saveCalendar: () => void;
}

const HostAvailability: React.FC<HostAvailabilityProps> = ({
	open,
	closeHandler,
	loading,
	saveCalendar,
	updateFormData,
}) => {
	return (
		<Modal
			open={open}
			onCancel={closeHandler}
			className="rounded-lg"
			footer={[
				<Button
					size="large"
					key="action"
					type="primary"
					loading={loading}
					onClick={saveCalendar}
					className="w-full bg-color-primary rounded-lg font-[500] mt-5"
				>
					{__('Confirm', 'quillbooking')}
				</Button>,
			]}
		>
			<Flex vertical>
				<Flex gap={10} className="items-center">
					<CardHeader
						title={__('Add New Calendar Host', 'quillbooking')}
						description={__(
							'Add the following data to Add New Calendar Host',
							'quillbooking'
						)}
						icon={<ShareEventIcon />}
					/>
				</Flex>
				<Card>
					<Schedule
						availability={customAvailability}
						onCustomAvailabilityChange={(day, field, value) => {
							const updatedAvailability = {
								...customAvailability,
							};
							if (field === 'off') {
								updatedAvailability.weekly_hours[day].off =
									value;
							} else {
								updatedAvailability.weekly_hours[day].times =
									value;
							}
							updateFormData('availability', updatedAvailability);
						}}
					/>
				</Card>
			</Flex>
		</Modal>
	);
};

export default HostAvailability;

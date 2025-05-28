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
import {
	CardHeader,
	Schedule,
	UpcomingCalendarOutlinedIcon,
} from '@quillbooking/components';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { getCurrentTimezone } from '@quillbooking/utils';
import { Calendar } from 'client/types';
import { useEffect, useState } from '@wordpress/element';
import { useApi } from '@quillbooking/hooks';

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
	const [startDay, setStartDay] = useState<string>('monday');
	const [timeFormat, setTimeFormat] = useState<string>('12');
	const { callApi } = useApi();
	const fetchGlobalSettings = () => {
		callApi({
			path: 'settings',
			method: 'GET',
			onSuccess: (data) => {
				setStartDay(data.general?.start_from || 'monday');
				setTimeFormat(data.general?.time_format || '12');
			},
			onError: (error) => {
				console.error('Error fetching start day:', error);
			},
		});
	};

	useEffect(() => {
		fetchGlobalSettings();
	}, []);

	return (
		<Modal
			open={open}
			onCancel={closeHandler}
			className="rounded-lg"
			width={{
				xs: '90%',
				sm: '80%',
				md: '70%',
				lg: '60%',
				xl: '50%',
				xxl: '40%',
			}}
			footer={[
				<Button
					size="large"
					key="action"
					type="primary"
					loading={loading}
					onClick={saveCalendar}
					className="w-full bg-color-primary rounded-lg font-[500] mt-5"
				>
					{__('Add New Host', 'quillbooking')}
				</Button>,
			]}
		>
			<Flex vertical>
				<CardHeader
					title={__('Add New Calendar Host', 'quillbooking')}
					description={__(
						'Add the following data to Add New Calendar Host',
						'quillbooking'
					)}
					icon={<UpcomingCalendarOutlinedIcon />}
				/>
				<Flex vertical>
					<div className="pb-2">
						<div className="text-[#09090B] text-[16px] mt-5">
							{__('Select Host Availability', 'quillbooking')}
							<span className="text-red-500">*</span>
						</div>
						<p className="text-[#818181] text-[14px]">
							{__(
								'Control Host availability and Works time at different time of days',
								'quillbooking'
							)}
						</p>
					</div>
					<Card>
						<Schedule
							timeFormat={timeFormat}
							startDay={startDay}
							availability={customAvailability}
							onCustomAvailabilityChange={(day, field, value) => {
								const updatedAvailability = {
									...customAvailability,
								};
								if (field === 'off') {
									updatedAvailability.weekly_hours[day].off =
										value;
								} else {
									updatedAvailability.weekly_hours[
										day
									].times = value;
								}
								updateFormData(
									'availability' as keyof Calendar,
									updatedAvailability
								);
							}}
						/>
					</Card>
				</Flex>
			</Flex>
		</Modal>
	);
};

export default HostAvailability;

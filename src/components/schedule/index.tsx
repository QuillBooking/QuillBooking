import { Flex, Switch, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { __ } from '@wordpress/i18n';

const { Text } = Typography;

interface ScheduleComponentProps {
	availability: {
		weekly_hours: {
			[key: string]: {
				off: boolean;
				times: { start: string; end: string }[];
			};
		};
	};
	onCustomAvailabilityChange: (
		dayKey: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => void;
	startDay: string;
	timeFormat: string;
}

const ScheduleComponent: React.FC<ScheduleComponentProps> = ({
	availability,
	startDay,
	timeFormat,
	onCustomAvailabilityChange,
}) => {
	// Define the standard week order
	const weekOrder = [
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday',
	];

	// Function to reorder days based on startDay
	const getReorderedDays = () => {
		const startIndex = weekOrder.indexOf(startDay.toLowerCase());
		if (startIndex === -1) {
			// If startDay is not found, return original order
			return Object.keys(availability.weekly_hours);
		}

		// Create new order starting from the specified day
		const reorderedWeek = [
			...weekOrder.slice(startIndex),
			...weekOrder.slice(0, startIndex),
		];

		// Filter to only include days that exist in availability.weekly_hours
		return reorderedWeek.filter((day) => availability.weekly_hours[day]);
	};

	// Get the display format based on timeFormat setting
	const getTimeDisplayFormat = () => {
		return timeFormat === '24' ? 'HH:mm' : 'hh:mm A';
	};

	// Get the storage format (always use HH:mm for consistency)
	const getTimeStorageFormat = () => {
		return 'HH:mm';
	};

	// Helper function to validate and swap times if needed
	const validateAndSwapTimes = (startTime: string, endTime: string) => {
		const start = dayjs(startTime, getTimeStorageFormat());
		const end = dayjs(endTime, getTimeStorageFormat());

		// If start time is after end time, swap them
		if (start.isAfter(end)) {
			return {
				start: endTime,
				end: startTime,
			};
		}

		return {
			start: startTime,
			end: endTime,
		};
	};

	const orderedDays = getReorderedDays();

	return (
		<>
			{orderedDays.map((key) => {
				const day = availability.weekly_hours[key];
				return (
					<Flex key={key} align="center" gap={15} className="mb-5">
						<Flex gap={10} className="items-center w-[145px]">
							<Switch
								checked={!day.off}
								onChange={(checked) =>
									onCustomAvailabilityChange(
										key,
										'off',
										!checked
									)
								}
								className={`${!day.off ? 'bg-color-primary' : 'bg-gray-400'}`}
							/>
							<Text className="capitalize text-[#1E2125] text-[16px] font-[700] flex-1">
								{key}
							</Text>
						</Flex>
						<TimePicker
							value={dayjs(
								day.times[0].start,
								getTimeStorageFormat()
							)}
							onChange={(time) => {
								if (time) {
									const newStartTime = time.format(
										getTimeStorageFormat()
									);
									const validatedTimes = validateAndSwapTimes(
										newStartTime,
										day.times[0].end
									);

									onCustomAvailabilityChange(key, 'times', [
										{
											start: validatedTimes.start,
											end: validatedTimes.end,
										},
									]);
								}
							}}
							format={getTimeDisplayFormat()}
							placeholder="Start Time"
							prefix={
								<span className="text-[#9BA7B7]">
									{__('From', 'quillbooking')}
								</span>
							}
							className="h-[48px] rounded-lg flex-1 custom-timepicker"
							disabled={day.off}
							suffixIcon={null}
							use12Hours={timeFormat === '12'}
							getPopupContainer={(trigger) =>
								trigger.parentElement || document.body
							}
						/>
						<TimePicker
							value={dayjs(
								day.times[0].end,
								getTimeStorageFormat()
							)}
							onChange={(time) => {
								if (time) {
									const newEndTime = time.format(
										getTimeStorageFormat()
									);
									const validatedTimes = validateAndSwapTimes(
										day.times[0].start,
										newEndTime
									);

									onCustomAvailabilityChange(key, 'times', [
										{
											start: validatedTimes.start,
											end: validatedTimes.end,
										},
									]);
								}
							}}
							format={getTimeDisplayFormat()}
							placeholder="End Time"
							suffixIcon={null}
							prefix={
								<span className="text-[#9BA7B7]">
									{__('To', 'quillbooking')}
								</span>
							}
							className="h-[48px] rounded-lg flex-1 custom-timepicker"
							disabled={day.off}
							use12Hours={timeFormat === '12'}
							getPopupContainer={(trigger) =>
								trigger.parentElement || document.body
							}
						/>
					</Flex>
				);
			})}
		</>
	);
};

export default ScheduleComponent;

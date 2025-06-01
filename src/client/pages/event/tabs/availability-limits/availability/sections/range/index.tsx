/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, DatePicker, Typography, InputNumber } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

/**
 * Internal dependencies
 */
import type { AvailabilityRange } from '@quillbooking/client';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Text } = Typography;

interface RangeSectionProps {
	range: AvailabilityRange;
	onRangeTypeChange: (type: 'days' | 'date_range' | 'infinity') => void;
	onDaysChange: (days: number) => void;
	onDateRangeChange: (start_date: string, end_date: string) => void;
}

const RangeSection: React.FC<RangeSectionProps> = ({
	range,
	onRangeTypeChange,
	onDaysChange,
	onDateRangeChange,
}) => {
	// Function to ensure consistent date formatting
	const formatDateString = (date: dayjs.Dayjs | null): string => {
		if (!date) return '';
		// Use UTC to avoid timezone issues
		return date.format('YYYY-MM-DD');
	};

	// Function to parse dates consistently
	const parseDate = (dateString: string | undefined): dayjs.Dayjs | null => {
		if (!dateString) return null;
		// Parse the date in UTC to avoid timezone issues
		return dayjs.utc(dateString);
	};

	// Disable dates before today
	const disabledDate = (current: dayjs.Dayjs): boolean => {
		return current && current < dayjs().startOf('day');
	};

	return (
		<Flex vertical gap={10} className="mt-5">
			<Text className="text-[#3F4254] text-base font-semibold">
				{__('Availability Range', 'quillbooking')}
				<span className="text-[#71717A] italic text-base font-normal pl-1">
					{__('(Invitees can schedule)', 'quillbooking')}
				</span>
			</Text>
			<Radio.Group
				value={range.type}
				onChange={(e) => onRangeTypeChange(e.target.value)}
				className="flex gap-1"
			>
				<Radio
					value="days"
					className={`border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${
						range.type === 'days'
							? 'border-color-primary bg-color-secondary'
							: ''
					}`}
				>
					{__('Within Future Days', 'quillbooking')}
				</Radio>
				<Radio
					value="date_range"
					className={`border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${
						range.type === 'date_range'
							? 'border-color-primary bg-color-secondary'
							: ''
					}`}
				>
					{__('Within a Date Range', 'quillbooking')}
				</Radio>
				<Radio
					value="infinity"
					className={`border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${
						range.type === 'infinity'
							? 'border-color-primary bg-color-secondary'
							: ''
					}`}
				>
					{__('Indefinitely into the future', 'quillbooking')}
				</Radio>
			</Radio.Group>
			{range.type === 'days' && (
				<InputNumber
					controls={false}
					value={range.days}
					onChange={(value) => {
						if (value !== null) {
							onDaysChange(value);
						}
					}}
					placeholder={__('Enter number of days', 'quillbooking')}
					suffix={
						<span className="text-[#9BA7B7] border-l pl-4">
							{__('Days into the future', 'quillbooking')}
						</span>
					}
					className="mt-4 rounded-lg h-[48px] flex items-center w-full"
				/>
			)}
			{range.type === 'date_range' && (
				<Flex gap={20} className="mt-4">
					<DatePicker
						value={parseDate(range.start_date)}
						onChange={(date) => {
							if (date) {
								onDateRangeChange(
									formatDateString(date),
									range.end_date ?? ''
								);
							}
						}}
						format="MM/DD/YYYY"
						placeholder="Start Date"
						className="w-full h-[48px] rounded-lg"
						getPopupContainer={(trigger) =>
							trigger.parentElement || document.body
						}
						disabledDate={disabledDate}
						prefix={
							<span className="text-[#9BA7B7] pr-[10px]">
								{__('From', 'quillbooking')}
							</span>
						}
					/>

					<DatePicker
						value={parseDate(range.end_date)}
						onChange={(date) => {
							if (date) {
								onDateRangeChange(
									range.start_date ?? '',
									formatDateString(date)
								);
							}
						}}
						format="MM/DD/YYYY"
						placeholder="End Date"
						className="w-full h-[48px] rounded-lg"
						getPopupContainer={(trigger) =>
							trigger.parentElement || document.body
						}
						disabledDate={(current) => {
							// Disable dates before the start date or before today
							const startDate = range.start_date
								? dayjs.utc(range.start_date)
								: dayjs().startOf('day');
							return (
								current < startDate ||
								current < dayjs().startOf('day')
							);
						}}
						prefix={
							<span className="text-[#9BA7B7] pr-[10px]">
								{__('To', 'quillbooking')}
							</span>
						}
					/>
				</Flex>
			)}
		</Flex>
	);
};

export default RangeSection;

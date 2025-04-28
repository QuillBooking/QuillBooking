/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, DatePicker, Typography, InputNumber } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type { AvailabilityRange } from '@quillbooking/client';

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
						value={dayjs(range.start_date)}
						onChange={(date) => {
							if (date) {
								onDateRangeChange(
									date.format('YYYY-MM-DD'),
									range.end_date ?? ''
								);
							}
						}}
						placeholder="Start Date"
						className="w-full h-[48px] rounded-lg"
						getPopupContainer={(trigger) =>
							trigger.parentElement || document.body
						}
						prefix={
							<span className="text-[#9BA7B7] pr-[10px]">
								{__('From', 'quillbooking')}
							</span>
						}
					/>

					<DatePicker
						value={dayjs(range.end_date)}
						onChange={(date) => {
							if (date) {
								onDateRangeChange(
									range.start_date ?? '',
									date.format('YYYY-MM-DD')
								);
							}
						}}
						placeholder="End Date"
						className="w-full h-[48px] rounded-lg"
						getPopupContainer={(trigger) =>
							trigger.parentElement || document.body
						}
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

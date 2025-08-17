import { __ } from '@wordpress/i18n';
import { Flex, Button, Typography, Card, TimePicker, DatePicker } from 'antd';
import { isEmpty } from 'lodash';
import dayjs from 'dayjs';

import type { DateOverrides, TimeSlot } from '@quillbooking/types';
import { LimitsAddIcon, TrashIcon } from '@quillbooking/components';
import './style.scss';

const { Text } = Typography;

interface OverrideSectionProps {
	dateOverrides: DateOverrides;
	setDateOverrides: (overrides: DateOverrides) => void;
	setDisabled: (value: boolean) => void;
	updatedAvailabilities?: (newOverrides: DateOverrides) => void;
}

const OverrideSection: React.FC<OverrideSectionProps> = ({
	dateOverrides,
	setDateOverrides,
	setDisabled,
	updatedAvailabilities,
}) => {
	const onAddOverride = () => {
		setDisabled(false);
		const newOverrides: DateOverrides = {
			...dateOverrides,
			'': [
				...(dateOverrides[''] || []),
				{ start: '09:00', end: '17:00' } as TimeSlot,
			],
		};
		setDateOverrides(newOverrides);
		updatedAvailabilities?.(newOverrides);
	};
	const onRemoveOverride = (date: string, idx: number) => {
		setDisabled(false);
		const times = [...(dateOverrides[date] || [])];
		times.splice(idx, 1);
		const newOverrides: DateOverrides = { ...dateOverrides };

		if (times.length) {
			newOverrides[date] = times;
		} else {
			delete newOverrides[date];
		}

		setDateOverrides(newOverrides);
		updatedAvailabilities?.(newOverrides);
	};

	const onDateChange = (
		newDate: string | null,
		oldDate: string,
		idx: number
	) => {
		setDisabled(false);
		const oldTimes = [...(dateOverrides[oldDate] || [])];
		const [moved] = oldTimes.splice(idx, 1);

		const updated: DateOverrides = { ...dateOverrides };
		if (oldTimes.length) {
			updated[oldDate] = oldTimes;
		} else {
			delete updated[oldDate];
		}

		const key = newDate || '';
		updated[key] = [...(updated[key] || []), moved];
		setDateOverrides(updated);
		updatedAvailabilities?.(updated);
	};

	// Updated function to handle both start and end time changes
	const onUpdateTimeRange = (
		date: string,
		idx: number,
		start: string,
		end: string
	) => {
		setDisabled(false);
		const times = [...(dateOverrides[date] || [])];
		times[idx] = { ...times[idx], start, end };
		setDateOverrides({ ...dateOverrides, [date]: times });
		updatedAvailabilities?.({ ...dateOverrides, [date]: times });
	};

	const entries = Object.entries(dateOverrides).flatMap(([date, times]) =>
		times.map((time, index) => ({ date, time, index }))
	);

	return (
		<Card className="w-full">
			<Flex vertical gap={20}>
				<Flex vertical>
					<Text className="text-[#09090B] font-bold text-[20px]">
						{__('Date-specific hours', 'quillbooking')}
					</Text>
					<Text className="text-[#71717A] text-[12px]">
						{__(
							'Override your availability for specific dates when your hours differ from your regular weekly hours.',
							'quillbooking'
						)}
					</Text>
				</Flex>

				{isEmpty(entries) && (
					<Button
						onClick={onAddOverride}
						className="border-none bg-color-primary text-white w-fit rounded-lg"
					>
						{__('Add an override', 'quillbooking')}
					</Button>
				)}

				<Flex vertical gap={20}>
					{entries.map(({ date, time, index }, key) => (
						<Flex
							align="center"
							gap={10}
							key={`${date}-${index}-${key}`}
						>
							<Flex
								flex={1}
								className="border border-[#E4E7EC] p-2 rounded-lg"
								align="center"
								gap={10}
							>
								<DatePicker
									value={date ? dayjs(date) : null}
									onChange={(val) =>
										onDateChange(
											val?.format('YYYY-MM-DD') || null,
											date,
											index
										)
									}
									style={{ width: '100%' }}
									getPopupContainer={(trigger) =>
										trigger.parentElement || document.body
									}
									suffixIcon={null}
									className="border-none focus-within:shadow-none focus:shadow-none flex-1"
								/>

								<div className="border-l-2 border-[#E4E7EC] h-5"></div>

								<TimePicker.RangePicker
									separator={
										<span className="text-[#9BA7B7]">
											-
										</span>
									}
									suffixIcon={null}
									className="border-none focus-within:shadow-none focus:shadow-none flex-1/2"
									getPopupContainer={(trigger) =>
										trigger.parentElement || document.body
									}
									format="hh:mm A"
									value={[
										dayjs(time.start, 'HH:mm'),
										dayjs(time.end, 'HH:mm'),
									]}
									onChange={(values) => {
										if (values) {
											const [start, end] = values;
											onUpdateTimeRange(
												date,
												index,
												start
													? start.format('HH:mm')
													: '',
												end ? end.format('HH:mm') : ''
											);
										}
									}}
								/>
							</Flex>

							<Button
								onClick={onAddOverride}
								className="border-none shadow-none p-0"
							>
								<LimitsAddIcon />
							</Button>

							<Button
								danger
								size="small"
								onClick={() => onRemoveOverride(date, index)}
								className="border-none shadow-none p-0"
							>
								<TrashIcon width={24} height={24} />
							</Button>
						</Flex>
					))}
				</Flex>
			</Flex>
		</Card>
	);
};

export default OverrideSection;

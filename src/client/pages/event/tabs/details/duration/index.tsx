import { __ } from '@wordpress/i18n';
import { PiClockClockwiseFill } from 'react-icons/pi';
import React, { useEffect, useState } from 'react';
import { Flex, Card, Input, Switch, Select } from 'antd';
import { CardHeader } from '@quillbooking/components';

interface DurationProps {
	duration: number;
	onChange: (key: string, value: any) => void;
	handleAdditionalSettingsChange: (key: string, value: any) => void;
	getDefaultDurationOptions: () => { value: number; label: string }[];
	selectable_durations: number[];
	default_duration: number;
	allow_attendees_to_select_duration: boolean;
	disabled?: boolean;
}

const Duration: React.FC<DurationProps> = ({
	duration,
	onChange,
	handleAdditionalSettingsChange,
	getDefaultDurationOptions,
	selectable_durations = [],
	default_duration,
	allow_attendees_to_select_duration,
}) => {
	const durations = [
		{
			value: 15,
			label: __('15 Minutes', 'quillbooking'),
			description: __('Quick Check-in', 'quillbooking'),
		},
		{
			value: 30,
			label: __('30 Minutes', 'quillbooking'),
			description: __('Standard Consultation', 'quillbooking'),
		},
		{
			value: 60,
			label: __('60 Minutes', 'quillbooking'),
			description: __('In-depth discussion', 'quillbooking'),
		},
	];

	const [selectedDuration, setSelectedDuration] = useState<number>(
		() => durations.find((d) => d.value === duration)?.value || durations[0].value
	);

	// Sync effect for single duration mode
	useEffect(() => {
		setSelectedDuration(duration);
	}, [duration]);

	// Effect to keep default_duration in sync with selectable_durations
	useEffect(() => {
		if (!allow_attendees_to_select_duration) return;

		// If there are no selectable durations, clear the default
		if (selectable_durations.length === 0) {
			if (default_duration !== undefined) {
				handleAdditionalSettingsChange('default_duration', undefined);
			}
			return;
		}

		// If current default isn't in selectable durations, set to first available
		if (default_duration && !selectable_durations.includes(default_duration)) {
			handleAdditionalSettingsChange('default_duration', selectable_durations[0]);
		}
		// If there's no default but there are selectable durations, set to first
		else if (!default_duration && selectable_durations.length > 0) {
			handleAdditionalSettingsChange('default_duration', selectable_durations[0]);
		}
	}, [selectable_durations, default_duration, allow_attendees_to_select_duration]);

	const handleSelect = (value: number) => {
		setSelectedDuration(value);
		onChange('duration', value);
	};

	const durationOptions = Array.from({ length: 96 }, (_, i) => ({
		value: (i + 1) * 5,
		label: `${(i + 1) * 5} minutes`,
	}));

	// Filter options for default duration dropdown
	const filteredDefaultOptions = getDefaultDurationOptions().filter(option =>
		selectable_durations.includes(option.value)
	);

	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Set Duration', 'quillbooking')}
				description={__(
					'Define how long your event will be. it can be as long as 12 hours.',
					'quillbooking'
				)}
				icon={<PiClockClockwiseFill className="text-[28px]" />}
			/>
			<Flex className="items-center mt-4 justify-between">
				<Flex vertical gap={1}>
					<div className="text-[#09090B] text-[16px] font-semibold">
						{__('Allow attendee to select duration', 'quillbooking')}
					</div>
					<div className="text-[#71717A]">
						{__(
							'By selecting this option, you can set more than one duration for the attendee.',
							'quillbooking'
						)}
					</div>
				</Flex>
				<Switch
					checked={allow_attendees_to_select_duration}
					onChange={(checked) => {
						handleAdditionalSettingsChange(
							'allow_attendees_to_select_duration',
							checked
						);
					}}
					className={
						allow_attendees_to_select_duration
							? 'bg-color-primary'
							: 'bg-gray-400'
					}
				/>
			</Flex>
			<Flex vertical gap={20} className="mt-4">
				{allow_attendees_to_select_duration ? (
					<>
						<Flex vertical gap={8}>
							<div className="text-[#09090B] text-[16px]">
								{__('Available Durations', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Select
								mode="multiple"
								options={durationOptions}
								value={selectable_durations}
								getPopupContainer={(trigger) => trigger.parentElement}
								onChange={(values) => {
									handleAdditionalSettingsChange('selectable_durations', values);
								}}
								className="rounded-lg min-h-[48px]"
							/>
						</Flex>
						<Flex vertical gap={8}>
							<div className="text-[#09090B] text-[16px]">
								{__('Default Duration', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Select
								options={filteredDefaultOptions}
								getPopupContainer={(trigger) => trigger.parentElement}
								value={default_duration}
								onChange={(value) => {
									handleAdditionalSettingsChange('default_duration', value);
								}}
								className="rounded-lg h-[48px]"
								disabled={selectable_durations.length === 0}
							/>
						</Flex>
					</>
				) : (
					<>
						<Flex vertical gap={8} className="mt-4">
							<div className="text-[#09090B] text-[16px]">
								{__('Meeting Duration', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Flex gap={20} className="flex-wrap">
								{durations.map((item) => (
									<Card
										key={item.value}
										className={`cursor-pointer transition-all rounded-lg w-[190px] ${selectedDuration == item.value
												? 'border-color-primary bg-[#F1E0FF]'
												: 'border-[#f0f0f0]'
											}`}
										onClick={() => handleSelect(item.value)}
										bodyStyle={{ paddingTop: '18px' }}
									>
										<div
											className={`font-semibold ${selectedDuration == item.value
													? 'text-color-primary'
													: 'text-[#1E2125]'
												}`}
										>
											{item.label}
										</div>
										<div className="text-[#1E2125] mt-[6px]">
											{item.description}
										</div>
									</Card>
								))}
							</Flex>
						</Flex>
						<Flex gap={20} className="items-center">
							<div className="text-[#09090B] text-[16px]">
								{__('Custom Duration', 'quillbooking')}
							</div>
							<Input
								type="number"
								suffix={
									<span className="border-l pl-3">
										{__('Min', 'quillbooking')}
									</span>
								}
								className="h-[48px] rounded-lg flex items-center w-[194px]"
								value={duration}
								onChange={(e) => onChange('duration', Number(e.target.value))}
							/>
						</Flex>
					</>
				)}
			</Flex>
		</Card>
	);
};

export default Duration;
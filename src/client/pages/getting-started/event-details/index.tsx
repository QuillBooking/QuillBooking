/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
import { Card, Flex, Input, Select } from 'antd';
/**
 * Internal dependencies
 */
import { ColorSelector } from '@quillbooking/components';
import { GettingStartedComponentProps } from '@quillbooking/types';

interface FormErrors {
	name?: string;
	timezone?: string;
	location?: string;
}

interface ExtendedGettingStartedProps extends GettingStartedComponentProps {
	errors?: FormErrors;
}

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

const EventDetails: React.FC<ExtendedGettingStartedProps> = ({
	event,
	onEventChange = () => { },
	errors = {},
}) => {
	return (
		<Flex vertical gap={20} className="">
			<Card className="bg-white">
				<Flex vertical gap={20}>
					<Flex gap={15} className="w-full">
						<Flex vertical gap={4} className="w-1/2">
							<div className="text-[#09090B] text-[16px] font-medium">
								{__('Event Type', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Select
								getPopupContainer={(trigger) =>
									trigger.parentElement
								}
								placeholder={__(
									'Select Event Type',
									'quillbooking'
								)}
								value={event.type}
								onChange={(value) =>
									onEventChange('type', value)
								}
								options={[
									{
										label: 'One to One',
										value: 'one-to-one',
									},
									{ label: 'Group', value: 'group' },
								]}
								className="h-[48px] rounded-lg"
							/>
						</Flex>
						<Flex vertical gap={4} className="w-1/2">
							<div className="text-[#09090B] text-[16px] font-medium">
								{__('Event Calendar Name', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Input
								placeholder={__(
									'Enter name of this event calendar',
									'quillbooking'
								)}
								value={event.name}
								onChange={(e) =>
									onEventChange('name', e.target.value)
								}
								className={`h-[48px] rounded-lg ${errors.name ? 'border-red-500' : ''}`}
								status={errors.name ? 'error' : undefined}
							/>
							{errors.name && (
								<div className="text-red-500 text-sm mt-1">
									{errors.name}
								</div>
							)}
						</Flex>
					</Flex>
					<Flex vertical gap={4}>
						<div className="text-[#09090B] text-[16px] font-medium">
							{__('Description', 'quillbooking')}
						</div>
						<Input.TextArea
							rows={4}
							placeholder={__(
								'type your description',
								'quillbooking'
							)}
							value={event.description || ''}
							onChange={(e) =>
								onEventChange('description', e.target.value)
							}
							className="w-full rounded-lg"
						/>
					</Flex>
					<Flex gap={4} vertical>
						<div className="text-[#09090B] text-[16px] font-medium">
							{__('Event Color', 'quillbooking')}
						</div>
						<div className="flex flex-wrap gap-4 place-items-center mt-2">
							<ColorSelector
								selectedColor={event.color || null}
								onColorSelect={(color) =>
									onEventChange('color', color)
								}
							/>
						</div>
					</Flex>
				</Flex>
			</Card>
			<Card>
				<Flex vertical gap={20}>
					<Flex vertical gap={10} className="">
						<div className="text-[#09090B] text-[16px] font-medium">
							{__('Meeting Duration', 'quillbooking')}
							<span className="text-red-500">*</span>
						</div>
						<Flex gap={20} className="flex-wrap">
							{durations.map((item) => (
								<Card
									key={item.value}
									className={`cursor-pointer transition-all rounded-lg w-[200px]
                                                                ${event.duration == item.value ? 'border-color-primary bg-[#F1E0FF]' : 'border-[#f0f0f0]'}`}
									onClick={() =>
										onEventChange('duration', item.value)
									}
									bodyStyle={{
										paddingTop: '18px',
									}}
								>
									<div
										className={`font-semibold ${event.duration == item.value ? 'text-color-primary' : 'text-[#1E2125]'}`}
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
						<div className="text-[#09090B] text-[16px] font-medium">
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
							value={event.duration}
							onChange={(e) =>
								onEventChange(
									'duration',
									parseInt(e.target.value) || 0
								)
							}
						/>
					</Flex>
				</Flex>
			</Card>
		</Flex>
	);
};

export default EventDetails;

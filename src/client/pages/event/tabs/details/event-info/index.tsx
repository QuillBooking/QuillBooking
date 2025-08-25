/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
import { Flex, Card, Input } from 'antd';
/**
 * Internal dependencies
 */

import {
	CardHeader,
	ColorSelector,
	EventInfoIcon,
} from '@quillbooking/components';

interface EventInfoProps {
	name: string;
	description?: string | null;
	color: string;
	onChange: (key: string, value: any) => void;
}

const EventInfo: React.FC<EventInfoProps> = ({
	name,
	description,
	color,
	onChange,
}) => {
	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Event Details', 'quillbooking')}
				description={__(
					'Set your Event Name and Event Host.',
					'quillbooking'
				)}
				icon={<EventInfoIcon />}
			/>
			<Flex vertical className="border-b pb-4">
				<Flex gap={1} vertical className="mt-4">
					<div className="text-[#09090B] text-[16px]">
						{__('Event Calendar Name', 'quillbooking')}
						<span className="text-red-500">*</span>
					</div>
					<Input
						value={name}
						onChange={(e) => onChange('name', e.target.value)}
						placeholder={__(
							'Enter name of this event calendar',
							'quillbooking'
						)}
						className="h-[48px] rounded-lg"
					/>
				</Flex>
				<Flex gap={1} vertical className="mt-4">
					<div className="text-[#09090B] text-[16px]">
						{__('Description', 'quillbooking')}
					</div>
					<Input.TextArea
						value={description || ''}
						onChange={(e) =>
							onChange('description', e.target.value)
						}
						placeholder={__(
							'type your Description',
							'quillbooking'
						)}
						rows={4}
						className="rounded-lg"
					/>
				</Flex>
			</Flex>
			<Flex vertical>
				<Flex gap={1} vertical className="mt-4">
					<div className="text-[#09090B] text-[16px]">
						{__('Event Color', 'quillbooking')}
					</div>
					<div className="flex flex-wrap gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={color || null}
							onColorSelect={(color) => onChange('color', color)}
						/>
					</div>
				</Flex>
			</Flex>
		</Card>
	);
};

export default EventInfo;

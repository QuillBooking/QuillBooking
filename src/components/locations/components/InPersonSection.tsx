import React from 'react';
import { __ } from '@wordpress/i18n';
import { Flex, Checkbox, Button } from 'antd';
import type { ExtendedLocation } from '../types';
import { EditIcon } from '@quillbooking/components';

interface InPersonSectionProps {
	locations: ExtendedLocation[];
	cachedLocationData: Record<string, any>;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	onEditLocation: (type: string, customId?: string) => void;
}

const InPersonSection: React.FC<InPersonSectionProps> = ({
	locations,
	cachedLocationData,
	onCheckboxChange,
	onEditLocation,
}) => {
	const renderLocationCheckbox = (
		type: 'attendee_address' | 'person_address',
		title: string,
		defaultText: string
	) => {
		const location = locations.find((loc) => loc.type === type);
		const cachedFields = cachedLocationData[type] || {};
		const displayText =
			location?.fields?.location || cachedFields?.location;

		return (
			<Checkbox
				className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
					locations.some((loc) => loc.type === type)
						? 'border-color-primary bg-color-secondary'
						: 'border-[#D3D4D6] bg-white'
				}`}
				checked={locations.some((loc) => loc.type === type)}
				onChange={(e) => onCheckboxChange(type, e.target.checked)}
			>
				{type === 'attendee_address' ? (
					<Flex vertical>
						<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
							{__(title, 'quillbooking')}
						</div>
						<div className="text-[#9197A4] text-[12px] italic ml-2">
							{__(defaultText, 'quillbooking')}
						</div>
					</Flex>
				) : (
					<Flex align="center" className="justify-between">
						<Flex vertical className="w-[505px]">
							<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
								{__(title, 'quillbooking')}
							</div>
							<div className="text-[#3F4254] text-[12px] italic ml-2">
								{displayText || (
									<span className="text-[#9197A4]">
										{__(defaultText, 'quillbooking')}
									</span>
								)}
							</div>
						</Flex>
						{location?.fields?.location && (
							<Button
								onClick={() => onEditLocation(type)}
								className="bg-transparent border-none text-[#3F4254] shadow-none"
							>
								<EditIcon />
								{__('Edit', 'quillbooking')}
							</Button>
						)}
					</Flex>
				)}
			</Checkbox>
		);
	};

	return (
		<Flex vertical gap={10} className="justify-start items-start">
			<div className="text-[#09090B] text-[16px]">
				{__('In Person', 'quillbooking')}
			</div>
			{renderLocationCheckbox(
				'attendee_address',
				'Attendee Address',
				'In Person'
			)}
			{renderLocationCheckbox(
				'person_address',
				'Organizer Address',
				'In Person'
			)}
		</Flex>
	);
};

export default InPersonSection;

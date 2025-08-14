import React from 'react';
import { __ } from '@wordpress/i18n';
import { Flex, Checkbox, Button } from 'antd';
import type { ExtendedLocation } from '../types';
import { EditIcon } from '@quillbooking/components';

interface PhoneOnlineSectionProps {
	locations: ExtendedLocation[];
	cachedLocationData: Record<string, any>;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	onEditLocation: (type: string, customId?: string) => void;
}

const PhoneOnlineSection: React.FC<PhoneOnlineSectionProps> = ({
	locations,
	cachedLocationData,
	onCheckboxChange,
	onEditLocation,
}) => {
	const renderLocationCheckbox = (
		type: 'attendee_phone' | 'person_phone' | 'online',
		title: string,
		defaultText: string,
		fieldKey?: string
	) => {
		const location = locations.find((loc) => loc.type === type);
		const cachedFields = cachedLocationData[type] || {};
		const displayField = fieldKey || 'phone';
		const displayText =
			location?.fields?.[displayField] || cachedFields?.[displayField];

		const isSimpleType = type === 'attendee_phone';

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
				{isSimpleType ? (
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
						{displayText && (
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
				{__('Phone & Online Meeting', 'quillbooking')}
			</div>
			{renderLocationCheckbox(
				'attendee_phone',
				'Attendee Phone',
				'Phone'
			)}
			{renderLocationCheckbox(
				'person_phone',
				'Organizer Phone',
				'Phone',
				'phone'
			)}
			{renderLocationCheckbox(
				'online',
				'Online Meeting',
				'Online',
				'meeting_url'
			)}
		</Flex>
	);
};

export default PhoneOnlineSection;

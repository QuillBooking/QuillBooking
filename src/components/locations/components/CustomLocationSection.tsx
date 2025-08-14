import React from 'react';
import { __ } from '@wordpress/i18n';
import { Flex, Checkbox, Button } from 'antd';
import { FaPlus } from 'react-icons/fa';
import type { ExtendedLocation, CustomLocationState } from '../types';
import { EditIcon, TrashIcon } from '@quillbooking/components';

interface CustomLocationSectionProps {
	locations: ExtendedLocation[];
	customLocations: CustomLocationState[];
	onCustomCheckboxChange: (customId: string, checked: boolean) => void;
	onEditLocation: (type: string, customId?: string) => void;
	onRemoveCustomLocation: (customId: string) => void;
	onAddCustomLocation: () => void;
}

const CustomLocationSection: React.FC<CustomLocationSectionProps> = ({
	locations,
	customLocations,
	onCustomCheckboxChange,
	onEditLocation,
	onRemoveCustomLocation,
	onAddCustomLocation,
}) => {
	return (
		<Flex vertical gap={2} className="justify-start items-start">
			<div className="text-[#09090B] text-[16px]">
				{__('Other', 'quillbooking')}
			</div>

			{customLocations.map((customLoc) => {
				const customLocation = locations.find(
					(loc) => loc.type === 'custom' && loc.id === customLoc.id
				);

				return (
					<Checkbox
						key={customLoc.id}
						className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${
							customLocation
								? 'border-color-primary bg-color-secondary'
								: 'border-[#D3D4D6] bg-white'
						}`}
						checked={!!customLocation}
						onChange={(e) =>
							onCustomCheckboxChange(
								customLoc.id,
								e.target.checked
							)
						}
					>
						<Flex align="center" className="justify-between">
							<Flex vertical className="w-[415px]">
								<div className="text-[#3F4254] text-[16px] font-semibold ml-2">
									{customLocation?.fields?.location ||
										customLoc.fields?.location ||
										__('Custom', 'quillbooking')}
								</div>
								<div className="text-[#3F4254] text-[12px] italic ml-2">
									{customLocation?.fields?.description ||
										customLoc.fields?.description ||
										__('Custom', 'quillbooking')}
								</div>
							</Flex>
							{customLocation?.fields?.location && (
								<Flex>
									<Button
										onClick={(e) => {
											e.stopPropagation();
											onEditLocation(
												'custom',
												customLoc.id
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none"
									>
										<EditIcon />
										{__('Edit', 'quillbooking')}
									</Button>
									<Button
										onClick={(e) => {
											e.stopPropagation();
											onRemoveCustomLocation(
												customLoc.id
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none"
									>
										<div className="text-[#EF4444]">
											<TrashIcon />
										</div>
										{__('Delete', 'quillbooking')}
									</Button>
								</Flex>
							)}
						</Flex>
					</Checkbox>
				);
			})}

			<Button
				onClick={onAddCustomLocation}
				icon={<FaPlus className="text-color-primary" />}
				className="text-color-primary font-semibold outline-none border-none shadow-none"
			>
				{__('Add Custom Location', 'quillbooking')}
			</Button>
		</Flex>
	);
};

export default CustomLocationSection;

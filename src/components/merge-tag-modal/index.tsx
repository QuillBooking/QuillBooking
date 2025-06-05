/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { Card, Flex } from 'antd';
/**
 * Internal dependencies
 */
import {
	MergeTagAttIcon,
	MergeTagBookingIcon,
	MergeTagOtherIcon,
	MergeTagPaymentIcon,
} from '@quillbooking/components';
import config from '@quillbooking/config';

// Map of category keys to icons
const CATEGORY_ICONS = {
	attendee: <MergeTagAttIcon />,
	booking: <MergeTagBookingIcon />,
	host: <MergeTagAttIcon />,
	other: <MergeTagOtherIcon />,
	payment: <MergeTagPaymentIcon />,
	// Add any other categories as needed
};

// Default descriptions for categories
const DEFAULT_DESCRIPTION = __(
	'Select one of Merge tags that related to your input.',
	'quillbooking'
);

// Merge tag group type definition
// The value field should be in the format {{group:slug}} where:
// - group: The merge tag group (e.g., 'host', 'guest', 'booking')
// - slug: The specific identifier for the merge tag (e.g., 'name', 'email')
// Example: {{host:name}} will be replaced with the host's name
type MergeTagGroup = {
	mergeTags: {
		[slug: string]: {
			name: string;
			value: string;
		};
	};
	title?: string;
	description?: string;
};

interface MergeTagProps {
	onMentionClick: (mention: string, category: string) => void;
}

const MergeTagModal: React.FC<MergeTagProps> = ({ onMentionClick }) => {
	// Get merge tags from config
	const mergeTagGroups: Record<string, MergeTagGroup> = config.getMergeTags();

	// Get all available group keys
	const groupKeys = Object.keys(mergeTagGroups);

	// Set the first group as selected by default (if available)
	const [selectedKey, setSelectedKey] = useState(
		groupKeys.length > 0 ? groupKeys[0] : ''
	);

	// Set selected key when groups are loaded
	useEffect(() => {
		if (groupKeys.length > 0 && !selectedKey) {
			setSelectedKey(groupKeys[0]);
		}
	}, [groupKeys, selectedKey]);

	// Tag card component to reduce repetition
	// When a user clicks on a merge tag, the value (formatted as {{group:slug}})
	// is passed to the onMentionClick callback which inserts it into the field
	// These merge tags will be processed by Merge_Tags_Manager in PHP when needed
	const TagCard = ({ name, value, category }) => (
		<Card
			onClick={() => onMentionClick(value, category)}
			className="cursor-pointer"
		>
			<Flex vertical gap={3}>
				<span className="italic text-[#3F4254] text-[16px] font-semibold">
					{name}
				</span>
				<span className="text-[#505255] text-[12px] italic">
					{value}
				</span>
			</Flex>
		</Card>
	);

	return (
		<Flex gap={30}>
			{/* Categories sidebar */}
			<Card className="w-[450px]">
				<Flex vertical gap={10}>
					{groupKeys.map((groupKey) => {
						const group = mergeTagGroups[groupKey];
						// Use title from group if available, otherwise use groupKey
						const title = group.title || groupKey;
						const description =
							group.description || DEFAULT_DESCRIPTION;
						// Get appropriate icon or fallback to the "other" icon
						const icon = CATEGORY_ICONS[groupKey.toLowerCase()] || (
							<MergeTagOtherIcon />
						);

						return (
							<Flex
								gap={10}
								className={`flex items-center border p-4 rounded-lg cursor-pointer ${
									selectedKey === groupKey
										? 'border-color-primary bg-color-secondary'
										: 'border-[#E4E4E4]'
								}`}
								key={groupKey}
								onClick={() => setSelectedKey(groupKey)}
							>
								<div
									className={`rounded-lg p-2 ${
										selectedKey === groupKey
											? 'bg-[#D5B0F4]'
											: 'border border-color-secondary'
									}`}
								>
									{icon}
								</div>
								<div className="flex flex-col">
									<span className="text-[#3F4254] text-[16px] font-semibold">
										{title}
									</span>
									<span
										className={`text-[12px] font-[400] ${
											selectedKey === groupKey
												? 'text-[#505255]'
												: 'text-[#9197A4]'
										}`}
									>
										{description}
									</span>
								</div>
							</Flex>
						);
					})}
				</Flex>
			</Card>

			{/* Tags content */}
			<Card className="w-[450px]">
				<Flex vertical gap={15}>
					{selectedKey && mergeTagGroups[selectedKey]?.mergeTags ? (
						Object.entries(
							mergeTagGroups[selectedKey].mergeTags
						).map(([tagKey, tag], index) => (
							<TagCard
								key={index}
								name={tag.name}
								value={tag.value}
								category={selectedKey}
							/>
						))
					) : (
						<div>
							{__(
								'Select a category to see details.',
								'quillbooking'
							)}
						</div>
					)}
				</Flex>
			</Card>
		</Flex>
	);
};

export default MergeTagModal;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { Flex, Card, Input, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, GroupIcon } from '@quillbooking/components';

interface GroupSettingsProps {
	maxInvites: number;
	showRemaining: boolean;
	onChange: (
		key: 'max_invites' | 'show_remaining',
		value: number | boolean
	) => void;
	disabled?: boolean;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
	maxInvites,
	showRemaining,
	onChange,
	disabled = false,
}) => {
	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Group Event Settings', 'quillbooking')}
				description={__(
					'Configure settings for your group event.',
					'quillbooking'
				)}
				icon={<GroupIcon />}
			/>
			<Flex gap={20} vertical>
				<Flex vertical gap={8}>
					<div className="text-[#09090B] text-[16px]">
						{__('Max invitees in a spot', 'quillbooking')}
						<span className="text-red-500">*</span>
					</div>
					<Input
						type="number"
						value={maxInvites}
						onChange={(e) => {
							onChange('max_invites', Number(e.target.value));
						}}
						placeholder={__('Enter Max invitees', 'quillbooking')}
						className="h-[48px] rounded-lg"
						disabled={disabled}
					/>
				</Flex>
				<Checkbox
					checked={showRemaining}
					onChange={(e) =>
						onChange('show_remaining', e.target.checked)
					}
					className="custom-check text-[#5E6278] font-semibold"
					disabled={disabled}
				>
					{__(
						'Display Remaining Spots on Booking Page',
						'quillbooking'
					)}
				</Checkbox>
			</Flex>
		</Card>
	);
};

export default GroupSettings;

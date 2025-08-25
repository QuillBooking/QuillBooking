/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Flex, Input, Modal } from 'antd';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	UpcomingCalendarOutlinedIcon,
	UserSelect,
} from '@quillbooking/components';
import { Calendar } from '@quillbooking/types';

interface HostDataProps {
	formData: Partial<Calendar & { members: number[] }>;
	updateFormData: (key: keyof HostDataProps['formData'], value: any) => void;
	excludedUsers: number[];
	open: boolean;
	loading: boolean;
	closeHandler: () => void;
	setShowAvailability: (value: boolean) => void;
	validateHost: () => boolean;
}
const HostData: React.FC<HostDataProps> = ({
	open,
	closeHandler,
	loading,
	setShowAvailability,
	formData,
	updateFormData,
	excludedUsers,
	validateHost,
}) => {
	return (
		<Modal
			open={open}
			onCancel={closeHandler}
			className="rounded-lg"
			footer={[
				<Button
					size="large"
					key="action"
					type="primary"
					loading={loading}
					onClick={() => {
						if (validateHost()) setShowAvailability(true);
					}}
					className="w-full bg-color-primary rounded-lg font-[500] mt-5"
				>
					{__('Confirm', 'quillbooking')}
				</Button>,
			]}
		>
			<CardHeader
				title={__('Add New Calendar Host', 'quillbooking')}
				description={__(
					'Add the following data to Add New Calendar Host',
					'quillbooking'
				)}
				icon={<UpcomingCalendarOutlinedIcon />}
			/>

			<Flex vertical>
				<div className="text-[#09090B] text-[16px] mt-5">
					{__('Host Name', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				<Input
					value={formData.name}
					onChange={(e) => updateFormData('name', e.target.value)}
					className="h-[48px] rounded-lg"
					placeholder="Enter Name of this Host"
				/>
				<div className="text-[#09090B] text-[16px] mt-5">
					{__('Select Host', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				<UserSelect
					value={formData.user_id || 0}
					onChange={(value) => updateFormData('user_id', value)}
					exclude={excludedUsers}
				/>
				<div className="text-[#848484]">
					{__(
						'A particular user can have one calendar with multiple events. Please select a user who does not have a calendar yet',
						'quillbooking'
					)}
				</div>
			</Flex>
		</Modal>
	);
};

export default HostData;

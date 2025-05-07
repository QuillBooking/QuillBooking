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
	HostSelect,
	UpcomingCalendarOutlinedIcon,
} from '@quillbooking/components';
import { Calendar } from 'client/types';

interface TeamCalendarProps {
	formData: Partial<Calendar & { members: number[] }>;
	updateFormData: (
		key: keyof TeamCalendarProps['formData'],
		value: any
	) => void;
	open: boolean;
	loading: boolean;
	closeHandler: () => void;
	saveCalendar: () => void;
}

const TeamCalendar: React.FC<TeamCalendarProps> = ({
	formData,
	updateFormData,
	open,
	closeHandler,
	loading,
	saveCalendar,
}) => {
	return (
		<Modal
			open={open}
			onCancel={closeHandler}
			className="rounded-lg"
			footer={[
				<Button
					key="action"
					type="primary"
					loading={loading}
					onClick={saveCalendar}
					className="w-full bg-color-primary rounded-lg font-[500] mt-5"
				>
					{__('Add Team', 'quillbooking')}
				</Button>,
			]}
		>
			<Flex vertical>
				<CardHeader
					title={__('Add New Team', 'quillbooking')}
					description={__(
						'Add the following data to Add New Team',
						'quillbooking'
					)}
					icon={<UpcomingCalendarOutlinedIcon />}
				/>
				<div className="text-[#09090B] text-[16px] mt-5">
					{__('Team Name', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				<Input
					value={formData.name}
					onChange={(e) => updateFormData('name', e.target.value)}
					className="h-[48px] rounded-lg"
					placeholder="Enter Name of this Team"
				/>
				<div className="text-[#09090B] text-[16px] mt-5">
					{__('Select Team Members', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				<HostSelect
					value={formData.members || []}
					onChange={(value) => updateFormData('members', value)}
					multiple
					placeholder={__('Select team members...', 'quillbooking')}
				/>
				<div className="text-[#848484]">
					{__(
						'Select the members you want to assign to this team',
						'quillbooking'
					)}
				</div>
			</Flex>
		</Modal>
	);
};

export default TeamCalendar;

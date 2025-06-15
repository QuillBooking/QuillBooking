/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { Calendar } from 'client/types';
import { applyFilters } from '@wordpress/hooks';
import { ProIcon } from '@quillbooking/components';
import { Modal } from 'antd';
import { ACTIVE_PRO_URL } from '@quillbooking/constants';

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
	return applyFilters(
		'quillbooking.addCalendarModal.teamCalendar',
		<Modal
			open={open}
			onCancel={closeHandler}
			className="rounded-lg"
			footer={null}
		>
			<div className="flex flex-col items-center text-center py-10">
				<div className="bg-[#F1E0FF] rounded-full p-4 mb-2 flex items-center justify-center">
					<ProIcon width={72} height={72} />
				</div>
				<div>
					<h2 className="text-base font-semibold my-1 text-[#3F4254]">
						{__(
							'Create team feature is available in Pro Version',
							'quillbooking'
						)}
					</h2>
					<p className="text-[#9197A4] mb-4 text-xs">
						{__(
							'Please upgrade to get all the advanced features.',
							'quillbooking'
						)}
					</p>
					<div className="mt-5">
						<a
							className="bg-color-primary text-[#FBF9FC] rounded-lg py-3 px-4 font-medium"
							href={ACTIVE_PRO_URL}
						>
							{__('Upgrade To Pro Now', 'quillbooking')}
						</a>
					</div>
				</div>
			</div>
		</Modal>,
		{ formData, updateFormData, open, closeHandler, loading, saveCalendar }
	) as React.ReactElement;
};

export default TeamCalendar;

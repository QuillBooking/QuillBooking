/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Input, Modal } from 'antd';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	CurrentTimeInTimezone,
	FieldWrapper,
	TimezoneSelect,
} from '@quillbooking/components';
import { Availability } from 'client/types';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { getCurrentTimezone } from '@quillbooking/utils';

interface AddAvailabilityModalProps {
	open: boolean;
	setOpen: (value: boolean) => void;
}

/**
 * Availability Events Component.
 */

const AddAvailabilityScheduleModal: React.FC<AddAvailabilityModalProps> = ({
	open,
	setOpen,
}) => {
	const { callApi, loading } = useApi();
	const [formData, setFormData] = useState<Partial<Availability>>({
		name: '',
		timezone: getCurrentTimezone(),
		weekly_hours: DEFAULT_WEEKLY_HOURS,
		override: {},
	});
	const [isDisabled, setIsDisabled] = useState(true);

	const updateFormData = (
		key: keyof typeof formData,
		value: Partial<Availability>[keyof Availability]
	) => {
		if (formData.name && formData.timezone) {
			setIsDisabled(false);
		}
		setFormData((prev) => ({ ...prev, [key]: value }));
	};
	const { errorNotice } = useNotice();
	const navigate = useNavigate();

	const saveAvailabilitySchedule = async () => {
		if (!validate() || loading) return;

		try {
			await callApi({
				path: 'availabilities',
				method: 'POST',
				data: formData,
				onSuccess: (response) => {
					closeHandler();
					sessionStorage.setItem('showNewScheduleNotice', 'true');
					navigate(`availability/${response.id}`);
				},
				onError: (error) => {
					errorNotice(
						__(
							'Failed to save availability schedule.',
							'quillbooking'
						)
					);
				},
			});
		} catch (error) {
			console.error('Error in saveAvailabilitySchedule:', error);
			errorNotice(
				__(
					'An unexpected error occurred while saving the schedule.',
					'quillbooking'
				)
			);
		}
	};

	const closeHandler = () => {
		setOpen(false);
		setFormData({ name: '', timezone: getCurrentTimezone() });
		setIsDisabled(true);
	};

	const validate = () => {
		if (!formData.name) {
			errorNotice(
				__('Please enter a title for the availability.', 'quillbooking')
			);
			return false;
		}

		if (!formData.timezone) {
			errorNotice(__('Please select a timezone.', 'quillbooking'));
			return false;
		}

		return true;
	};

	return (
		<Modal
			title={
				<CardHeader
					className="pb-2"
					title={__('Add New Availability', 'quillbooking')}
					description={__('Add the following data.', 'quillbooking')}
					icon={null}
					border={false}
				/>
			}
			open={open}
			onCancel={closeHandler}
			footer={[
				<Button
					className={`${isDisabled ? 'bg-color-secondary border-0 text-white' : 'bg-color-primary'} w-full`}
					disabled={isDisabled}
					loading={loading}
					size="large"
					key="save"
					type="primary"
					onClick={saveAvailabilitySchedule}
				>
					{__('Add New Schedule', 'quillbooking')}
				</Button>,
			]}
		>
			<Flex vertical gap={20}>
				<FieldWrapper
					label={__('Schedule Title', 'quillbooking')}
					required={true}
				>
					<Input
						size="large"
						className="rounded-lg"
						value={formData.name}
						onChange={(e) => updateFormData('name', e.target.value)}
						placeholder={__(
							'Enter a title for the availability',
							'quillbooking'
						)}
					/>
				</FieldWrapper>

				<FieldWrapper
					label={__('Select Your Timezone', 'quillbooking')}
					required={true}
				>
					<TimezoneSelect
						value={formData.timezone || null}
						onChange={(value) => updateFormData('timezone', value)}
					/>
					<CurrentTimeInTimezone className="text-[#818181] text-xs" />
				</FieldWrapper>
			</Flex>
		</Modal>
	);
};

export default AddAvailabilityScheduleModal;

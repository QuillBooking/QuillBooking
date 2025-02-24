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
import { FieldWrapper, TimezoneSelect } from '@quillbooking/components';
import { Availability } from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { getToLink, useNavigate } from '@quillbooking/navigation';

interface AddAvailabilityModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
}

/**
 * Availability Events Component.
 */

const AddAvailabilitySechduleModal: React.FC<AddAvailabilityModalProps> = ({
	open,
	onClose,
	onSaved,
}) => {
	const { callApi, loading } = useApi();
	const [formData, setFormData] = useState<Partial<Availability>>({
		name: '',
		timezone: '',
		weekly_hours: DEFAULT_WEEKLY_HOURS,
		override: {},
	});

	const updateFormData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};
	const { errorNotice } = useNotice();
	const navigate = useNavigate();

	const saveAvailabilitySchedule = async () => {
		if (!validate() || loading) return;

		callApi({
			path: 'availabilities',
			method: 'POST',
			data: formData,
			onSuccess: (data) => {
				closeHandler();
				onSaved();
				const path = getToLink(`availability/${data.id}`);
				navigate(path);
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};

	const closeHandler = () => {
		onClose();
		setFormData({ name: '', timezone: '' });
	};

	const validate = () => {
		if (!formData.name) {
			errorNotice(
				__('Please enter a title for the formData.', 'quillbooking')
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
			title={__('Add New Availability Schedule', 'quillbooking')}
			open={open}
			onCancel={closeHandler}
			footer={[
				<Button key="cancel" onClick={onClose}>
					{__('Cancel', 'quillbooking')}
				</Button>,
				<Button
					key="save"
					type="primary"
					onClick={saveAvailabilitySchedule}
				>
					{__('Save', 'quillbooking')}
				</Button>,
			]}
		>
			<Flex vertical gap={20}>
				<FieldWrapper
					label={__('Title', 'quillbooking')}
					description={__(
						'Enter the title of the schedule.',
						'quillbooking'
					)}
				>
					<Input
						value={formData.name}
						onChange={(e) => updateFormData('name', e.target.value)}
					/>
				</FieldWrapper>

				<FieldWrapper
					label={__('Timezone', 'quillbooking')}
					description={__(
						'Select the timezone for the calendar.',
						'quillbooking'
					)}
				>
					<TimezoneSelect
						value={formData.timezone || null}
						onChange={(value) => updateFormData('timezone', value)}
					/>
				</FieldWrapper>
			</Flex>
		</Modal>
	);
};

export default AddAvailabilitySechduleModal;

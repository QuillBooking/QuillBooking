/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Availability, Calendar } from '@quillbooking/client';
import { useApi, useNotice } from '@quillbooking/hooks';
import { getCurrentTimezone } from '@quillbooking/utils';
import HostCalendar from './host-calendar';
import TeamCalendar from './team-calendar';
import { DEFAULT_WEEKLY_HOURS } from '../../../../constants';

interface AddCalendarModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	type: string;
	excludedUsers: number[];
}

interface CalendarWithAvailability extends Calendar {
	availability: Availability;
}

/**
 * Calendar Events Component.
 */
const AddCalendarModal: React.FC<AddCalendarModalProps> = ({
	open,
	onClose,
	type,
	excludedUsers,
	onSaved,
}) => {
	const getDefaultAvailability = (): Availability => ({
		id: 'default',
		user_id: 'default',
		name: __('Default', 'quillbooking'),
		timezone: getCurrentTimezone(),
		weekly_hours: DEFAULT_WEEKLY_HOURS,
		override: {},
	});

	const { callApi, loading } = useApi();
	const [formData, setFormData] = useState<
		Partial<CalendarWithAvailability & { members: number[] }>
	>({
		type,
		members: [],
		timezone: getCurrentTimezone(),
		availability: getDefaultAvailability(),
	});

	const updateFormData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};
	const { successNotice, errorNotice } = useNotice();

	const saveCalendar = async () => {
		if (!validate())  return;

		callApi({
			path: `calendars`,
			method: 'POST',
			data: formData,
			onSuccess: () => {
				closeHandler();
				onSaved();
				successNotice(
					__('Calendar saved successfully.', 'quillbooking')
				);
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};


	const validate = (): boolean => {
		if (!formData.name) {
			errorNotice(
				__('Please enter a name for the calendar.', 'quillbooking')
			);
			return false;
		}

		if (type === 'host' && !formData.user_id) {
			errorNotice(__('Please select a user.', 'quillbooking'));
			return false;
		}

		if (type === 'host' && !formData.availability) {
			errorNotice(__('Please select availability.', 'quillbooking'));
			return false;
		}


		if (type === 'team' && (!formData.members || formData.members.length === 0)) {
			errorNotice(__('Please select team members.', 'quillbooking'));
			return false;
		}

		return true;
	};

	const closeHandler = () => {
		onClose();
		setFormData({
			type,
			members: [],
			timezone: getCurrentTimezone(),
			availability: getDefaultAvailability(),
		});
	};

	return (
		<>
			{type === 'host' && (
				<HostCalendar
					formData={formData}
					updateFormData={updateFormData}
					excludedUsers={excludedUsers}
					open={open}
					closeHandler={closeHandler}
					loading={loading}
					saveCalendar={saveCalendar}
					validateHost={validate}
				/>
			)}
			{type === 'team' && (
				<TeamCalendar
					formData={formData}
					updateFormData={updateFormData}
					open={open}
					closeHandler={closeHandler}
					loading={loading}
					saveCalendar={saveCalendar}
				/>
			)}
		</>
	);
};

export default AddCalendarModal;

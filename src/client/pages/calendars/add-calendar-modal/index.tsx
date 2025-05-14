/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Availability, Calendar } from '@quillbooking/client';
import { useApi } from '@quillbooking/hooks';
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
	setCreateCalendarMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
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
	setCreateCalendarMessage,
	setErrorMessage,
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

	const saveCalendar = async () => {
		if (!validate()) return;

		callApi({
			path: `calendars`,
			method: 'POST',
			data: formData,
			onSuccess: () => {
				closeHandler();
				onSaved();
				setCreateCalendarMessage(true);
			},
			onError: (error) => {
				if (setErrorMessage) {
					setErrorMessage(error.message);
				}
			},
		});
	};

	const validate = (): boolean => {
		if (!formData.name) {
			if (setErrorMessage) {
				setErrorMessage(__('Please enter a name for the calendar.', 'quillbooking'));
			}
			return false;
		}

		if (type === 'host' && !formData.user_id) {
			if (setErrorMessage) {
				setErrorMessage(__('Please select a user.', 'quillbooking'));
			}
			return false;
		}

		if (type === 'host' && !formData.availability) {
			if (setErrorMessage) {
				setErrorMessage(__('Please select availability.', 'quillbooking'));
			}
			return false;
		}

		if (type === 'team' && (!formData.members || formData.members.length === 0)) {
			if (setErrorMessage) {
				setErrorMessage(__('Please select team members.', 'quillbooking'));
			}
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

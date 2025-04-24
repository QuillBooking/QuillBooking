/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/client';
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
};

const customAvailability = {
    id: 'default',
    user_id: 'default',
    name: __('Default', 'quillbooking'),
    timezone: getCurrentTimezone(),
    weekly_hours: DEFAULT_WEEKLY_HOURS,
    override: {},
  };

/**
 * Calendar Events Component.
 */
const AddCalendarModal: React.FC<AddCalendarModalProps> = ({ open, onClose, type, excludedUsers, onSaved }) => {
    const { callApi, loading } = useApi();
    const [formData, setFormData] = useState<Partial<Calendar & { members: number[] }>>({
        type,
        members: [],
        timezone: getCurrentTimezone(),
        availability: customAvailability
    });

    const updateFormData = (key: keyof typeof formData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };
    const { successNotice, errorNotice } = useNotice();

    const saveCalendar = async () => {
        if (!validate() || loading) return;
        console.log('formData', formData);
        callApi({
            path: `calendars`,
            method: 'POST',
            data: formData,
            onSuccess: () => {
                closeHandler();
                onSaved();
                successNotice(__('Calendar saved successfully.', 'quillbooking'));
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    const validate = () => {
        if (!formData.name) {
            errorNotice(__('Please enter a name for the formData.', 'quillbooking'));
            return false;
        }

        if (type === 'host' && !formData.user_id) {
            errorNotice(__('Please select a user.', 'quillbooking'));
            return false;
        }

        if (type === 'team' && (!formData.members || formData.members.length === 0)) {
            errorNotice(__('Please select team members.', 'quillbooking'));
            return false;
        }


        return true;
    };

    const validateHost = () => {
        if (!formData.name) {
            errorNotice(__('Please enter a name for the formData.', 'quillbooking'));
            return false;
        }

        if (!formData.user_id) {
            errorNotice(__('Please select a user.', 'quillbooking'));
            return false;
        }
        return true;
    }

    const closeHandler = () => {
        onClose();
        setFormData({});
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
                    validateHost={validateHost}
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
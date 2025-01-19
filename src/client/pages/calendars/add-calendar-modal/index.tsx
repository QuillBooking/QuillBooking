/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex, Button, Input, Modal } from 'antd';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/client';
import { UserSelect, HostSelect, TimezoneSelect, FieldWrapper } from '@quillbooking/components';
import { useApi, useNotice } from '@quillbooking/hooks';

interface AddCalendarModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    type: string;
    excludedUsers: number[];
};

/**
 * Calendar Events Component.
 */
const AddCalendarModal: React.FC<AddCalendarModalProps> = ({ open, onClose, type, excludedUsers, onSaved }) => {
    const { callApi, loading } = useApi();
    const [formData, setFormData] = useState<Partial<Calendar & { members: number[] }>>({
        type,
        members: [],
    });

    const updateFormData = (key: keyof typeof formData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };
    const { successNotice, errorNotice } = useNotice();

    const saveCalendar = async () => {
        if (!validate() || loading) return;

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

        if (!formData.timezone) {
            errorNotice(__('Please select a timezone.', 'quillbooking'));
            return false;
        }

        return true;
    };

    const closeHandler = () => {
        onClose();
        setFormData({});
    };

    return (
        <Modal
            title={type === 'team' ? __('Add Team', 'quillbooking') : __('Add Host', 'quillbooking')}
            open={open}
            onCancel={closeHandler}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    {__('Cancel', 'quillbooking')}
                </Button>,
                <Button key="save" type="primary" loading={loading} onClick={saveCalendar}>
                    {__('Save', 'quillbooking')}
                </Button>,
            ]}
        >
            <Flex vertical gap={20}>
                {type === 'host' && (
                    <FieldWrapper
                        label={__('User', 'quillbooking')}
                        description={__('Select the user that will be the host.', 'quillbooking')}
                    >
                        <UserSelect
                            value={formData.user_id || 0}
                            onChange={(value) => updateFormData('user_id', value)}
                            exclude={excludedUsers}
                        />
                    </FieldWrapper>
                )}
                {type === 'team' && (
                    <FieldWrapper
                        label={__('Team Members', 'quillbooking')}
                        description={__('Select the team members.', 'quillbooking')}
                    >
                        <HostSelect
                            value={formData.members || []}
                            onChange={(value) => updateFormData('members', value)}
                            multiple
                            placeholder={__('Select team members...', 'quillbooking')}
                        />
                    </FieldWrapper>
                )}
                <FieldWrapper
                    label={__('Name', 'quillbooking')}
                    description={__('Enter the name for the calendar.', 'quillbooking')}
                >
                    <Input
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                    />
                </FieldWrapper>
                <FieldWrapper
                    label={__('Timezone', 'quillbooking')}
                    description={__('Select the timezone for the calendar.', 'quillbooking')}
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

export default AddCalendarModal;
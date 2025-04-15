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
import { UserSelect, HostSelect, TimezoneSelect, FieldWrapper, Header, ShareEventIcon } from '@quillbooking/components';
import { useApi, useNotice } from '@quillbooking/hooks';
import { getCurrentTimezone } from '@quillbooking/utils';

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
        name: "test",
        type,
        members: [],
        timezone: getCurrentTimezone(),
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

        // if (!formData.timezone) {
        //     errorNotice(__('Please select a timezone.', 'quillbooking'));
        //     return false;
        // }

        return true;
    };

    const closeHandler = () => {
        onClose();
        setFormData({});
    };

    return (
        <Modal
            open={open}
            onCancel={closeHandler}
            className='rounded-lg'
            footer={[
                // <Button key="cancel" onClick={onClose}>
                //     {__('Cancel', 'quillbooking')}
                // </Button>,
                // <Button key="save" type="primary" loading={loading} onClick={saveCalendar}>
                //     {__('Save', 'quillbooking')}
                // </Button>,
                <Button key="action" type="primary" loading={loading} onClick={saveCalendar} className='w-full bg-color-primary rounded-lg font-[500] py-6 mt-5'>
                    {type === "team" ? __('Add Team', 'quillbooking') : __('Add Host', 'quillbooking')}
                </Button>,
            ]}
        >
            <Flex vertical>
                {type === 'host' && (
                    <>
                        <Flex gap={10} className='items-center'>
                            <ShareEventIcon />
                            <Header header={__('Add New Calendar Host', 'quillbooking')}
                                subHeader={__(
                                    'Add the following data to Add New Calendar Host',
                                    'quillbooking'
                                )} />
                        </Flex>
                        <div className="text-[#09090B] text-[16px] mt-5">
                            {__("Select Host", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <UserSelect
                            value={formData.user_id || 0}
                            onChange={(value) => updateFormData('user_id', value)}
                            exclude={excludedUsers}
                        />
                        <div className="text-[#848484]">
                            {__("A particular user can have one calendar with multiple events. Please select a user who does not have a calendar yet", "quillbooking")}
                        </div>
                    </>
                )}
                {type === 'team' && (
                    <>
                        <Flex gap={10} className='items-center'>
                            <ShareEventIcon />
                            <Header header={__('Add New Team', 'quillbooking')}
                                subHeader={__(
                                    'Add the following data to Add New Team',
                                    'quillbooking'
                                )} />
                        </Flex>
                        <div className="text-[#09090B] text-[16px] mt-5">
                            {__("Team Name", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateFormData('name', e.target.value)}
                            className='h-[48px] rounded-lg'
                            placeholder='Enter Name of this Team'
                        />
                        <div className="text-[#09090B] text-[16px] mt-5">
                            {__("Select Team Members", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <HostSelect
                            value={formData.members || []}
                            onChange={(value) => updateFormData('members', value)}
                            multiple
                            placeholder={__('Select team members...', 'quillbooking')}
                        />
                        <div className="text-[#848484]">
                            {__("Select the members you want to assign to this team", "quillbooking")}
                        </div>
                        {/* <FieldWrapper
                            label={__('Timezone', 'quillbooking')}
                            description={__('Select the timezone for the calendar.', 'quillbooking')}
                        >
                            <TimezoneSelect
                                value={formData.timezone || null}
                                onChange={(value) => updateFormData('timezone', value)}
                            />
                        </FieldWrapper> */}
                    </>
                )}
                {/* <FieldWrapper
                    label={__('Name', 'quillbooking')}
                    description={__('Enter the name for the calendar.', 'quillbooking')}
                >
                    <Input
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                    />
                </FieldWrapper>
                 */}
            </Flex>
        </Modal>
    );
};

export default AddCalendarModal;
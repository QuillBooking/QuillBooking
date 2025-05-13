/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex, Button, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { CardHeader, EventSelect, FieldWrapper, UpcomingCalendarOutlinedIcon } from '@quillbooking/components';
import type { Calendar } from '@quillbooking/client';

interface CloneEventModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    calendar: Calendar;
    excludedEvents: number[];
    setCloneMessage: (message: boolean) => void;
};

/**
 * Calendar Events Component.
 */
const CloneEventModal: React.FC<CloneEventModalProps> = ({ open, onClose, calendar, excludedEvents, onSaved, setCloneMessage }) => {
    const { callApi, loading } = useApi();
    const [event, setEvent] = useState<number | null>(null);

    const { successNotice, errorNotice } = useNotice();

    const saveCalendar = async () => {
        if (!validate() || loading) return;

        callApi({
            path: `calendars/${calendar.id}/clone`,
            method: 'POST',
            data: {
                event_id: event,
            },
            onSuccess: () => {
                closeHandler();
                onSaved();
                successNotice(__('Calendar saved successfully.', 'quillbooking'));
                setCloneMessage(true);
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    const validate = () => {
        return true;
    };

    const closeHandler = () => {
        onClose();
        setEvent(null);
    };

    return (
        <Modal
            open={open}
            onCancel={closeHandler}
            footer={[
                <Button key="clone" type="primary" loading={loading} onClick={saveCalendar} className='w-full border-none shadow-none'>
                    {__('Clone Event', 'quillbooking')}
                </Button>,
            ]}
        >
            <CardHeader
                title={__('Clone Calendar Event', 'quillbooking')}
                description={__(
                    'Select Calendar to make an exact copy of Calendar Event.',
                    'quillbooking'
                )}
                icon={<UpcomingCalendarOutlinedIcon />}
                border={false}
            />
            <Flex vertical>
                <div className="text-[#09090B] text-[16px]">
                    {__('Select Calendar Event', 'quillbooking')}
                    <span className="text-red-500">*</span>
                </div>
                <EventSelect
                    value={event || 0}
                    onChange={setEvent}
                    exclude={excludedEvents}
                    placeholder={__('Select Event', 'quillbooking')}
                    type={calendar.type}
                />
            </Flex>
        </Modal>
    );
};

export default CloneEventModal;
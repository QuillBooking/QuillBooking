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
import { EventSelect, FieldWrapper } from '@quillbooking/components';
import type { Calendar } from '@quillbooking/client';

interface CloneEventModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    calendar: Calendar;
    excludedEvents: number[];
};

/**
 * Calendar Events Component.
 */
const CloneEventModal: React.FC<CloneEventModalProps> = ({ open, onClose, calendar, excludedEvents, onSaved }) => {
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
            title={__('Clone Calendar Event', 'quillbooking')}
            open={open}
            onCancel={closeHandler}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    {__('Cancel', 'quillbooking')}
                </Button>,
                <Button key="clone" type="primary" loading={loading} onClick={saveCalendar}>
                    {__('Clone', 'quillbooking')}
                </Button>,
            ]}
        >
            <Flex vertical gap={20}>
                <FieldWrapper
                    label={__('Event', 'quillbooking')}
                    description={__('Select the event you want to clone.', 'quillbooking')}
                >
                    <EventSelect
                        value={event || 0}
                        onChange={setEvent}
                        exclude={excludedEvents}
                        placeholder={__('Select Event', 'quillbooking')}
                        type={calendar.type}
                    />
                </FieldWrapper>
            </Flex>
        </Modal>
    );
};

export default CloneEventModal;
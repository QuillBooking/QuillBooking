/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Modal, Flex, Button, DatePicker, TimePicker, Checkbox, Typography } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type { TimeSlot } from '@quillbooking/client';

const { Text } = Typography;

interface OverrideModalProps {
    isVisible: boolean;
    onClose: () => void;
    onApply: () => void;
    selectedDate: string | null;
    overrideTimes: TimeSlot[];
    isUnavailable: boolean;
    onDateChange: (date: string | null) => void;
    onAddTimeSlot: () => void;
    onRemoveTimeSlot: (index: number) => void;
    onUpdateTimeSlot: (index: number, field: 'start' | 'end', value: string) => void;
    onToggleUnavailable: () => void;
}

const OverrideModal: React.FC<OverrideModalProps> = ({
    isVisible,
    onClose,
    onApply,
    selectedDate,
    overrideTimes,
    isUnavailable,
    onDateChange,
    onAddTimeSlot,
    onRemoveTimeSlot,
    onUpdateTimeSlot,
    onToggleUnavailable,
}) => {
    return (
        <Modal
            title={__('Add Date Override', 'quillbooking')}
            open={isVisible}
            onCancel={onClose}
            onOk={onApply}
            okText={__('Apply', 'quillbooking')}
            cancelText={__('Cancel', 'quillbooking')}
        >
            <Flex vertical gap={20}>
                <Flex vertical gap={10}>
                    <Text strong>{__('Select a Date', 'quillbooking')}</Text>
                    <DatePicker
                        value={selectedDate ? dayjs(selectedDate) : null}
                        onChange={(value) => onDateChange(value?.format('YYYY-MM-DD') || null)}
                        style={{ width: '100%' }}
                    />
                </Flex>

                <Flex vertical gap={10}>
                    <Text strong>{__('What hours are you available?', 'quillbooking')}</Text>
                    {overrideTimes.map((time, index) => (
                        <Flex key={index} align="center" gap={10}>
                            <TimePicker
                                value={dayjs(time.start, 'HH:mm')}
                                onChange={(value) => onUpdateTimeSlot(index, 'start', value?.format('HH:mm') || '09:00')}
                                format="HH:mm"
                            />
                            <Text>-</Text>
                            <TimePicker
                                value={dayjs(time.end, 'HH:mm')}
                                onChange={(value) => onUpdateTimeSlot(index, 'end', value?.format('HH:mm') || '17:00')}
                                format="HH:mm"
                            />
                            <Button danger onClick={() => onRemoveTimeSlot(index)}>
                                {__('Remove', 'quillbooking')}
                            </Button>
                        </Flex>
                    ))}
                    <Button type="dashed" onClick={onAddTimeSlot}>
                        {__('Add Time Slot', 'quillbooking')}
                    </Button>
                </Flex>

                <Flex align="center" gap={10}>
                    <Checkbox checked={isUnavailable} onChange={onToggleUnavailable} />
                    <Text>{__('Mark as Unavailable', 'quillbooking')}</Text>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default OverrideModal;
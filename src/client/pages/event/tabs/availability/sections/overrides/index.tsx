/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Button, Typography, Card, Checkbox, TimePicker, DatePicker } from 'antd';
import { map, isEmpty } from 'lodash';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type { DateOverrides, TimeSlot } from '@quillbooking/client';
import { LimitsAddIcon, LimitsTrashIcon } from '@quillbooking/components';
import { useState } from '@wordpress/element';

const { Text } = Typography;

interface OverridesSectionProps {
    dateOverrides: DateOverrides;
    onRemoveOverride: (date: string) => void;
    selectedDate: string | null;
    overrideTimes: TimeSlot[];
    isUnavailable: boolean;
    onDateChange: (date: string | null) => void;
    onAddTimeSlot: () => void;
    onRemoveTimeSlot: (index: number) => void;
    onUpdateTimeSlot: (index: number, field: 'start' | 'end', value: string) => void;
    onToggleUnavailable: () => void;
}

const OverridesSection: React.FC<OverridesSectionProps> = ({
    dateOverrides,
    onRemoveOverride,
    selectedDate,
    overrideTimes,
    isUnavailable,
    onDateChange,
    onAddTimeSlot,
    onRemoveTimeSlot,
    onUpdateTimeSlot,
    onToggleUnavailable,
}) => {
    const [addOverride, setAddOverride] = useState(false);
    return (
        <Card className='mt-4'>
            <Flex vertical gap={20}>
                <Flex vertical>
                    <Text className='text-[#09090B] font-bold text-[20px]'>{__('Date-specific hours', 'quillbooking')}</Text>
                    <Text className='text-[#71717A] text-[12px]'>{__("Override your availability for specific dates when your hours differ from your regular weekly hours.", "quillbooking")}</Text>
                </Flex>
                {isEmpty(dateOverrides) ? (
                    <Button onClick={() => setAddOverride(true)} className='border-none bg-color-primary text-white w-fit px-4 flex items-start rounded-lg'>
                        {__('Add an override', 'quillbooking')}
                    </Button>
                ) : (
                    map(dateOverrides, (times: TimeSlot[], date: string) => (
                        <Flex key={date} align="center" gap={10}>
                            <Text>{date}</Text>
                            <Text>{times.map((slot) => `${slot.start} - ${slot.end}`).join(', ')}</Text>
                            <Button danger onClick={() => onRemoveOverride(date)} className='border-none shadow-none p-0'>
                                <LimitsTrashIcon />
                            </Button>
                        </Flex>
                    ))
                )}
                {addOverride && (
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
                                    <Button onClick={onAddTimeSlot} className='border-none shadow-none p-0'>
                                        <LimitsAddIcon />
                                    </Button>
                                    <Button onClick={() => onRemoveTimeSlot(index)} className='border-none shadow-none p-0'>
                                        <LimitsTrashIcon />
                                    </Button>
                                </Flex>
                            ))}
                        </Flex>

                        <Flex align="center" gap={10}>
                            <Checkbox checked={isUnavailable} onChange={onToggleUnavailable} />
                            <Text>{__('Mark as Unavailable', 'quillbooking')}</Text>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default OverridesSection;
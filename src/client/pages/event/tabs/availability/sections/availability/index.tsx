/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, Select, Checkbox, TimePicker, Typography, Table, Button, Card } from 'antd';
import dayjs from 'dayjs';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Availability, TimeSlot } from '@quillbooking/client';

const { Text } = Typography;

interface AvailabilitySectionProps {
    isCustomAvailability: boolean;
    availability: Availability;
    storedAvailabilities: Availability[];
    onAvailabilityChange: (id: string) => void;
    onCustomAvailabilityChange: (day: string, field: string, value: any) => void;
    onToggleCustomAvailability: (isCustom: boolean) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
    isCustomAvailability,
    availability,
    storedAvailabilities,
    onAvailabilityChange,
    onCustomAvailabilityChange,
    onToggleCustomAvailability,
}) => {
    const weeklyHoursColumns = [
        { title: __('Day', 'quillbooking'), dataIndex: 'day', key: 'day' },
        { title: __('Availability', 'quillbooking'), dataIndex: 'availability', key: 'availability' },
        { title: __('Time Slots', 'quillbooking'), dataIndex: 'times', key: 'times' },
    ];

    const weeklyHoursData = map(availability?.weekly_hours, (day, key) => ({
        key,
        day: __(key, 'quillbooking'),
        availability: day.off ? __('Unavailable', 'quillbooking') : __('Available', 'quillbooking'),
        times: day.off ? '-' : day.times.map((slot: TimeSlot) => `${slot.start} - ${slot.end}`).join(', '),
    }));

    return (
        <Card title={__('Working Hours', 'quillbooking')} style={{ flex: 1.5 }}>
            <Flex vertical gap={10}>
                <Text strong>{__('How do you want to offer your availability for this event type?', 'quillbooking')}</Text>
                <Radio.Group
                    value={isCustomAvailability ? 'custom' : 'existing'}
                    onChange={(e) => onToggleCustomAvailability(e.target.value === 'custom')}
                >
                    <Radio value="existing">{__('Use an Existing Schedule', 'quillbooking')}</Radio>
                    <Radio value="custom">{__('Set Custom Hours', 'quillbooking')}</Radio>
                </Radio.Group>

                {!isCustomAvailability && (
                    <Flex vertical gap={10}>
                        <Text strong>{__('Which Schedule Do You Want to Use?', 'quillbooking')}</Text>
                        <Select
                            value={availability.id}
                            onChange={onAvailabilityChange}
                            options={map(storedAvailabilities, (a) => ({ label: a.name, value: a.id }))}
                            style={{ width: '100%' }}
                        />
                    </Flex>
                )}

                <Flex vertical gap={10}>
                    <Text strong>{__('Weekly Hours', 'quillbooking')}</Text>
                    <Flex align="center" gap={10}>
                        <Text>{availability.timezone}</Text>
                        <Button type="link" onClick={() => onToggleCustomAvailability(true)}>
                            {__('Edit Availability', 'quillbooking')}
                        </Button>
                    </Flex>
                    {isCustomAvailability ? (
                        map(availability.weekly_hours, (day, key) => (
                            <Flex key={key} align="center" gap={10}>
                                <Flex gap={10} flex={1}>
                                    <Checkbox
                                        checked={!day.off}
                                        onChange={(e) => onCustomAvailabilityChange(key, 'off', !e.target.checked)}
                                    />
                                    <Text style={{ textTransform: 'capitalize' }}>{key}</Text>
                                </Flex>
                                {!day.off && (
                                    <TimePicker.RangePicker
                                        value={[dayjs(day.times[0].start, 'HH:mm'), dayjs(day.times[0].end, 'HH:mm')]}
                                        onChange={(times) => {
                                            if (times) {
                                                onCustomAvailabilityChange(key, 'times', [
                                                    { start: times[0]?.format('HH:mm'), end: times[1]?.format('HH:mm') },
                                                ]);
                                            }
                                        }}
                                        format="HH:mm"
                                        style={{ flex: 2 }}
                                    />
                                )}
                            </Flex>
                        ))
                    ) : (
                        <Table columns={weeklyHoursColumns} dataSource={weeklyHoursData} pagination={false} bordered />
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};

export default AvailabilitySection;
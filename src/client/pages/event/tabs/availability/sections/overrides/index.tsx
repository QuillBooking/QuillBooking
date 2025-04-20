/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Button, Typography, Card, TimePicker, DatePicker } from 'antd';
import { isEmpty } from 'lodash';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type { DateOverrides, TimeSlot } from '@quillbooking/client';
import { LimitsAddIcon, TrashIcon } from '@quillbooking/components';
import { useEffect, useState } from '@wordpress/element';
import './style.scss';

const { Text } = Typography;

interface OverridesSectionProps {
    dateOverrides: DateOverrides | null;
    setDateOverrides: (overrides: DateOverrides | null) => void;
}

type OverrideDate = Record<
    number,
    {
        date: string;
        times: TimeSlot;
    }
>;

const OverridesSection: React.FC<OverridesSectionProps> = ({
    dateOverrides,
}) => {
    const [overrideDates, setOverrideDates] = useState<OverrideDate>({});

    const onAddOverride = () => {
        const nextIndex = Math.max(0, ...Object.keys(overrideDates).map(Number)) + 1;
        setOverrideDates({
            ...overrideDates,
            [nextIndex]: {
                date: '',
                times:
                {
                    start: '09:00',
                    end: '17:00',
                },
            },
        })
    }

    const onRemoveOverride = (index: number) => {
        const updatedOverrides = { ...overrideDates };
        delete updatedOverrides[index];
        setOverrideDates(updatedOverrides);
    }

    const onDateChange = (date: string | null, index: number) => {
        setOverrideDates({
            ...overrideDates,
            [index]: {
                ...overrideDates[index],
                date: date || '',
            },
        })
    }

    const onUpdateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
        setOverrideDates((prev) => {
            const updatedDate = { ...prev };
            updatedDate[index] = {
                ...updatedDate[index],
                times: {
                    ...updatedDate[index].times,
                    [field]: value,
                },
            };
            return updatedDate;
        });
    }

    useEffect(() => {
        if (!dateOverrides) {
          setOverrideDates({});
          return;
        }
      
        const flatList = Object.entries(dateOverrides).flatMap(
          ([date, timesArray]) =>
            timesArray.map(time => ({
              date,
              times: {
                start: dayjs(time.start, 'HH:mm').format('HH:mm'),
                end:   dayjs(time.end,   'HH:mm').format('HH:mm'),
              },
            }))
        );
      
        const newOverrides = flatList.reduce<OverrideDate>((acc, entry, idx) => {
          acc[idx] = entry;
          return acc;
        }, {});
      
        setOverrideDates(newOverrides);
      }, [dateOverrides]);      

    return (
        <Card className='mt-4'>
            <Flex vertical gap={20}>
                <Flex vertical>
                    <Text className='text-[#09090B] font-bold text-[20px]'>{__('Date-specific hours', 'quillbooking')}</Text>
                    <Text className='text-[#71717A] text-[12px]'>{__("Override your availability for specific dates when your hours differ from your regular weekly hours.", "quillbooking")}</Text>
                </Flex>
                {isEmpty(overrideDates) && (
                    <Button onClick={onAddOverride} className='border-none bg-color-primary text-white w-fit rounded-lg'>
                        {__('Add an override', 'quillbooking')}
                    </Button>
                )}
                <Flex vertical gap={20}>
                    {Object.entries(overrideDates).map(([key, dateTime]) => {
                        const numericKey = Number(key);
                        return (<Flex align="center" gap={10} key={numericKey}>
                            <Flex flex={1} className='border border-[#E4E7EC] p-2 rounded-lg' align="center" gap={10}>
                                <DatePicker
                                    value={dateTime.date ? dayjs(dateTime.date) : null}
                                    onChange={(value) => onDateChange(value?.format('YYYY-MM-DD') || null, numericKey)}
                                    style={{ width: '100%' }}
                                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                                    suffixIcon={null}
                                    className='border-none focus-within:shadow-none focus:shadow-none'
                                />
                                <div className='border-l-2 border-[#E4E7EC] h-5'>
                                </div>
                                <TimePicker.RangePicker
                                    separator={<span className='text-[#9BA7B7]'>-</span>}
                                    suffixIcon={null}
                                    className='border-none focus-within:shadow-none focus:shadow-none'
                                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                                    format={'hh:mm A'}
                                    value={[dayjs(dateTime.times.start, 'hh:mm'), dayjs(dateTime.times.end, 'hh:mm')]}
                                    onChange={(values) => {
                                        if (values) {
                                            const [start, end] = values;
                                            if (start) {
                                                onUpdateTimeSlot(numericKey, 'start', start.format('HH:mm'));
                                            }
                                            if (end) {
                                                onUpdateTimeSlot(numericKey, 'end', end.format('HH:mm'));
                                            }
                                        }
                                    }}
                                />
                            </Flex>
                            <Button onClick={onAddOverride} className='border-none shadow-none p-0'>
                                <LimitsAddIcon />
                            </Button>
                            <Button
                                danger
                                size="small"
                                onClick={() => onRemoveOverride(numericKey)}
                                className='border-none shadow-none p-0'
                            >
                                <TrashIcon width={24} height={24} />
                            </Button>
                        </Flex>)
                    })}
                </Flex>
            </Flex>
        </Card>
    );
};

export default OverridesSection;
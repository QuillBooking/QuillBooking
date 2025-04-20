/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, Select, Checkbox, TimePicker, Typography, Table, Button, Card, Switch } from 'antd';
import dayjs from 'dayjs';
import { map } from 'lodash';
import { HiOutlineUser } from "react-icons/hi2";

/**
 * Internal dependencies
 */
import type { Availability, TimeSlot, AvailabilityRange, DateOverrides } from '@quillbooking/client';
import { CalendarTickIcon, CardHeader, Header, Schedule } from '@quillbooking/components';
import OverridesSection from '../overrides';
import { useState } from 'react';
import './style.scss'
import RangeSection from '../range';
import { useEventContext } from '../../../../state/context';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { getCurrentTimezone } from '@quillbooking/utils';

const { Text } = Typography;

interface AvailabilitySectionProps {
    isCustomAvailability: boolean;
    availability: Availability;
    storedAvailabilities: Availability[];
    onAvailabilityChange: (id: string) => void;
    onCustomAvailabilityChange: (day: string, field: string, value: any) => void;
    onToggleCustomAvailability: (isCustom: boolean) => void;
    range: AvailabilityRange;
    onRangeTypeChange: (type: 'days' | 'date_range' | 'infinity') => void;
    onDaysChange: (days: number) => void;
    onDateRangeChange: (start_date: string, end_date: string) => void;
    dateOverrides: DateOverrides | null;
    lastPickedAvailability: Availability | null;
    setAvailability: (availability: Availability | null) => void;
    setDateOverrides: (overrides: DateOverrides | null) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
    isCustomAvailability,
    availability,
    storedAvailabilities,
    onAvailabilityChange,
    onCustomAvailabilityChange,
    onToggleCustomAvailability,
    range,
    onRangeTypeChange,
    onDaysChange,
    onDateRangeChange,
    dateOverrides,
    lastPickedAvailability,
    setAvailability,
    setDateOverrides
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
    const customAvailability = {
        id: 'default',
        user_id: 'default',
        name: __('Default', 'quillbooking'),
        timezone: getCurrentTimezone(),
        weekly_hours: DEFAULT_WEEKLY_HOURS,
        override: {},
    };
    const { state: event } = useEventContext();
    const [checked, setChecked] = useState(false);
    const [reservetimes, setReservetimes] = useState(false);
    const [commonSchedule, setCommonSchedule] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [availabilityType, setAvailabilityType] = useState('existing');

    const handleSelectCard = (name) => {
        setSelectedCard(name);
    };

    const handleToggle = (value: boolean) => {
        setChecked(value);
        setReservetimes(value);
    };

    console.log(event);

    return (
        <Card className='rounded-lg'>
            <CardHeader title={__('Availability', 'quillbooking')} description={__(
                'Control your availability nd Works time at different time of days',
                'quillbooking'
            )} icon={<CalendarTickIcon />} />

            {(event?.type === 'round-robin') && (
                <Flex className='items-center mt-4'>
                    <Flex vertical gap={1}>
                        <div className="text-[#09090B] text-[16px] font-semibold">
                            {__("Choose a common schedule", "quillbooking")}
                        </div>
                        <div className='text-[#71717A]'>
                            {__("Enable this if you want to use a common schedule between hosts. When disabled, each host will be booked based on their default or chosen schedule.", "quillbooking")}
                        </div>
                    </Flex>
                    <Switch
                        checked={commonSchedule}
                        onChange={setCommonSchedule}
                        className={commonSchedule ? "bg-color-primary" : "bg-gray-400"}
                    />
                </Flex>
            )}

            {(!commonSchedule && event?.type === 'round-robin') && (
                <Flex vertical gap={10} className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Add Availability Per Users*", "quillbooking")}
                        <span className='text-red-500'>*</span>
                    </div>
                    <Flex gap={20} wrap>
                        <Card
                            onClick={() => handleSelectCard('Admin')}
                            className={`cursor-pointer transition-all rounded-lg border w-[200px] h-[93px] ${selectedCard === 'Admin' ? 'border-color-primary bg-color-secondary' : ''
                                }`}
                            bodyStyle={{ paddingTop: "18px" }}
                        >

                            {/* <img src={admin} alt='admin.png' className='size-8 rounded-lg' /> */}
                            <div className='text-[#1E2125] font-[700] pt-1'>Admin</div>
                        </Card>
                        <Card
                            onClick={() => handleSelectCard('neil')}
                            className={`cursor-pointer transition-all rounded-lg border w-[200px] h-[93px] ${selectedCard === 'neil' ? 'border-color-primary bg-color-secondary' : ''
                                }`}
                            bodyStyle={{ paddingTop: "18px" }}
                        >
                            {/* <img src={neil} alt='neil.png' className='w-10 h-8 rounded-lg' /> */}
                            <div className='text-[#1E2125] font-[700] pt-1'>Neil James</div>
                        </Card>
                        <Card
                            onClick={() => handleSelectCard('feil')}
                            className={`cursor-pointer transition-all rounded-lg border w-[200px] h-[93px] ${selectedCard === 'feil' ? 'border-color-primary bg-color-secondary' : ''
                                }`}
                            bodyStyle={{ paddingTop: "18px" }}
                        >
                            <HiOutlineUser className='bg-[#EBEBEB] rounded-lg p-2 size-8' />
                            <div className='text-[#1E2125] font-[700] pt-1'>Feil Fodan</div>
                        </Card>
                    </Flex>
                </Flex>
            )}


            <Flex vertical gap={4} className='mt-4'>
                <Text className='text-[#09090B] text-[16px] font-semibold'>
                    {__('How do you want to offer your availability for this event type?', 'quillbooking')}
                    <span className='text-red-500'>*</span>
                </Text>
                <Radio.Group
                    value={availabilityType}
                    onChange={(e) => {
                        setAvailabilityType(e.target.value);
                        setAvailability(e.target.value === 'custom' ? customAvailability : lastPickedAvailability);
                    }}
                    className='flex gap-1'
                >
                    <Radio
                        value="existing"
                        className={`flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${availabilityType === "existing" ? "border-color-primary bg-color-secondary" : ""
                            }`}
                    >
                        {__('Use an Existing Schedule', 'quillbooking')}
                    </Radio>
                    <Radio
                        value="custom"
                        className={`flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${availabilityType === "custom" ? "border-color-primary bg-color-secondary" : ""
                            }`}
                    >
                        {__('Set Custom Hours', 'quillbooking')}
                    </Radio>
                </Radio.Group>
            </Flex>

            <Flex gap={1} vertical className='mt-5'>
                <Text className='text-[#09090B] text-[16px] font-semibold'>
                    {__("Which Schedule Do You Want to Use?", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </Text>
                <Select
                    value={availability.id}
                    onChange={onAvailabilityChange}
                    options={map(storedAvailabilities, (a) => ({ label: a.name, value: a.id }))}
                    className='w-full h-[48px] rounded-lg'
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                />
            </Flex>

            <Card className='mt-4 pt-4'>
                <Schedule availability={availabilityType === "custom" ? customAvailability : availability} onCustomAvailabilityChange={onCustomAvailabilityChange} />
            </Card>

            <OverridesSection
                dateOverrides={dateOverrides}
                setDateOverrides={setDateOverrides}
            />
            
            <Card className='border-none'>
                <RangeSection
                    range={range}
                    onRangeTypeChange={onRangeTypeChange}
                    onDaysChange={onDaysChange}
                    onDateRangeChange={onDateRangeChange}
                />
            </Card>

            <Card className='mt-6'>
                <Flex className='items-center'>
                    <Flex vertical gap={1}>
                        <div className="text-[#09090B] text-[20px]">
                            {__("Reserve Times", "quillbooking")}
                        </div>
                        <div className='text-[#71717A] text-[16px]'>
                            {__("Enable to reserve selected times for this event only. When disabled, times remain available and may disappear if booked by others.", "quillbooking")}
                        </div>
                    </Flex>
                    <Switch
                        checked={checked}
                        onChange={handleToggle}
                        className={checked ? "bg-color-primary" : "bg-gray-400"}
                    />
                </Flex>
            </Card>
        </Card>
    );
};

export default AvailabilitySection;
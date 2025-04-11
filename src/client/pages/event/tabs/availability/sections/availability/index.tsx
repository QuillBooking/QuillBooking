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
import { CalendarTickIcon, Header } from '@quillbooking/components';
import OverridesSection from '../overrides';
import { useState } from 'react';
import './style.scss'
import RangeSection from '../range';
import admin from "../../../../../../../components/icons/admin.png";
import neil from "../../../../../../../components/icons/neil.png";

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

    const [checked, setChecked] = useState(false);
    const [reservetimes, setReservetimes] = useState(false);
    const [commonSchedule, setCommonSchedule] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    const handleSelectCard = (name) => {
        setSelectedCard(name);
    };

    const handleToggle = (value: boolean) => {
        setChecked(value);
        setReservetimes(value);
    };

    return (
        <Card className='rounded-lg'>
            <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                <div className='bg-[#EDEDED] rounded-lg p-2'>
                    <CalendarTickIcon />
                </div>
                <Header header={__('Availability', 'quillbooking')}
                    subHeader={__(
                        'Control your availability nd Works time at different time of days',
                        'quillbooking'
                    )} />
            </Flex>
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
            {!commonSchedule && (
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

                            <img src={admin} alt='admin.png' className='size-8 rounded-lg' />
                            <div className='text-[#1E2125] font-[700] pt-1'>Admin</div>
                        </Card>
                        <Card
                            onClick={() => handleSelectCard('neil')}
                            className={`cursor-pointer transition-all rounded-lg border w-[200px] h-[93px] ${selectedCard === 'neil' ? 'border-color-primary bg-color-secondary' : ''
                                }`}
                            bodyStyle={{ paddingTop: "18px" }}
                        >
                            <img src={neil} alt='neil.png' className='w-10 h-8 rounded-lg' />
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
            <Flex gap={1} vertical className='mt-5'>
                <div className="text-[#09090B] text-[16px]">
                    {__("Availability", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Select
                    value={availability.id}
                    onChange={onAvailabilityChange}
                    options={map(storedAvailabilities, (a) => ({ label: a.name, value: a.id }))}
                    className='w-full h-[48px] rounded-lg'
                    getPopupContainer={(trigger) => trigger.parentElement}
                />
            </Flex>
            <Card className='mt-4 pt-5'>
                {true ? (
                    map(availability.weekly_hours, (day, key) => (
                        <Flex key={key} align="center" gap={10} className='mb-5'>
                            <Flex gap={10} flex={1} className='items-center'>
                                <Switch
                                    checked={!day.off}
                                    onChange={(_, checked) => onCustomAvailabilityChange(key, "off", !checked)}
                                    className={!day.off ? "bg-color-primary" : "bg-gray-400"}
                                />
                                <Text className='capitalize text-[#1E2125] text-[16px] font-[700]'>{key}</Text>
                            </Flex>
                            <TimePicker
                                value={dayjs(day.times[0].start, "HH:mm")}
                                onChange={(time) => {
                                    if (time) {
                                        onCustomAvailabilityChange(key, "times", [
                                            { start: time.format("HH:mm"), end: day.times[0].end }
                                        ]);
                                    }
                                }}
                                format="HH:mm"
                                placeholder="Start Time"
                                prefix={<span className='text-[#9BA7B7] pr-[100px]'>{__("From", "quillbooking")}</span>}
                                suffixIcon={null}
                                className='h-[48px] rounded-lg flex-1 custom-timepicker'
                                disabled={day.off}
                            />

                            <TimePicker
                                value={dayjs(day.times[0].end, "HH:mm")}
                                onChange={(time) => {
                                    if (time) {
                                        onCustomAvailabilityChange(key, "times", [
                                            { start: day.times[0].start, end: time.format("HH:mm") }
                                        ]);
                                    }
                                }}
                                format="HH:mm"
                                placeholder="End Time"
                                prefix={<span className='text-[#9BA7B7] pr-[115px]'>{__("To", "quillbooking")}</span>}
                                suffixIcon={null}
                                className='h-[48px] rounded-lg flex-1 custom-timepicker'
                                disabled={day.off}
                            />
                        </Flex>
                    ))
                ) : (
                    <Table columns={weeklyHoursColumns} dataSource={weeklyHoursData} pagination={false} bordered />
                )}
            </Card>
            <OverridesSection
                dateOverrides={dateOverrides}
                onRemoveOverride={onRemoveOverride}
                selectedDate={selectedDate}
                overrideTimes={overrideTimes}
                isUnavailable={isUnavailable}
                onDateChange={onDateChange}
                onAddTimeSlot={onAddTimeSlot}
                onRemoveTimeSlot={onRemoveTimeSlot}
                onUpdateTimeSlot={onUpdateTimeSlot}
                onToggleUnavailable={onToggleUnavailable}
            />
            <RangeSection
                range={range}
                onRangeTypeChange={onRangeTypeChange}
                onDaysChange={onDaysChange}
                onDateRangeChange={onDateRangeChange}
            />
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
            {/* <Card style={{ flex: 1.5 }}>
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
                                getPopupContainer={(trigger) => trigger.parentElement}
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
            </Card> */}
        </Card>
    );
};

export default AvailabilitySection;
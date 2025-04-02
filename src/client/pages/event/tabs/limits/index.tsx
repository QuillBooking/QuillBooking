/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Button, Switch, Select, InputNumber, Skeleton, Typography } from 'antd';

/**
 * Internal dependencies
 */
import type { EventLimits as EventLimitsType, LimitUnit } from '@quillbooking/client';
import { FieldWrapper, TimezoneSelect, Header } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { getCurrentTimeInTimezone } from '@quillbooking/utils';
import { useEventContext } from '../../state/context';
import { LuClock5 } from "react-icons/lu";
import { Box, Slider } from '@mui/material';

const { Title } = Typography;

const unitOptions = [
    { value: 'minutes', label: __('Minutes', 'quillbooking') },
    { value: 'hours', label: __('Hours', 'quillbooking') },
    { value: 'days', label: __('Days', 'quillbooking') },
];

const timeOptions = [
    { value: 0, label: __('No buffer time', 'quillbooking') },
    ...Array.from({ length: 24 }, (_, i) => {
        const value = (i + 1) * 5;
        return { value, label: `${value} ${__('minutes', 'quillbooking')}` };
    }),
];

/**
 * Event General Settings Component.
 */
const EventLimits: React.FC = () => {
    const { state: event, actions } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState<EventLimitsType | null>(null);
    const setBreadcrumbs = useBreadcrumbs();

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/limits`,
            method: 'GET',
            onSuccess(response: EventLimitsType) {
                setSettings(response);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    useEffect(() => {
        if (!event) {
            return;
        }

        fetchSettings();
        setBreadcrumbs([
            {
                path: `calendars/${event.calendar_id}/events/${event.id}/limits`,
                title: __('Limits', 'quillbooking'),
            },
        ]);
    }, [event]);

    const handleSave = () => {
        if (!event) return;

    };

    const handleChange = (section: keyof EventLimitsType, key: string, value: any) => {
        setSettings((prev) =>
            prev ? { ...prev, [section]: { ...prev[section], [key]: value } } : prev
        );
    };

    const addLimit = (section: 'frequency' | 'duration') => {
        setSettings((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    limits: [...prev[section].limits, { limit: 1, unit: 'days' }],
                },
            };
        });
    };

    const removeLimit = (section: 'frequency' | 'duration', index: number) => {
        setSettings((prev) => {
            if (!prev) return prev;
            const updatedLimits = [...prev[section].limits];
            updatedLimits.splice(index, 1);
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    limits: updatedLimits.length ? updatedLimits : [{ limit: 1, unit: 'days' }], // Ensure at least one limit
                },
            };
        });
    };

    const saveSettings = () => {
        console.log(settings);
    };

    if (!settings) {
        return <Skeleton active />;
    }

    const marks = [
        { value: 0, label: "0 Minutes" },
        { value: 120, label: "120 Minutes" },
    ];

    return (
        <Card className='rounded-lg'>
            <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                <LuClock5 className='bg-[#EDEDED] text-[50px] rounded-lg p-2' />
                <Header header={__('Limits', 'quillbooking')}
                    subHeader={__(
                        'Manage you buffer time before and after events.',
                        'quillbooking'
                    )} />
            </Flex>
            <Flex gap={10} vertical>
                <div className="text-[#09090B] text-[16px]">
                    {__("Before Event", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Card className='rounded-lg'>
                    <Slider
                        value={settings.general.buffer_before}
                        onChange={(_, newValue) => handleChange("general", "buffer_before", newValue)}
                        step={5}
                        //marks={marks}
                        min={0}
                        max={120}
                        valueLabelDisplay="on"
                    //sx={{'& .MuiSlider-markLabel':"94%"}}
                    />
                </Card>
            </Flex>
            <Flex gap={10} vertical className='mt-4'>
                <div className="text-[#09090B] text-[16px]">
                    {__("After Event", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Card className='rounded-lg'>
                    <Slider
                        value={settings.general.buffer_after}
                        onChange={(_, newValue) => handleChange("general", "buffer_after", newValue)}
                        step={5}
                        //marks={marks}
                        min={0}
                        max={120}
                        valueLabelDisplay="on"
                    //sx={{'& .MuiSlider-markLabel':"94%"}}
                    />
                </Card>
            </Flex>
            <Flex gap={10} vertical className='mt-4'>
                <div className="text-[#09090B] text-[16px]">
                    {__("Minimum Notice", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Flex gap={5} className='w-full'>
                    <InputNumber
                        value={settings.general.minimum_notices}
                        onChange={(value) => handleChange('general', 'minimum_notices', value)}
                        className='h-[48px] rounded-lg w-3/4 pt-2'
                    />
                    <Select
                        value={settings.general.minimum_notice_unit}
                        options={unitOptions}
                        onChange={(value) => handleChange('general', 'minimum_notice_unit', value)}
                        getPopupContainer={(trigger) => trigger.parentElement}
                        className='h-[48px] rounded-lg w-1/4'
                    />
                </Flex>
            </Flex>
            <Flex gap={10} vertical className='mt-4'>
                <div className="text-[#09090B] text-[16px]">
                    {__("Time Slot Intervals", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Select
                    value={settings.general.time_slot}
                    options={timeOptions}
                    onChange={(value) => handleChange('general', 'time_slot', value)}
                    getPopupContainer={(trigger) => trigger.parentElement}
                    className='h-[48px] w-full rounded-lg'
                />
            </Flex>
            <Card className='mt-4'>
                <Flex className='items-center justify-between px-[40px]'>
                    <Flex vertical gap={1}>
                        <div className="text-[#09090B] text-[20px]">
                            {__("Lock time zone on booking page", "quillbooking")}
                        </div>
                        <div className='text-[#71717A] text-[14px]'>
                            {__("To lock the timezone on booking page, useful for in-person events", "quillbooking")}
                        </div>
                    </Flex>
                    <Switch
                        checked={settings.timezone_lock.enable}
                        onChange={(checked) => handleChange('timezone_lock', 'enable', checked)}
                        className={settings.timezone_lock.enable ? "bg-color-primary" : "bg-gray-400"}
                    />
                </Flex>
            </Card>
            {settings.timezone_lock.enable && (
                <Card className='mt-4'>
                    <Flex vertical gap={10} className='px-[40px]'>
                        <div className="text-[#09090B] text-[16px]">
                            {__("Select Time Zone", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <TimezoneSelect
                            value={settings.timezone_lock.timezone}
                            onChange={(value) => handleChange('timezone_lock', 'timezone', value)}
                            getPopupContainer={(trigger) => trigger.parentElement}
                            className='h-[48px] w-full rounded-lg'
                        />
                        <Typography.Text className='text-[#71717A] text-[18px]'>
                            {sprintf(__('Current time in %s is %s', 'quillbooking'), settings.timezone_lock.timezone, getCurrentTimeInTimezone(settings.timezone_lock.timezone))}
                        </Typography.Text>
                    </Flex>
                </Card>
            )}
            {/* <Flex vertical gap={20} className="quillbooking-limits-tab">
                <Card>
                    <Flex gap={20} vertical>
                        <Flex gap={20}>
                            <FieldWrapper
                                label={__('Buffer Before Event', 'quillbooking')}
                                description={__('Set buffer time before the event starts.', 'quillbooking')}
                                style={{
                                    flex: 1
                                }}
                            >
                                <Select
                                    value={settings.general.buffer_before}
                                    options={timeOptions}
                                    onChange={(value) => handleChange('general', 'buffer_before', value)}
                                    getPopupContainer={(trigger) => trigger.parentElement}
                                />
                            </FieldWrapper>

                            <FieldWrapper
                                label={__('Buffer After Event', 'quillbooking')}
                                description={__('Set buffer time after the event ends.', 'quillbooking')}
                                style={{
                                    flex: 1
                                }}
                            >
                                <Select
                                    value={settings.general.buffer_after}
                                    options={timeOptions}
                                    onChange={(value) => handleChange('general', 'buffer_after', value)}
                                    getPopupContainer={(trigger) => trigger.parentElement}
                                />
                            </FieldWrapper>
                        </Flex>
                        <Flex gap={20}>
                            <FieldWrapper
                                label={__('Minimum Notice', 'quillbooking')}
                                description={__('Set the minimum time required before booking.', 'quillbooking')}
                                style={{
                                    flex: 1
                                }}
                            >
                                <Flex gap={10}>
                                    <InputNumber
                                        value={settings.general.minimum_notices}
                                        onChange={(value) => handleChange('general', 'minimum_notices', value)}
                                        style={{
                                            flex: 1
                                        }}
                                    />
                                    <Select
                                        value={settings.general.minimum_notice_unit}
                                        options={unitOptions}
                                        onChange={(value) => handleChange('general', 'minimum_notice_unit', value)}
                                        getPopupContainer={(trigger) => trigger.parentElement}
                                    />
                                </Flex>
                            </FieldWrapper>
                            <FieldWrapper
                                label={__('Time-slot intervals', 'quillbooking')}
                                description={__('Set the time slot intervals.', 'quillbooking')}
                                style={{
                                    flex: 1
                                }}
                            >
                                <Select
                                    value={settings.general.time_slot}
                                    options={timeOptions}
                                    onChange={(value) => handleChange('general', 'time_slot', value)}
                                    getPopupContainer={(trigger) => trigger.parentElement}
                                />
                            </FieldWrapper>
                        </Flex>
                    </Flex>
                </Card>
                <Card>
                    <Flex vertical gap={20}>
                        <FieldWrapper
                            label={__('Limit Booking Frequency', 'quillbooking')}
                            description={__('Enable to limit the number of bookings.', 'quillbooking')}
                            type='horizontal'
                        >
                            <Switch
                                checked={settings.frequency.enable}
                                onChange={(checked) => handleChange('frequency', 'enable', checked)}
                            />
                        </FieldWrapper>

                        {settings.frequency.enable && (
                            <>
                                {settings.frequency.limits.map((limit, index) => (
                                    <FieldWrapper
                                        key={index}
                                        label={__('Booking Frequency Limit', 'quillbooking')}
                                        description={__('Set the limit for booking frequency.', 'quillbooking')}
                                    >
                                        <Flex align="center" gap={10}>
                                            <InputNumber
                                                value={limit.limit}
                                                min={1}
                                                onChange={(value) => {
                                                    const updatedLimits = [...settings.frequency.limits];
                                                    updatedLimits[index].limit = value ?? 5;
                                                    handleChange('frequency', 'limits', updatedLimits);
                                                }}
                                            />
                                            <Select
                                                value={limit.unit}
                                                options={unitOptions}
                                                getPopupContainer={(trigger) => trigger.parentElement}
                                                onChange={(value) => {
                                                    const updatedLimits = [...settings.frequency.limits];
                                                    updatedLimits[index].unit = value as LimitUnit;
                                                    handleChange('frequency', 'limits', updatedLimits);
                                                }}
                                            />
                                            <Button
                                                danger
                                                size="small"
                                                onClick={() => removeLimit('frequency', index)}
                                            >
                                                {__('Remove', 'quillbooking')}
                                            </Button>
                                        </Flex>
                                    </FieldWrapper>
                                ))}
                                <Button type="dashed" onClick={() => addLimit('frequency')}>
                                    {__('Add Frequency Limit', 'quillbooking')}
                                </Button>
                            </>
                        )}
                    </Flex>
                </Card>
                <Card>
                    <Flex vertical gap={20}>
                        <FieldWrapper
                            label={__('Limit Total Booking Duration', 'quillbooking')}
                            description={__('Enable to restrict total booking duration.', 'quillbooking')}
                            type='horizontal'
                        >
                            <Switch
                                checked={settings.duration.enable}
                                onChange={(checked) => handleChange('duration', 'enable', checked)}
                            />
                        </FieldWrapper>

                        {settings.duration.enable && (
                            <>
                                {settings.duration.limits.map((limit, index) => (
                                    <FieldWrapper key={index} label={__('Booking Duration Limit', 'quillbooking')}>
                                        <Flex align="center" gap={10}>
                                            <InputNumber
                                                value={limit.limit}
                                                min={1}
                                                onChange={(value) => {
                                                    const updatedLimits = [...settings.duration.limits];
                                                    updatedLimits[index].limit = value ?? 120;
                                                    handleChange('duration', 'limits', updatedLimits);
                                                }}
                                            />
                                            <Select
                                                value={limit.unit}
                                                options={unitOptions}
                                                getPopupContainer={(trigger) => trigger.parentElement}
                                                onChange={(value) => {
                                                    const updatedLimits = [...settings.duration.limits];
                                                    updatedLimits[index].unit = value as LimitUnit;
                                                    handleChange('duration', 'limits', updatedLimits);
                                                }}
                                            />
                                            <Button
                                                danger
                                                size="small"
                                                onClick={() => removeLimit('duration', index)}
                                            >
                                                {__('Remove', 'quillbooking')}
                                            </Button>
                                        </Flex>
                                    </FieldWrapper>
                                ))}
                                <Button type="dashed" onClick={() => addLimit('duration')}>
                                    {__('Add Duration Limit', 'quillbooking')}
                                </Button>
                            </>
                        )}
                    </Flex>
                </Card>

                <Card>
                    <Flex vertical gap={20}>
                        <FieldWrapper
                            label={__('Lock Timezone For This Event', 'quillbooking')}
                            description={__('To lock the timezone on booking page, useful for in-person events.', 'quillbooking')}
                            type='horizontal'
                        >
                            <Switch
                                checked={settings.timezone_lock.enable}
                                onChange={(checked) => handleChange('timezone_lock', 'enable', checked)}
                            />
                        </FieldWrapper>

                        {settings.timezone_lock.enable && (
                            <Flex vertical gap={10}>
                                <FieldWrapper
                                    label={__('Select Timezone', 'quillbooking')}
                                    description={__('Select the timezone for this event.', 'quillbooking')}
                                >
                                    <TimezoneSelect
                                        value={settings.timezone_lock.timezone}
                                        onChange={(value) => handleChange('timezone_lock', 'timezone', value)}
                                    />
                                </FieldWrapper>
                                <Typography.Text type="secondary">
                                    {sprintf(__('Current time in %s is %s', 'quillbooking'), settings.timezone_lock.timezone, getCurrentTimeInTimezone(settings.timezone_lock.timezone))}
                                </Typography.Text>
                            </Flex>
                        )}
                    </Flex>
                </Card>

                <Button type="primary" onClick={saveSettings} loading={loading}>
                    {__('Save Settings', 'quillbooking')}
                </Button>
            </Flex> */}
        </Card>
    );
};

export default EventLimits;
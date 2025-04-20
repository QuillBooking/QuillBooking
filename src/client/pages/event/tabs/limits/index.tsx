/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Button, Switch, Select, InputNumber, Skeleton, Typography } from 'antd';

/**
 * Internal dependencies
 */
import type { EventLimits as EventLimitsType, LimitUnit, UnitOption as UnitOptionType, UnitOptions as UnitOptionsType } from '@quillbooking/client';
import { FieldWrapper, TimezoneSelect, Header, LimitsTrashIcon, LimitsAddIcon, CardHeader } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { getCurrentTimeInTimezone } from '@quillbooking/utils';
import { useEventContext } from '../../state/context';
import { LuClock5 } from "react-icons/lu";
import { Box, Slider } from '@mui/material';
import { RiDeleteBinLine } from 'react-icons/ri';
import LimitTimezone from './limit-timezone';
import TimezoneSection from './limit-timezone';
import BookingFrequency from './booking-frequency';
import BookingDuration from './booking-duration';

const { Title } = Typography;

const timeOptions = [
    { value: 0, label: __('No buffer time', 'quillbooking') },
    ...Array.from({ length: 24 }, (_, i) => {
        const value = (i + 1) * 5;
        return { value, label: `${value} ${__('minutes', 'quillbooking')}` };
    }),
];


const UnitOptions = {
    days: { label: __('Day', 'quillbooking'), disabled: false },
    weeks: { label: __('Week', 'quillbooking'), disabled: false },
    months: { label: __('Month', 'quillbooking'), disabled: false },
};
/**
 * Event General Settings Component.
 */
const EventLimits: React.FC = () => {
    const { state: event, actions } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState<EventLimitsType | null>(null);
    const [bookingDuration, setBookingDuration] = useState<UnitOptionsType>(UnitOptions);
    const [bookingFrequency, setBookingFrequency] = useState<UnitOptionsType>(UnitOptions);
    const setBreadcrumbs = useBreadcrumbs();

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/limits`,
            method: 'GET',
            onSuccess(response: EventLimitsType) {
                setSettings(response);
                setBookingDuration(prev => {
                    const updatedOptions = { ...prev };
                    response.duration.limits.forEach((limit) => {
                        if (updatedOptions[limit.unit as LimitUnit]) {
                            updatedOptions[limit.unit as LimitUnit].disabled = true;
                        }
                    });
                    return updatedOptions;
                });

                setBookingFrequency(prev => {
                    const updatedOptions = { ...prev };
                    response.frequency.limits.forEach((limit) => {
                        if (updatedOptions[limit.unit as LimitUnit]) {
                            updatedOptions[limit.unit as LimitUnit].disabled = true;
                        }
                    });
                    return updatedOptions;
                });
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
        // Choose which map to use
        const bookingState = section === 'duration'
            ? bookingDuration
            : bookingFrequency

        // Build an array of { value, label, disabled } for only the enabled ones
        const available = (Object.entries(bookingState) as [LimitUnit, UnitOptionType][])
            .filter(([_, opt]) => !opt.disabled)
            .map(([value, opt]) => ({ value, ...opt }))

        // Guard: if we have no available options, bail out
        if (available.length === 0) {
            return
        }

        // Pick the next unit
        const nextUnit = available[0].value;

        // 1) Update your settings to add the new limit
        setSettings(prev => {
            if (!prev) return prev
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    limits: [
                        ...prev[section].limits,
                        { limit: section === 'duration' ? 120 : 5, unit: nextUnit },
                    ],
                },
            }
        })

        // 2) Disable that unit in the corresponding booking map
        if (section === 'duration') {
            setBookingDuration(prev => ({
                ...prev,
                [nextUnit]: {
                    ...prev[nextUnit],
                    disabled: true,
                },
            }))
        } else {
            setBookingFrequency(prev => ({
                ...prev,
                [nextUnit]: {
                    ...prev[nextUnit],
                    disabled: true,
                },
            }))
        }
    }

    const removeLimit = (section: 'frequency' | 'duration', index: number) => {
        // First, capture the unit we're removing so we can re-enable it
        const unitBeingRemoved = settings?.[section].limits[index]?.unit;

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

        // Re-enable the unit in the corresponding booking state
        if (unitBeingRemoved) {
            if (section === 'duration') {
                setBookingDuration(prev => ({
                    ...prev,
                    [unitBeingRemoved]: {
                        ...prev[unitBeingRemoved],
                        disabled: false,
                    },
                }));
            } else {
                setBookingFrequency(prev => ({
                    ...prev,
                    [unitBeingRemoved]: {
                        ...prev[unitBeingRemoved],
                        disabled: false,
                    },
                }));
            }
        }
    };

    const saveSettings = () => {
        console.log(settings);
    };

    if (!settings) {
        return <Skeleton active />;
    }

    const marks = [
        { value: 0, label: <span className='absolute left-0'>{__("0 Minutes", "quillbooking")}</span> },
        { value: 120, label: <span className='absolute right-0'>{__("120 Minutes", "quillbooking")}</span> },
    ];

    return (
        <Card className='rounded-lg'>
            <CardHeader
                title={__('Limits', 'quillbooking')}
                description={__(
                    'Manage you buffer time before and after events.',
                    'quillbooking'
                )}
                icon={<LuClock5 className='text-[30px]' />}
            />

            <Flex gap={10} vertical>
                <div className="text-[#09090B] text-[16px]">
                    {__("Before Event", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Card className='rounded-lg py-2'>
                    <Slider
                        value={settings.general.buffer_before}
                        onChange={(_, newValue) => handleChange("general", "buffer_before", newValue)}
                        step={5}
                        min={0}
                        max={120}
                        valueLabelDisplay="on"
                        valueLabelFormat={(value) => (value === 0 || value === 120 ? '' : `${value} Minutes`)}
                        marks={marks}
                        sx={{
                            '& .MuiSlider-track': {
                                backgroundColor: 'transparent',
                                border: "none",

                            },
                            '& .MuiSlider-rail': {
                                backgroundColor: '#DEE1E6',
                                height: "10px",
                            },
                            '& .MuiSlider-thumb': {
                                backgroundColor: '#953AE4',
                                '&:hover, &.Mui-focusVisible, &.Mui-active': {
                                    boxShadow: '0 0 0 5px rgba(149, 58, 228, 0.3)',
                                    border: '3px solid white',
                                }
                            },
                            '& .MuiSlider-mark': {
                                backgroundColor: "transparent",
                            },
                            '& .MuiSlider-markLabel': {
                                color: 'black',
                                fontSize: '16px',
                            },
                            '& .MuiSlider-valueLabel': {
                                backgroundColor: 'transparent',
                                position: "absolute",
                                top: "0",
                                left: "-38px",
                                outline: "none",
                                appearance: "none",
                                color: 'black',
                                fontSize: '16px',
                                transform: 'translateY(-10px)',
                            },
                        }}
                    />
                </Card>
            </Flex>
            <Flex gap={10} vertical className='mt-4'>
                <div className="text-[#09090B] text-[16px]">
                    {__("After Event", "quillbooking")}
                    <span className='text-red-500'>*</span>
                </div>
                <Card className='rounded-lg py-2'>
                    <Slider
                        value={settings.general.buffer_after}
                        onChange={(_, newValue) => handleChange("general", "buffer_after", newValue)}
                        step={5}
                        min={0}
                        max={120}
                        valueLabelDisplay="on"
                        valueLabelFormat={(value) => (value === 0 || value === 120 ? '' : `${value} Minutes`)}
                        marks={marks}
                        sx={{
                            '& .MuiSlider-track': {
                                backgroundColor: 'transparent',
                                border: "none",

                            },
                            '& .MuiSlider-rail': {
                                backgroundColor: '#DEE1E6',
                                height: "10px",
                            },
                            '& .MuiSlider-thumb': {
                                backgroundColor: '#953AE4',
                                '&:hover, &.Mui-focusVisible, &.Mui-active': {
                                    boxShadow: '0 0 0 5px rgba(149, 58, 228, 0.3)',
                                    border: '3px solid white',
                                }
                            },
                            '& .MuiSlider-mark': {
                                backgroundColor: "transparent",
                            },
                            '& .MuiSlider-markLabel': {
                                color: 'black',
                                fontSize: '16px',
                            },
                            '& .MuiSlider-valueLabel': {
                                backgroundColor: 'transparent',
                                position: "absolute",
                                top: "-17px",
                                left: "-38px",
                                outline: "none",
                                appearance: "none",
                                color: 'black',
                                fontSize: '16px',
                                transform: 'translateY(-10px)',
                            },
                        }}
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
                        options={UnitOptions}
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

            <BookingFrequency
                settings={settings}
                handleChange={handleChange}
                addLimit={addLimit}
                removeLimit={removeLimit}
                unitOptions={bookingFrequency} setBookingFrequency={setBookingFrequency}
            />
            <BookingDuration
                settings={settings}
                handleChange={handleChange}
                addLimit={addLimit}
                removeLimit={removeLimit}
                unitOptions={bookingDuration}
                setBookingDuration={setBookingDuration}
            />
            <TimezoneSection settings={settings} handleChange={handleChange} />
        </Card>
    );
};

export default EventLimits;
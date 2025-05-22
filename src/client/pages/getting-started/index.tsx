/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Card, Flex, Button } from 'antd';
import { IoCloseSharp } from 'react-icons/io5';
import { Dialog, DialogActions, DialogTitle } from '@mui/material';

/**
 * Internal dependencies
 */
import { useNavigate } from '@quillbooking/hooks';
import CongratsIcon from './icons/congrats-icon';
import Stepper from './stepper';
import EventDetails from './event-details';
import LocationTimezone from './event-location-timezone';
import HostAvailability from './host-availability';
import { getCurrentTimezone } from '@quillbooking/utils';
import { Event } from '@quillbooking/client';

const GettingStarted: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const totalSteps = 3;
    const [event, setEvent] = useState<Omit<Event, 'id'> & { id?: number }>({
        name: '',
        description: '',
        type: 'one-to-one',
        duration: 30,
        color: '',
        location: [],
        created_at: '',
        updated_at: '',
        hash_id: '',
        calendar_id: 0,
        user_id: 0,
        slug: '',
        status: 'active',
        booking_count: 0,
        is_disabled: false,
        visibility: 'public',
        dynamic_duration: false,
        calendar: {
            id: 0,
            user_id: 0,
            name: '',
            description: '',
            slug: '',
            status: 'active',
            timezone: '',
            type: '',
            avatar: { id: 0, url: '' },
            featured_image: { id: 0, url: '' },
            events: [],
            created_at: '',
            updated_at: '',
            team_members: []
        },
        additional_settings: {
            allow_attendees_to_select_duration: false,
            default_duration: 0,
            selectable_durations: [],
            allow_additional_guests: false,
            max_invitees: 0,
            show_remaining: false
        },
        reserve: false,
        connected_integrations: {
            apple: {
                name: 'apple',
                connected: false
            },
            google: {
                name: 'google',
                connected: false
            },
            outlook: {
                name: 'outlook',
                connected: false
            },
            twilio: {
                name: 'twilio',
                connected: false
            },
            zoom: {
                name: 'zoom',
                connected: false
            }
        },
        availability_data: {
            id: '',
            user_id: '',
            name: '',
            weekly_hours: {
                monday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: false
                },
                tuesday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: false
                },
                wednesday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: false
                },
                thursday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: false
                },
                friday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: false
                },
                saturday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: true
                },
                sunday: {
                    times: [{ start: '09:00', end: '17:00' }],
                    off: true
                }
            },
            override: {},
            timezone: getCurrentTimezone()
        }
    });

    const handleClose = () => {
        navigate('/');
    };

    const handleNext = async () => {
        setLoading(true);

        // Simulate API call or validation
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
            }
        } catch (error) {
            console.error('Error proceeding to next step:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            // Handle final submission
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Close dialog or navigate after successful submission
            handleClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update the handleEventChange type to be more specific
    const handleEventChange = (field: keyof Event, value: any) => {
        setEvent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Update the handleAvailabilityChange to match the expected signature from HostAvailability
    const handleAvailabilityChange = (
        dayKey: string,
        field: string,
        value: boolean | { start: string; end: string }[]
    ) => {
        setEvent(prev => {
            if (!prev.availability_data) return prev;

            return {
                ...prev,
                availability_data: {
                    ...prev.availability_data,
                    weekly_hours: {
                        ...prev.availability_data.weekly_hours,
                        [dayKey]: {
                            ...prev.availability_data.weekly_hours[dayKey],
                            [field]: value
                        }
                    }
                }
            };
        });
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <EventDetails
                        event={event}
                        onEventChange={handleEventChange}
                    />
                );
            case 2:
                return (
                    <LocationTimezone
                        event={event}
                        onEventChange={handleEventChange}
                    />
                );
            case 3:
                return (
                    <HostAvailability
                        event={event}
                        onAvailabilityChange={handleAvailabilityChange}
                    />
                );
            default:
                return (
                    <EventDetails
                        event={event}
                        onEventChange={handleEventChange}
                    />
                );
        }
    };

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1:
                // Disable if name is empty
                return !event.name.trim();
            case 2:
                // Disable if timezone is empty or location array is empty
                return !event.calendar.timezone || event.location.length === 0;
            default:
                return false;
        }
    };

    return (
        <Dialog
            open={true}
            //onClose={handleClose}
            fullScreen
            className="z-[150000]"
        >
            <DialogTitle className="border-b" sx={{ padding: '10px 16px' }}>
                <Flex className="justify-between items-center">
                    <div className="text-[#09090B] text-[24px] font-[500]">
                        {__('Getting Started', 'quillbooking')}
                    </div>
                    {/*<DialogActions
                        className="cursor-pointer"
                        onClick={handleClose}
                        color="primary"
                    >
                        <IoCloseSharp />
                    </DialogActions>*/}
                </Flex>
            </DialogTitle>
            <Card className="quillbooking-getting-started bg-[#FDFDFD] mx-20 my-10 py-10">
                <Flex vertical align="center" justify="center" gap={25}>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={20}
                        className="bg-gradient-to-b from-[#4D0C86] to-[#953AE4] rounded-3xl py-14 px-28"
                    >
                        <CongratsIcon />
                        <div className="text-white text-5xl font-semibold">
                            {__('Congratulations!', 'quillbooking')}
                        </div>
                        <div className="text-[#e5cdf9] text-2xl font-medium">
                            {__(
                                'Thank you for Choosing QuillBooking, Let`s',
                                'quillbooking'
                            )}
                            <span className="font-extrabold ml-2 text-white">
                                {__(
                                    'Create Your First Booking Event',
                                    'quillbooking'
                                )}
                            </span>
                        </div>
                    </Flex>

                    <Stepper currentStep={currentStep} />

                    {/* Step Content */}
                    <div className="w-full max-w-[1110px]">
                        {renderStepContent()}
                    </div>

                    {/* Navigation Buttons - Aligned to the right */}
                    <div className="w-full max-w-[1110px]">
                        <Flex
                            justify="flex-end"
                            align="center"
                            gap={16}
                            className="mt-8"
                        >
                            {currentStep > 1 && (
                                <Button
                                    onClick={handlePrevious}
                                    disabled={loading}
                                    size="large"
                                    className="px-14 border-color-primary text-color-primary bg-transparent"
                                >
                                    {__('Back', 'quillbooking')}
                                </Button>
                            )}

                            {currentStep < totalSteps ? (
                                <Button
                                    type="primary"
                                    onClick={handleNext}
                                    loading={loading}
                                    size="large"
                                    className="px-12"
                                    disabled={isNextDisabled()}
                                >
                                    {__('Continue', 'quillbooking')}
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    onClick={handleSubmit}
                                    loading={loading}
                                    size="large"
                                    className="px-14"
                                >
                                    {__('Submit', 'quillbooking')}
                                </Button>
                            )}
                        </Flex>
                    </div>
                </Flex>
            </Card>
        </Dialog>
    );
};

export default GettingStarted;
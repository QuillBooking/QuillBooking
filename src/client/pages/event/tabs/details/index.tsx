/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Flex, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import Locations from './locations';
import { get } from 'lodash';
import EventInfo from './event-info';
import LivePreview from './live-preview';
import Duration from './duration';
import { CardHeader, EventLocIcon } from '@quillbooking/components';
import { EventFieldsTabHandle } from 'client/types';
import { IoClose } from 'react-icons/io5';
import { FaCheckCircle } from "react-icons/fa";


/**
 * Event General Settings Component.
 */
interface EventDetailsProps {
    onKeepDialogOpen: () => void;
    notice: { title: string; message: string } | null;
    clearNotice: () => void;
    disabled: boolean;
    setDisabled: (disabled: boolean) => void;
}

const EventDetails = forwardRef<EventFieldsTabHandle, EventDetailsProps>(
    ({ onKeepDialogOpen, notice, clearNotice, disabled, setDisabled }, ref) => {
        const { state: event, actions } = useEventContext();
        const { callApi, loading } = useApi();
        const { successNotice, errorNotice } = useNotice();
        const setBreadcrumbs = useBreadcrumbs();
        const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');

        // Implement useImperativeHandle to expose the saveSettings method
        useImperativeHandle(ref, () => ({
            saveSettings: async () => {
                if (event) {
                    saveSettings();
                }
            },
        }));

        useEffect(() => {
            if (!event) {
                return;
            }

            setBreadcrumbs([
                {
                    path: `calendars/${event.calendar_id}/events/${event.id}/general`,
                    title: __('General', 'quillbooking'),
                },
            ]);

            const isCustomDuration = ![15, 30, 45, 60].includes(event.duration);
            setDurationMode(isCustomDuration ? 'custom' : 'preset');
        }, [event]);

        if (!event) {
            return <Skeleton active />;
        }

        const saveSettings = () => {
            if (!validate() || loading) return;
            callApi({
                path: `events/${event.id}`,
                method: 'PUT',
                data: event,
                onSuccess: () => {
                    successNotice(__('Event settings saved successfully', 'quillbooking'));
                    setDisabled(true); // Mark as saved
                },
                onError: (error: string) => {
                    errorNotice(error);
                },
            });
        };

        const handleChange = (key: string, value: any) => {
            actions.setEvent({ ...event, [key]: value });
            setDisabled(false); // Mark as having unsaved changes
        };

        const handleAdditionalSettingsChange = (key: string, value: any) => {
            actions.setEvent({
                ...event,
                additional_settings: {
                    ...event.additional_settings,
                    [key]: value,
                },
            });
            setDisabled(false); // Mark as having unsaved changes
        };

        const validate = () => {
            if (!event.name) {
                errorNotice(__('Please enter a name for the event.', 'quillbooking'));
                return false;
            }

            if (!event.duration || event.duration <= 0) {
                errorNotice(__('Please enter a valid duration for the event.', 'quillbooking'));
                return false;
            }

            return true;
        };

        const getDefaultDurationOptions = () => {
            const options = get(event, 'additional_settings.selectable_durations') ? get(event, 'additional_settings.selectable_durations').map((duration) => ({
                value: duration,
                label: `${duration} minutes`,
            })) : [];

            return options;
        };

        return (
            <div className='w-full px-9'>
                {notice && (
                    <Flex className='justify-between items-start border py-3 px-5 mb-4 bg-[#0EA4731A] border-[#0EA473] rounded-lg'>
                        <Flex vertical>
                            <Flex className='items-baseline gap-2'>
                                <FaCheckCircle className='text-[#0EA473] text-[14px]' />
                                <span className='text-[#0EA473] text-[16px] font-semibold'>{notice.title}</span>
                            </Flex>
                            <span className='text-[#0EA473]'>{notice.message}</span>
                        </Flex>
                        <IoClose
                            onClick={clearNotice}
                            className='text-[#0F5032] text-[18px] cursor-pointer pt-1'
                        />
                    </Flex>
                )}
                <div className='grid grid-cols-2 gap-5'>
                    <Flex vertical gap={20}>
                        <EventInfo
                            name={event.name}
                            hosts={event.hosts || []}
                            description={event.description}
                            color={event.color}
                            onChange={handleChange} />
                        <Flex vertical gap={20}>
                            <Duration
                                duration={event.duration}
                                onChange={handleChange}
                                handleAdditionalSettingsChange={handleAdditionalSettingsChange}
                                getDefaultDurationOptions={getDefaultDurationOptions}
                                allow_attendees_to_select_duration={event.additional_settings.allow_attendees_to_select_duration}
                                selectable_durations={event.additional_settings.selectable_durations}
                                default_duration={event.additional_settings.default_duration}
                            />
                        </Flex>
                    </Flex >
                    <Flex vertical gap={20}>
                        <LivePreview
                            name={event.name}
                            hosts={event.hosts || []}
                            duration={event.duration}
                            locations={event.location}
                        />
                        <Card>
                            <Flex vertical gap={20}>
                                <CardHeader title={__('Event Location', 'quillbooking')}
                                    description={__(
                                        'Select Where you will Meet Guests.',
                                        'quillbooking'
                                    )}
                                    icon={<EventLocIcon />} />
                                <Flex className='justify-between'>
                                    <div className="text-[#09090B] text-[16px]">
                                        {__("How Will You Meet", "quillbooking")}
                                        <span className='text-red-500'>*</span>
                                    </div>
                                    <div className="text-[#848484] italic">
                                        {__("You Can Select More Than One", "quillbooking")}
                                    </div>
                                </Flex>
                                <Flex vertical gap={15}>
                                    <Locations
                                        locations={event.location}
                                        connected_integrations={event.connected_integrations}
                                        onChange={(updatedLocations) => handleChange('location', updatedLocations)}
                                        onKeepDialogOpen={onKeepDialogOpen}
                                    />
                                </Flex>
                            </Flex>
                        </Card>
                    </Flex>
                </div>
            </div>
        );
    }
);

export default EventDetails;
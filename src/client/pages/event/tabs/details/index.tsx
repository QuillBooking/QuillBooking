/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Input, Select, InputNumber, Skeleton, Switch } from 'antd';

/**
 * Internal dependencies
 */
import { FieldWrapper } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import ColorSelector from './color-selector';
import Locations from './locations';
import { get } from 'lodash';

/**
 * Event General Settings Component.
 */
const EventDetails: React.FC = () => {
    const { state: event, actions } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const setBreadcrumbs = useBreadcrumbs();
    const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');

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
            },
            onError: (error: string) => {
                errorNotice(error);
            },
        });
    };

    const handleChange = (key: string, value: any) => {
        actions.setEvent({ ...event, [key]: value });
    };

    const handleAdditionalSettingsChange = (key: string, value: any) => {
        actions.setEvent({
            ...event,
            additional_settings: {
                ...event.additional_settings,
                [key]: value,
            },
        });
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

    const durationOptions = Array.from({ length: 96 }, (_, i) => ({
        value: (i + 1) * 5,
        label: `${(i + 1) * 5} minutes`,
    }));

    const handleDurationChange = (value: number | string) => {
        if (value === 'custom') {
            setDurationMode('custom');
        } else {
            setDurationMode('preset');
            handleChange('duration', value);
        }
    };

    const getDefaultDurationOptions = () => {
        const options = get(event, 'additional_settings.selectable_durations') ? get(event, 'additional_settings.selectable_durations').map((duration) => ({
            value: duration,
            label: `${duration} minutes`,
        })) : [];

        return options;
    };

    return (
        <Flex vertical className="quillbooking-event-settings">
            <Flex>
                <Typography.Title className='quillbooking-tab-title' level={4}>{__('General Settings', 'quillbooking')}</Typography.Title>
            </Flex>
            <Flex vertical gap={20}>
                <Card>
                    <Flex gap={20} vertical>
                        <FieldWrapper
                            label={__('Event Name', 'quillbooking')}
                            description={__('The name of the event', 'quillbooking')}
                            style={{ flex: 1 }}
                        >
                            <Flex>
                                <ColorSelector
                                    value={event.color}
                                    onChange={(color) => handleChange('color', color)}
                                />
                                <Input
                                    value={event.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder={__('Enter a name for the event', 'quillbooking')}
                                    size='large'
                                    style={{
                                        borderRadius: '0 4px 4px 0',
                                        flex: 1,
                                        borderLeft: 'none',
                                    }}
                                />
                            </Flex>
                        </FieldWrapper>
                        <FieldWrapper
                            label={__('Event Description', 'quillbooking')}
                            description={__('A short description of the event', 'quillbooking')}
                        >
                            <Input.TextArea
                                value={event.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder={__('Enter a description for the event', 'quillbooking')}
                                rows={4}
                            />
                        </FieldWrapper>
                    </Flex>
                </Card>
                <Card>
                    <Flex gap={20} vertical>
                        <FieldWrapper
                            label={__('Allow Attendees to Select Duration', 'quillbooking')}
                            description={__('Allow attendees to select the duration of the event', 'quillbooking')}
                            type="horizontal"
                        >
                            <Switch
                                checked={event.additional_settings.allow_attendees_to_select_duration}
                                onChange={(checked) => {
                                    handleAdditionalSettingsChange('allow_attendees_to_select_duration', checked);
                                }}
                            />
                        </FieldWrapper>
                        {event.additional_settings.allow_attendees_to_select_duration ? (
                            <>
                                <FieldWrapper
                                    label={__('Selectable Durations', 'quillbooking')}
                                    description={__('Select the durations that attendees can choose from', 'quillbooking')}
                                    style={{ flex: 1 }}
                                >
                                    <Select
                                        mode="multiple"
                                        options={durationOptions}
                                        value={event.additional_settings.selectable_durations}
                                        onChange={(values) => handleAdditionalSettingsChange('selectable_durations', values)}
                                    />
                                </FieldWrapper>
                                <FieldWrapper
                                    label={__('Default Duration', 'quillbooking')}
                                    description={__('The default duration for the event', 'quillbooking')}
                                    style={{ flex: 1 }}
                                >
                                    <Select
                                        options={getDefaultDurationOptions()}
                                        value={event.additional_settings.default_duration}
                                        onChange={(value) => handleAdditionalSettingsChange('default_duration', value)}
                                    />
                                </FieldWrapper>
                            </>
                        ) : (
                            <FieldWrapper
                                label={__('Event Duration', 'quillbooking')}
                                description={__('The duration of the event in minutes', 'quillbooking')}
                                style={{ flex: 1 }}
                            >
                                <Select
                                    options={durationOptions}
                                    value={durationMode === 'custom' ? 'custom' : event.duration}
                                    onChange={handleDurationChange}
                                />
                            </FieldWrapper>
                        )}
                        {durationMode === 'custom' && !event.additional_settings.allow_attendees_to_select_duration && (
                            <FieldWrapper
                                label={__('Custom Duration', 'quillbooking')}
                                description={__('Enter a custom duration in minutes', 'quillbooking')}
                                style={{ flex: 1 }}
                            >
                                <InputNumber
                                    value={event.duration}
                                    onChange={(value) => handleChange('duration', value)}
                                    placeholder={__('Enter a custom duration in minutes', 'quillbooking')}
                                />
                            </FieldWrapper>
                        )}
                    </Flex>
                </Card>
                <Locations locations={event.location} onChange={(locations) => handleChange('location', locations)} />
                <Button type="primary" onClick={saveSettings} loading={loading}>
                    {__('Save', 'quillbooking')}
                </Button>
            </Flex>
        </Flex>
    );
};

export default EventDetails;
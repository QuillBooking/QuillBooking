/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Typography, Input, Button, Select, InputNumber, Card, Flex, Checkbox, Form } from 'antd';

/**
 * Internal dependencies
 */
import { FieldWrapper } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import type { Event, AdditionalSettings } from '@quillbooking/client';
import ColorSelector from '../event/tabs/details/color-selector';
import Locations from '../event/tabs/details/locations';

/**
 * Create Event Component.
 */

const CreateEvent: React.FC = () => {
    // const { id, type } = useParams<{ id: string; type: 'one-to-one' | 'group' | 'round-robin' }>();
    // if (!id || !type) {
    //     return null;
    // }
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const setBreadcrumbs = useBreadcrumbs();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Partial<Event>>({
        name: '',
        description: '',
        type: '',
        calendar_id: parseInt(id),
        status: 'active',
        duration: 30,
        color: '',
        visibility: 'public',
        location: [{
            "type": "person_address",
            "fields": {
                "location": "Asyut",
                "display_on_booking": "qwesda"
            }
        },
        {
            "type": "attendee_phone",
            "fields": {}
        }],
        additional_settings: {
            max_invitees: 1,
            show_remaining: true,
            selectable_durations: [],
            default_duration: 15,
            allow_attendees_to_select_duration: false,
            allow_additional_guests: false,
        },
    });
    const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');

    useEffect(() => {
        setBreadcrumbs([
            {
                path: `calendars/${id}/create-event`,
                title: getEventTitle(type),
            }
        ]);
    }, [id, type]);

    const getEventTitle = (type: string) => {
        switch (type) {
            case 'one-to-one':
                return __('Create One-to-One Event', 'quillbooking');
            case 'group':
                return __('Create Group Event', 'quillbooking');
            case 'round-robin':
                return __('Create Round-Robin Event', 'quillbooking');
            default:
                return __('Create Event', 'quillbooking');
        }
    };

    const handleChange = (key: string, value: any) => {
        setEvent({ ...event, [key]: value });
    };

    const handleAdditionalSettingsChange = (key: keyof AdditionalSettings, value: any) => {
        if (!event.additional_settings) {
            return;
        }

        setEvent({
            ...event,
            additional_settings: {
                ...event.additional_settings,
                [key]: value,
            },
        });
    };

    const handleSubmit = () => {
        callApi({
            path: 'events',
            method: 'POST',
            data: event,
            onSuccess: (response: Event) => {
                successNotice(__('Event created successfully', 'quillbooking'));
                navigate(`calendars/${id}/events/${response.id}`);
            },
            onError: (error: string) => {
                errorNotice(error);
            }
        });
    };

    const durationOptions = [
        { value: 15, label: '15' },
        { value: 30, label: '30' },
        { value: 45, label: '45' },
        { value: 60, label: '60' },
        { value: 'custom', label: __('Custom', 'quillbooking') },
    ];

    const handleDurationChange = (value: number | string) => {
        if (value === 'custom') {
            setDurationMode('custom');
        } else {
            setDurationMode('preset');
            handleChange('duration', value);
        }
    };

    return (
        <Flex vertical className="quillbooking-create-event">
            <Flex>
                <Typography.Title className='quillbooking-tab-title' level={4}>
                    {getEventTitle(type)}
                </Typography.Title>
            </Flex>
            <Form layout="vertical" onFinish={handleSubmit}>
                <Flex vertical gap={20}>
                    <Card>
                        <Flex gap={20} vertical>
                            <FieldWrapper
                                label={__('Event Name', 'quillbooking')}
                                description={__('The name of the event', 'quillbooking')}
                                style={{ flex: 1 }}
                            >
                                <Form.Item
                                    name="name"
                                    rules={[{ required: true, message: __('Please enter the event name', 'quillbooking') }]}
                                >
                                    <Flex>
                                        <ColorSelector
                                            value={event.color || ''}
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
                                </Form.Item>
                            </FieldWrapper>
                            <FieldWrapper
                                label={__('Event Description', 'quillbooking')}
                                description={__('A short description of the event', 'quillbooking')}
                                style={{ flex: 1 }}
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
                            {durationMode === 'custom' && (
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
                    {type === 'group' && (
                        <Card>
                            <Flex gap={20} vertical>
                                <FieldWrapper
                                    label={__('Max Invitees', 'quillbooking')}
                                    description={__('Maximum number of invitees in a spot', 'quillbooking')}
                                    style={{ flex: 1 }}
                                >
                                    <InputNumber
                                        value={event.additional_settings?.max_invitees}
                                        onChange={(value) => handleAdditionalSettingsChange('max_invitees', value)}
                                        placeholder={__('Enter max invitees', 'quillbooking')}
                                    />
                                </FieldWrapper>
                                <FieldWrapper
                                    label={__('Display Remaining Spots', 'quillbooking')}
                                    description={__('Display remaining spots on booking page', 'quillbooking')}
                                    style={{ flex: 1 }}
                                >
                                    <Checkbox
                                        checked={event.additional_settings?.show_remaining}
                                        onChange={(e) => handleAdditionalSettingsChange('show_remaining', e.target.checked)}
                                    />
                                </FieldWrapper>
                            </Flex>
                        </Card>
                    )}
                    {/* <FieldWrapper
                        label={__('Locations', 'quillbooking')}
                        description={__('Select locations for the event', 'quillbooking')}
                        style={{ flex: 1 }}
                    >
                        <Form.Item
                            name="locations"
                            rules={[{ required: true, message: __('Please select at least one location', 'quillbooking') }]}
                        >
                            <Locations locations={event.location || []} onChange={(locations) => handleChange('location', locations)} />
                        </Form.Item>
                    </FieldWrapper> */}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {__('Create', 'quillbooking')}
                        </Button>
                    </Form.Item>
                </Flex>
            </Form>
        </Flex>
    );
};

export default CreateEvent;
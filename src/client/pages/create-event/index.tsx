/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Typography, Input, Button, Select, InputNumber, Card, Flex, Checkbox, Form, Steps, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { CollectiveIcon, FieldWrapper, GroupIcon, Header, RoundRobinIcon, ShareEventIcon, SingleIcon } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import type { Event, AdditionalSettings } from '@quillbooking/client';
import ColorSelector from '../event/tabs/details/color-selector';
import Locations from '../event/tabs/details/locations';
import './style.scss'
import { FaCheck } from 'react-icons/fa';

/**
 * Create Event Component.
 */
const { Step } = Steps;

const colors = ["#953AE4", "#0099FF", "#FF4F00", "#E55CFF", "#0AE8F0", "#17E885", "#CCF000", "#FFA600"];

interface CreateEventProps {
    visible: boolean;
    setVisible: (val: boolean) => void;
    onClose: () => void;
    calendarType: string;
    calendarId: number;
}

const CreateEvent: React.FC<CreateEventProps> = ({ visible, setVisible, onClose, calendarType, calendarId }) => {
    // const { id, type } = useParams<{ id: string; type: 'one-to-one' | 'group' | 'round-robin' }>();
    // if (!id || !type) {
    //     return null;
    // }
    const [current, setCurrent] = useState(0);
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    //const setBreadcrumbs = useBreadcrumbs();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Partial<Event>>({
        name: '',
        description: '',
        type: undefined,
        calendar_id: calendarId,
        status: 'active',
        duration: 30,
        color: '',
        visibility: 'public',
        location: [],
        additional_settings: {
            max_invitees: 1,
            show_remaining: true,
            selectable_durations: [],
            default_duration: 15,
            allow_attendees_to_select_duration: false,
            allow_additional_guests: false,
        },
    });

    const eventTypes: Record<string, string> =
        calendarType === 'team'
            ? {
                'round-robin': __('Round Robin', 'quillbooking'),
                //collective: 'Collective',
            }
            : {
                "one-to-one": __('One to One', 'quillbooking'),
                "group": __('Group', 'quillbooking'),
            };

    const next = () => setCurrent((prev) => prev + 1);
    const prev = () => setCurrent((prev) => prev - 1);

    const durations = [
        { value: 15, label: __("15 Minutes", "quillbooking"), description: __("Quick Check-in", "quillbooking") },
        { value: 30, label: __("30 Minutes", "quillbooking"), description: __("Standard Consultation", "quillbooking") },
        { value: 60, label: __("60 Minutes", "quillbooking"), description: __("In-depth discussion", "quillbooking") }
    ];

    //const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');

    // useEffect(() => {
    //     setBreadcrumbs([
    //         {
    //             path: `calendars/${id}/create-event`,
    //             title: getEventTitle(type),
    //         }
    //     ]);
    // }, [id, type]);

    // const getEventTitle = (type: string) => {
    //     switch (type) {
    //         case 'one-to-one':
    //             return __('Create One-to-One Event', 'quillbooking');
    //         case 'group':
    //             return __('Create Group Event', 'quillbooking');
    //         case 'round-robin':
    //             return __('Create Round-Robin Event', 'quillbooking');
    //         default:
    //             return __('Create Event', 'quillbooking');
    //     }
    // };

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
                navigate(`calendars/${calendarId}/events/${response.id}`);
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

    // const handleDurationChange = (value: number | string) => {
    //     if (value === 'custom') {
    //         setDurationMode('custom');
    //     } else {
    //         setDurationMode('preset');
    //         handleChange('duration', value);
    //     }
    // };

    const steps = [
        {
            title: 'Select Event Type',
            content: (
                <Flex vertical>
                    {calendarType !== 'team' && (
                        <Flex gap={1} vertical className=''>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Select Event Host", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <Select
                                placeholder="Select Host"
                                className="h-[48px] rounded-lg"
                                // onChange={(selectedId) => {
                                //     const selectedHost = hosts.find((host) => host.id === selectedId);
                                //     onChange("hosts", selectedHost ? [selectedHost] : []);
                                // }}
                                getPopupContainer={(trigger) => trigger.parentElement}
                                options={[
                                    { value: 'host', label: 'Host Name' },
                                ]}
                            />
                            <span className='text-[#818181] text-[12px]'>{__("Please select the hosts you want to assign to this event", "quillbooking")}</span>
                        </Flex>
                    )}
                    {calendarType === 'team' && (
                        <Flex gap={1} vertical className=''>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Select Team Members", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <Select
                                placeholder="Select Team"
                                className="h-[48px] rounded-lg"
                                // onChange={(selectedId) => {
                                //     const selectedHost = hosts.find((host) => host.id === selectedId);
                                //     onChange("hosts", selectedHost ? [selectedHost] : []);
                                // }}
                                getPopupContainer={(trigger) => trigger.parentElement}
                                options={[
                                    { value: 'team1', label: 'Team Member' },
                                ]}
                            />
                            <span className='text-[#818181] text-[12px]'>{__("Select the members you want to assign to this team.", "quillbooking")}</span>
                        </Flex>
                    )}
                    {calendarType === 'team' && (
                        <Flex vertical gap={20} className='mt-5'>
                            <Card
                                onClick={() => setEvent({ ...event, type: 'round-robin' })}
                                className={`cursor-pointer rounded-xl border-2 pl-2 ${event.type === 'round-robin' ? 'border-color-primary' : ''
                                    }`}
                            >
                                <Flex gap={15} align='center'>
                                    <RoundRobinIcon />
                                    <Flex vertical>
                                        <h3 className="text-[#2E2C2F] text-[18px] font-bold">{__('Round Robin', 'quillbooking')}</h3>
                                        <span className="text-[14px] text-[#979797]">
                                            <span className='font-semibold mr-1'>{__('One rotating host', 'quillbooking')}</span>
                                            {__('with', 'quillbooking')}
                                            <span className='font-semibold ml-1'>{__('One Invitee', 'quillbooking')}</span>
                                        </span>
                                        <span className="text-[12px] text-[#979797]"> {__('Good for Distributing Incoming Sales Leads.', 'quillbooking')}</span>

                                    </Flex>
                                </Flex>
                            </Card>
                            <Card
                                onClick={() => setEvent({ ...event, type: 'round-robin' })}
                                className={`cursor-pointer rounded-xl border-2 pl-2 ${event.type === 'round-robin' ? 'border-color-primary' : ''
                                    }`}
                            >
                                <Flex gap={15} align='center'>
                                    <CollectiveIcon />
                                    <Flex vertical>
                                        <h3 className="text-[#2E2C2F] text-[18px] font-bold">{__('Collective', 'quillbooking')}</h3>
                                        <span className="text-[14px] text-[#979797]">
                                            <span className='font-semibold mr-1'>{__('Multi Hosts', 'quillbooking')}</span>
                                            {__('with', 'quillbooking')}
                                            <span className='font-semibold ml-1'>{__('One Invitee', 'quillbooking')}</span>
                                        </span>
                                        <span className="text-[12px] text-[#979797]"> {__('Good for Panel Interviews, Group Sales Calls, etc.', 'quillbooking')}</span>

                                    </Flex>
                                </Flex>
                            </Card>
                        </Flex>
                    )}

                    {calendarType !== 'team' && (
                        <Flex vertical gap={20} className='mt-5'>
                            <Card
                                onClick={() => setEvent({ ...event, type: 'one-to-one' })}
                                className={`cursor-pointer rounded-xl border-2 pl-2 ${event.type === 'one-to-one' ? 'border-color-primary' : ''
                                    }`}
                            >
                                <Flex gap={15} align='center'>
                                    <SingleIcon />
                                    <Flex vertical>
                                        <h3 className="text-[#2E2C2F] text-[18px] font-bold">{__('Single Event', 'quillbooking')}</h3>
                                        <span className="text-[14px] text-[#979797]">
                                            <span className='font-semibold mr-1'>{__('Invite Someone', 'quillbooking')}</span>
                                            {__('to pick a time to meet with', 'quillbooking')}
                                            <span className='font-semibold ml-1'>{__('hosts.', 'quillbooking')}</span>
                                        </span>
                                        <span className="text-[12px] text-[#979797]"> {__('good for higher priority meetings', 'quillbooking')}</span>

                                    </Flex>
                                </Flex>
                            </Card>
                            <Card
                                onClick={() => setEvent({ ...event, type: 'group' })}
                                className={`cursor-pointer rounded-xl border-2 pl-2 ${event.type === 'group' ? 'border-color-primary' : ''
                                    }`}
                            >
                                <Flex gap={15} align='center'>
                                    <GroupIcon />
                                    <Flex vertical>
                                        <h3 className="text-[#2E2C2F] text-[18px] font-bold">{__('Group Event', 'quillbooking')}</h3>
                                        <span className="text-[14px] text-[#979797]">
                                            <span className='font-semibold mr-1'>{__('Reserve Spots', 'quillbooking')}</span>
                                            {__('for a Ccheduled event with', 'quillbooking')}
                                            <span className='font-semibold ml-1'>{__('hosts.', 'quillbooking')}</span>
                                        </span>
                                        <span className="text-[12px] text-[#979797]"> {__('good for reservation or ticketing system.', 'quillbooking')}</span>

                                    </Flex>
                                </Flex>
                            </Card>
                        </Flex>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Event Name & Duration',
            content: (

                <Flex gap={20} className='w-full'>
                    <Card className='w-1/2'>
                        <Flex vertical>
                            <Flex gap={1} vertical>
                                <div className="text-[#09090B] text-[16px]">
                                    {__("Event Calendar Name", "quillbooking")}
                                    <span className='text-red-500'>*</span>
                                </div>
                                <Input
                                    value={event.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder={__('Enter name of this event calendar', 'quillbooking')}
                                    className='h-[48px] rounded-lg'
                                    required
                                />
                            </Flex>
                            <Flex gap={1} vertical className='mt-4'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__("Description", "quillbooking")}
                                    <span className='text-red-500'>*</span>
                                </div>
                                <Input.TextArea
                                    value={event.description || ''}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder={__('type your Description', 'quillbooking')}
                                    rows={4}
                                    className='rounded-lg'
                                    required
                                />
                            </Flex>
                        </Flex>
                        <Flex gap={1} vertical className='mt-4'>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Event Color", "quillbooking")}
                            </div>
                            <div className="flex flex-wrap gap-4 place-items-center mt-2">
                                {colors.map((colorOption) => (
                                    <Button
                                        key={colorOption}
                                        shape="circle"
                                        size="large"
                                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 
                                                                        ${event.color === colorOption ? "ring ring-offset-2" : ""}`} // Apply ring only if selected
                                        style={{
                                            backgroundColor: colorOption,
                                            minWidth: "25px",
                                            border: colorOption ? "" : "2px solid #F2EBF9", // Dynamic border color
                                            "--tw-ring-color": colorOption ? colorOption : "",
                                        }}
                                        onClick={() => handleChange("color", colorOption)} // Update selected color
                                    >
                                        {event.color === colorOption && <FaCheck className="text-white text-md absolute" />}
                                    </Button>
                                ))}
                            </div>
                        </Flex>
                    </Card>
                    <Card className='w-1/2'>
                        <Flex vertical gap={20}>
                            <Flex vertical gap={8} className=''>
                                <div className="text-[#09090B] text-[16px]">
                                    {__("Meeting Duration", "quillbooking")}
                                    <span className='text-red-500'>*</span>
                                </div>
                                <Flex gap={20} className='flex-wrap'>
                                    {durations.map((item) => (
                                        <Card
                                            key={item.value}

                                            className={`cursor-pointer transition-all rounded-lg w-[200px]
                                                                ${event.duration == item.value ? "border-color-primary bg-[#F1E0FF]" : "border-[#f0f0f0]"}`}
                                            onClick={() => handleChange("duration", item.value)}
                                            bodyStyle={{ paddingTop: "18px" }}
                                        >
                                            <div className={`font-semibold ${event.duration == item.value ? "text-color-primary" : "text-[#1E2125]"}`}>{item.label}</div>
                                            <div className='text-[#1E2125] mt-[6px]'>{item.description}</div>
                                        </Card>
                                    ))}
                                </Flex>
                            </Flex>
                            <Flex gap={20} className='items-center'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__("Custom Duration", "quillbooking")}
                                </div>
                                <Input
                                    suffix={<span className='border-l pl-3'>{__("Min", "quillbooking")}</span>}
                                    className='h-[48px] rounded-lg flex items-center w-[194px]'
                                    value={event.duration}
                                    onChange={(e) => handleChange('duration', e.target.value)}
                                />
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>

            ),
        },
        {
            title: 'Setup Location',
            content: (
                <Card className='w-[1000px]'>
                    <Flex vertical gap={20}>
                        <Flex className='justify-between'>
                            <div className="text-[#09090B] text-[16px]">
                                {__("How Will You Meet", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <div className="text-[#848484] italic">
                                {__("You Can Select More Than One", "quillbooking")}
                            </div>
                        </Flex>
                        <div className='grid grid-cols-2 gap-[15px]'>
                            <Locations locations={event.location || []} onChange={(locations) => handleChange('location', locations)} onKeepDialogOpen={() => setVisible(true)} />
                        </div>
                    </Flex>
                </Card>
            ),
        },
    ];

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            className='w-fit'
        >
            <Flex vertical className="quillbooking-create-event">
                <Flex gap={10} className='items-center pb-8'>
                    <ShareEventIcon />
                    <Header header={__('Create a new event', 'quillbooking')}
                        subHeader={__(
                            'Add the following data to Create New Event Type.',
                            'quillbooking'
                        )} />
                </Flex>
                <Steps current={current} size="small" className="mb-6 custom-steps bg-[#FBF9FC] px-14 py-6">
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <div className="mb-6">{steps[current].content}</div>

                <Flex className="items-center justify-end" gap={10}>
                    {current > 0 && (
                        <Button onClick={prev}
                            className='bg-[#FBF9FC] text-color-primary text-[16px] py-5 px-16 font-semibold rounded-lg border-none'
                        >
                            {__("Back", "quillbooking")}
                        </Button>
                    )}
                    {current < steps.length - 1 ? (
                        <Button
                            type="primary"
                            onClick={next}
                            disabled={current === 0 && !event.type}
                            className={`rounded-lg py-5 px-12 font-semibold text-[16px] text-white bg-color-primary border-none transition ${current === 0
                                ? 'w-full' // custom style for step 0
                                : ''      // other steps
                                }`}

                        >
                            {__("Continue", "quillbooking")}
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            disabled={
                                !event.name || !event.description || !event.location
                            }
                            className='bg-color-primary py-5 px-8 text-white text-[16px] font-semibold rounded-lg border-none'
                        >
                            {__("Submit Event", "quillbooking")}
                        </Button>
                    )}
                </Flex>
                {/* <Select
                    style={{ width: '100%' }}
                    placeholder="Select event type"
                    options={Object.entries(eventTypes).map(([value, label]) => ({
                        value,
                        label,
                    }))}
                    value={event.type}
                    onChange={(value) => setEvent({ ...event, type: value })}
                />
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
                        </Card> */}
                {/* {type === 'group' && ( */}
                {/* <Card>
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
                        </Card> */}
                {/* )} */}
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
                {/* <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {__('Create', 'quillbooking')}
                            </Button>
                        </Form.Item>
                    </Flex>
                </Form> */}
            </Flex>
        </Modal>
    );
};

export default CreateEvent;
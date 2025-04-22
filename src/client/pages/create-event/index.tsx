/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Input, Button, Card, Flex, Steps, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { CollectiveIcon, GroupIcon, Header, HostSelect, RoundRobinIcon, ShareEventIcon, SingleIcon } from '@quillbooking/components';
import { useApi, useNotice, useNavigate, useCurrentUser } from '@quillbooking/hooks';
import type { Event, AdditionalSettings } from '@quillbooking/client';
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
    const [current, setCurrent] = useState(0);
    const { callApi, loading } = useApi();
    const currentUser = useCurrentUser();
    const { successNotice, errorNotice } = useNotice();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<number>(0);
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
        hosts: [],
        additional_settings: {
            max_invitees: 1,
            show_remaining: true,
            selectable_durations: [],
            default_duration: 15,
            allow_attendees_to_select_duration: false,
            allow_additional_guests: false,
        },
    });

    const [validationErrors, setValidationErrors] = useState({
        name: false,
        location: false,
        members: false,
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

    const next = () => {
        // For step 1 (current === 0), we only need to check event.type
        if (current === 0) {
            if (!event.type) {
                errorNotice(__('Please select an event type', 'quillbooking'));
                return;
            }

            if (calendarType === 'team' && (!event.hosts || event.hosts.length === 0)) {
                setValidationErrors(prev => ({ ...prev, members: true }));
                errorNotice(__('Please select at least one team member', 'quillbooking'));
                return;
            }
        }

        // For step 2 (current === 1), validate name and description
        if (current === 1) {
            const errors = {
                name: !event.name,
                location: false,
                members: false,
            };

            setValidationErrors(errors);
        }

        setCurrent((prev) => prev + 1);
    };
    const prev = () => setCurrent((prev) => prev - 1);

    const durations = [
        { value: 15, label: __("15 Minutes", "quillbooking"), description: __("Quick Check-in", "quillbooking") },
        { value: 30, label: __("30 Minutes", "quillbooking"), description: __("Standard Consultation", "quillbooking") },
        { value: 60, label: __("60 Minutes", "quillbooking"), description: __("In-depth discussion", "quillbooking") }
    ];

    const handleChange = (key: string, value: any) => {
        setEvent({ ...event, [key]: value });
    };

    const handleSubmit = () => {
        if (!event.name || !event.description || !event.location || event.location.length === 0) {
            setValidationErrors({
                name: !event.name,
                location: !event.location || event.location.length === 0,
                members: !event.hosts
            });
            return;
        }

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

    const steps = [
        {
            title: 'Select Event Type',
            content: (
                <Flex vertical>
                    {/* {calendarType !== 'team' && currentUser.isAdmin() && (
                        <Flex gap={1} vertical className=''>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Select Event Host", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <HostSelect
                                value={event.user_id || 0}
                                onChange={(userId) => {
                                    handleChange('user_id', userId);
                                    setSelectedUser(userId);
                                }}
                                placeholder={__('Select Host', 'quillbooking')}
                                defaultValue={0}
                                selectFirstHost={false}
                            />
                            <span className='text-[#818181] text-[12px]'>{__("Please select the hosts you want to assign to this event", "quillbooking")}</span>
                        </Flex>
                    )} */}
                    {calendarType === 'team' && (
                        <Flex gap={1} vertical className=''>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Select Team Members", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <HostSelect
                                value={event.hosts?.map(host => host.id) || []}
                                onChange={(userIds: number[]) => {
                                    // Update both user_id (primary host) and hosts array
                                    const updatedEvent = {
                                        ...event,
                                        user_id: userIds[0] || 0, // Set first selected as primary
                                        hosts: userIds.map(id => ({ id, name: '' })) // Minimal host object
                                    };
                                    setEvent(updatedEvent);

                                    // Clear validation error when users are selected
                                    if (userIds.length > 0) {
                                        setValidationErrors(prev => ({ ...prev, members: false }));
                                    }
                                }}
                                multiple
                                placeholder={__('Select team members...', 'quillbooking')}
                            />
                            {validationErrors.members && (
                                <span className="text-red-500 text-sm">
                                    {__("At least one team member is required", "quillbooking")}
                                </span>
                            )}
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
                                {/* <Flex gap={15} align='center'>
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
                                </Flex> */}
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
                                    onChange={(e) => {
                                        handleChange('name', e.target.value);
                                        setValidationErrors(prev => ({ ...prev, name: false }));
                                    }}
                                    placeholder={__('Enter name of this event calendar', 'quillbooking')}
                                    className='h-[48px] rounded-lg'
                                    status={validationErrors.name ? 'error' : ''}
                                />
                                {validationErrors.name && (
                                    <span className="text-red-500 text-sm">
                                        {__("Event name is required", "quillbooking")}
                                    </span>
                                )}
                            </Flex>
                            <Flex gap={1} vertical className='mt-4'>
                                <div className="text-[#09090B] text-[16px]">
                                    {__("Description", "quillbooking")}
                                    <span className='text-red-500'>*</span>
                                </div>
                                <Input.TextArea
                                    value={event.description || ''}
                                    onChange={(e) => {
                                        handleChange('description', e.target.value);
                                    }}
                                    placeholder={__('type your Description', 'quillbooking')}
                                    rows={4}
                                    className='rounded-lg'
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
                                    type='number'
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
                            <Locations locations={event.location || []}
                                onChange={(locations) => {
                                    handleChange('location', locations);
                                    setValidationErrors(prev => ({ ...prev, location: false }));
                                }} onKeepDialogOpen={() => setVisible(true)} />
                        </div>
                        {validationErrors.location && (
                            <span className="text-red-500 text-sm">
                                {__("At least one location is required", "quillbooking")}
                            </span>
                        )}
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
                            className='bg-[#FBF9FC] text-color-primary text-[16px] px-16 font-semibold rounded-lg border-none'
                        >
                            {__("Back", "quillbooking")}
                        </Button>
                    )}
                    {current < steps.length - 1 ? (
                        <Button
                            type="primary"
                            onClick={next}
                            disabled={current === 0 && !event.type || current === 1 && !event.name && !event.description || current === 2 && !event.location}
                            className={`rounded-lg px-12 font-semibold text-[16px] text-white bg-color-primary border-none transition ${current === 0
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
                                !event.location || event.location.length === 0
                            }
                            className='bg-color-primary px-8 text-white text-[16px] font-semibold rounded-lg border-none'
                        >
                            {__("Submit Event", "quillbooking")}
                        </Button>
                    )}
                </Flex>
            </Flex>
        </Modal>
    );
};

export default CreateEvent;
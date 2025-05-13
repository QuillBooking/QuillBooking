/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Card, Flex, Typography } from 'antd';
import { GoArrowRight } from "react-icons/go";
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useCopyToClipboard, useCurrentUser, useNavigate, useNotice } from '@quillbooking/hooks';
import { CloneIcon, ShareIcon, ShareModal, TimeIcon, UpcomingCalendarIcon } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';

const MAX_EVENTS = 7; // Maximum number of events to display

interface Event {
    id: number;
    name: string;
    duration: string;
    type: string;
    booking_no: number;
    location: string;
}

const LatestEvents: React.FC = () => {
    const { callApi } = useApi();
    const currentUser = useCurrentUser();
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]); // Fixed from Event to Event[]
    const { errorNotice } = useNotice();
    const [modalShareId, setModalShareId] = useState<number | null>(null);
    const siteUrl = ConfigAPI.getSiteUrl();
    const copyToClipboard = useCopyToClipboard();

    // Function to get random background color based on event name
    const getInitialBackgroundColor = (name: string): string => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-cyan-500',
        ];
        const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return colors[charSum % colors.length];
    };

    // Function to get initial letter of the event name
    const getInitialLetter = (name: string): string => {
        return name.trim()[0].toUpperCase();
    };

    // Function to get total active events count
    const getTotalActiveEventsCount = (): number => {
        return events.length;
    };

    const fetchEvents = async () => {
        callApi({
            path: addQueryArgs('events/latest', {
                limit: MAX_EVENTS,
                user_id: currentUser.getId(),
                status: 'active'
            }),
            onSuccess: (response: Event[]) => {
                setEvents(response);
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <Card>
            <Flex justify='space-between' align='center' className='pb-8'>
                <Flex vertical>
                    <div className='text-[18px] text-[#3F4254] font-semibold'>{__('Latest Events', 'quillbooking')}</div>
                    <div className='text-[#A1A5B7] font-semibold'>
                        {__(
                            `${getTotalActiveEventsCount()} Events Running`,
                            'quillbooking'
                        )}
                    </div>
                </Flex>
                <Button
                    onClick={() => navigate('Calendars')}
                    className='bg-[#F1F1F2] text-[#A1A5B7] font-semibold border-none shadow-none'>
                    {__('View All Events', 'quillbooking')}
                </Button>
            </Flex>
            {events.length > 0 ? (
                events.map((event) => (
                    <div key={event.id} className="border-t-2 border-dashed pt-4 pb-5">
                        <Flex align='center' justify='space-between'>
                            <Flex align="flex-start" gap={15}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold ${getInitialBackgroundColor(event.name)}`}>
                                    {getInitialLetter(event.name)}
                                </div>
                                <Flex vertical>
                                    <div className="font-semibold text-[#3F4254]">{event.name}</div>
                                    <Flex gap={16} align='center'>
                                        <Typography.Text
                                            type="secondary"
                                            className="text-[#1A1A1A99] flex items-center gap-2 border-r pr-4"
                                        >
                                            <TimeIcon />
                                            {event.duration}{' '}
                                            {__('Mins', 'quillbooking')}
                                        </Typography.Text>
                                        <div className="font-medium text-[#09090B] border-r pr-4">
                                            {event.type}
                                        </div>
                                        <div className="font-medium text-[#09090B]">
                                            {__(`Bookings No. (${event.booking_no})`, 'quillbooking')}
                                        </div>
                                    </Flex>
                                    <div className="font-medium text-[#09090B] pt-1">
                                        {event.location}
                                    </div>
                                </Flex>
                            </Flex>
                            <Flex gap={10} align='center'>
                                <Button
                                    onClick={() => setModalShareId(event.id)}
                                    className='bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none'>
                                    <ShareIcon />
                                </Button>
                                <Button
                                    onClick={() =>
                                        copyToClipboard(
                                            `${siteUrl}?quillbooking_event=${event.id}`,
                                            __('Link copied', 'quillbooking')
                                        )
                                    }
                                    className='bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none'>
                                    <CloneIcon />
                                </Button>
                                <Button
                                    onClick={() => navigate(`calendars/events/${event.id}`)}
                                    className='bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none'>
                                    <GoArrowRight size={16} className='text-[#292D32]' />
                                </Button>
                            </Flex>
                        </Flex>
                        {modalShareId === event.id && (
                            <ShareModal
                                open={modalShareId === event.id}
                                onClose={() => setModalShareId(null)}
                                url={`${siteUrl}?quillbooking_event=${event.id}`}
                            />
                        )}
                    </div>
                ))
            ) : (
                <div className="flex flex-col gap-4 justify-center items-center mt-4 h-full p-4 my-6 py-6">
                    <div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9] text-[#BEC0CA]">
                        <UpcomingCalendarIcon width={60} height={60} />
                    </div>

                    <p className="text-xl font-medium my-1 text-color-primary-text">
                        {__('No Events Yet?', 'quillbooking')}
                    </p>

                    <p className='text-[#8B8D97]'>
                        {__('Add New Events Manually.', 'quillbooking')}
                    </p>

                    <Button
                        type="primary"
                        className="bg-color-primary text-white"
                        size="large"
                        onClick={() => {
                            navigate('calendars');
                        }}
                    >
                        <PlusOutlined />
                        {__('Add Event', 'quillbooking')}
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default LatestEvents;
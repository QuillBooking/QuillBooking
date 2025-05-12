/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';


/**
 * External dependencies
 */
import { Button, Card, Flex } from 'antd';
import { PlusOutlined } from '@ant-design/icons';


/**
 * Internal dependencies
 */
import { UpcomingCalendarIcon } from '@quillbooking/components'
import MonthSelector from '../../../pages/bookings/month-selector';
import { Booking } from '@quillbooking/client';
import { useApi, useNotice, useNavigate, useCurrentUser } from '@quillbooking/hooks';
import { groupBookingsByDate } from '@quillbooking/utils';
import AddBookingModal from '../../../pages/bookings/add-booking-modal';
import { GoArrowRight } from 'react-icons/go';



const LatestBookings: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [year, setYear] = useState(currentYear);
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const [author, setAuthor] = useState<string>(currentUser.isAdmin() ? 'all' : 'own');;
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
    const [open, setOpen] = useState<boolean>(false);
    const [updateStatus, setUpdateStatus] = useState<boolean>(false);
    const { errorNotice } = useNotice();
    const { callApi } = useApi();

    const fetchBookings = () => {
        callApi({
            path: addQueryArgs('bookings', {
                filter: {
                    year: year,
                    month: selectedMonth,
                    period: 'latest',
                    user: author.toLowerCase(),
                },
            }),
            method: 'GET',
            onSuccess: (res) => {
                // Get all bookings grouped by date
                const allBookings = groupBookingsByDate(res.bookings.data);
                setBookings(allBookings);
            },
            onError: () => {
                errorNotice(__('Error fetching bookings', 'quillbooking'));
            },
        });
    };

    useEffect(() => {
        fetchBookings();
    }, [year, author, selectedMonth, updateStatus]);

    const isToday = (dateLabel: string) => {
        const [day] = dateLabel.split('-');
        return day.toLowerCase() === 'today';
    };

    return (
        <Flex vertical gap={20}>
            <MonthSelector
                year={year}
                setYear={setYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
            />
            <Card>
                <div className='text-[#202027] text-[18px] font-semibold pb-2'>
                    {__('Booking Lists', 'quillbooking')}
                </div>
                {Object.keys(bookings).length > 0 ? (
                    <>
                        {Object.entries(bookings).map(([dateLabel, bookings], index, array) => {
                            const [day, number] = dateLabel.split('-');
                            const isTodayDate = isToday(dateLabel);
                            const isLastItem = index === array.length - 1;

                            return (
                                <div
                                    className="flex gap-4"
                                    key={dateLabel}
                                >
                                    <div className="flex-shrink-0">
                                        <div className={`flex flex-col justify-center items-center rounded-xl size-14 ${isTodayDate ? "bg-color-primary" : "bg-purple-100"
                                            }`}>
                                            <span className={`text-xs font-medium capitalize ${isTodayDate ? "text-white" : "text-color-primary"}`}>
                                                {day.slice(0, 3)}
                                            </span>
                                            <span className={`text-2xl font-bold ${isTodayDate ? "text-white" : "text-color-primary"}`}>
                                                {number}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`w-full ${!isLastItem ? 'border-dashed border-b-2 border-[#DEE1E6]' : ''} pb-2 mb-2`}>
                                        <div className="space-y-4">
                                            {bookings.map((booking) => (
                                                <Flex
                                                    align="center"
                                                    key={booking.id}
                                                    className="pb-2 w-full"
                                                >
                                                    <Flex justify='space-between' align='flex-start' className='w-full'>
                                                        <Flex vertical>
                                                            <p className="text-lg font-semibold text-color-primary-text py-1">
                                                                {booking.event.name}
                                                            </p>
                                                            <Flex align='center' gap={8} className='text-[#A0A6B1] text-base font-medium'>
                                                                <p>
                                                                    {booking.time_span}
                                                                </p>
                                                                {booking.event.location.length > 0 && (
                                                                    <>
                                                                        {' • '}
                                                                        {booking.event.location.map((location, index) => (
                                                                            <span key={index}>
                                                                                {location.type}
                                                                                {index < booking.event.location.length - 1 && ', '}
                                                                            </span>
                                                                        ))}
                                                                        {' • '}
                                                                    </>
                                                                )}
                                                                <p>
                                                                    {__('1 person', 'quillbooking')}
                                                                </p>
                                                            </Flex>
                                                        </Flex>
                                                        <Button
                                                            onClick={() => navigate(`bookings/${booking.id}`)}
                                                            className='bg-color-secondary p-2 rounded-lg border-none shadow-none'>
                                                            <GoArrowRight size={16} className='text-color-primary' />
                                                        </Button>
                                                    </Flex>
                                                </Flex>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div className="flex flex-col gap-4 justify-center items-center mt-4 h-full p-4 my-6 py-6">
                        <div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9] text-[#BEC0CA]">
                            <UpcomingCalendarIcon width={60} height={60} />
                        </div>

                        <p className="text-xl font-medium my-1 text-color-primary-text">
                            {__('No Bookings Yet?', 'quillbooking')}
                        </p>

                        <p className='text-[#8B8D97]'>
                            {__(
                                'Add New Booking Manually.',
                                'quillbooking'
                            )}
                        </p>

                        <Button
                            type="primary"
                            className="bg-color-primary text-white"
                            size="large"
                            onClick={() => {
                                setOpen(true);
                            }}
                        >
                            <PlusOutlined />
                            {__('Add Booking Manually', 'quillbooking')}
                        </Button>
                    </div>
                )}

                {open && (
                    <AddBookingModal
                        open={open}
                        onClose={() => setOpen(false)}
                        onSaved={() => {
                            setOpen(false);
                            setUpdateStatus((prev) => !prev);
                        }}
                    />
                )}
            </Card>

        </Flex>
    );
};

export default LatestBookings;
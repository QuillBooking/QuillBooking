/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Internal dependencies
 */
import { RevenueIcon, SettingsTeamIcon } from '@quillbooking/components';
import { useApi, useCurrentUser } from '@quillbooking/hooks';
import { addQueryArgs } from '@wordpress/url';

const BookingAnalyticsChart: React.FC = () => {
    const [revenueFilter, setRevenueFilter] = useState<string>('monthly');
    const [guestsFilter, setguestsFilter] = useState<string>('monthly');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'short' }).toLowerCase());
    const [analyticsData, setAnalyticsData] = useState<Array<{
        name: string;
        booked: number;
        completed: number;
        canceled: number;
        total: number;
    }>>([]);
    const [revenueData, setRevenueData] = useState<{ total: number }>({ total: 0 });
    const [guestCountData, setGuestCountData] = useState<{ total: number }>({ total: 0 });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const currentUser = useCurrentUser();
    const currentYear = new Date().getFullYear();
    const { callApi } = useApi();

    // Generate month filter options
    const monthFilter = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        return {
            label: __(`${date.toLocaleString('default', { month: 'long' })} ${currentYear}`, 'quillbooking'),
            value: date.toLocaleString('default', { month: 'short' }).toLowerCase()
        };
    });

    useEffect(() => {
        fetchBookingAnalytics();
    }, [selectedMonth]);

    useEffect(() => {
        fetchRevenueData();
    }, [revenueFilter]);

    useEffect(() => {
        fetchGuestCountData();
    }, [guestsFilter]);

    const fetchBookingAnalytics = () => {
        setLoading(true);
        setError(null);
        
        const monthName = new Date(`${selectedMonth} 1, ${currentYear}`).toLocaleString('default', { month: 'long' });
        const dateString = `${monthName} ${currentYear}`;

        callApi({
            path: addQueryArgs('bookings/analytics', {
                user: currentUser.getId(),
                date: dateString
            }),
            method: 'GET',
            onSuccess: (res) => {
                let transformedData;
                
                if (Object.keys(res).length === 0) {
                    const daysInMonth = new Date(currentYear, new Date(`${selectedMonth} 1, ${currentYear}`).getMonth() + 1, 0).getDate();
                    transformedData = Array.from({ length: daysInMonth }, (_, i) => ({
                        name: `${monthName.slice(0, 3)} ${i + 1}`,
                        booked: 0,
                        completed: 0,
                        canceled: 0,
                        total: 0
                    }));
                } else {
                    transformedData = Object.entries(res).map(([day, data]) => {
                        const typedData = data as { booked?: number; completed?: number; cancelled?: number };
                        return {
                            name: `${monthName.slice(0, 3)} ${day}`,
                            booked: typedData.booked || 0,
                            completed: typedData.completed || 0,
                            canceled: typedData.cancelled || 0,
                            total: (typedData.booked || 0) + (typedData.completed || 0) + (typedData.cancelled || 0)
                        };
                    });
                }
                
                setAnalyticsData(transformedData);
                setLoading(false);
            },
            onError: () => {
                setError(__('Failed to load booking analytics', 'quillbooking'));
                setLoading(false);
            },
        });
    };

    const fetchRevenueData = () => {
        callApi({
            path: addQueryArgs('bookings/revenue', {
                user: currentUser.getId(),
                period: revenueFilter,
                year: currentYear,
                month: new Date(`${selectedMonth} 1, ${currentYear}`).getMonth() + 1
            }),
            method: 'GET',
            onSuccess: (res) => {
                setRevenueData({
                    total: res.total_revenue || 0
                });
            },
            onError: () => {
                console.error('Failed to load revenue data');
            }
        });
    };

    const fetchGuestCountData = () => {
        callApi({
            path: addQueryArgs('bookings/total-guests', {
                user: currentUser.getId(),
                filter: {
                    period: `this_${guestsFilter}`
                }
            }),
            method: 'GET',
            onSuccess: (res) => {
                setGuestCountData({
                    total: res || 0
                });
            },
            onError: () => {
                console.error('Failed to load guest count data');
            }
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD', // You can make this dynamic based on your settings
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Flex vertical gap={20}>
            <Flex gap={20} className='w-full'>
                <Card className='w-full'>
                    <Flex vertical gap={20}>
                        <Flex justify='space-between' align='center'>
                            <div className='text-color-primary bg-color-secondary p-2 rounded-lg'>
                                <RevenueIcon />
                            </div>
                            <Select
                                className='border-none shadow-none'
                                value={revenueFilter}
                                variant='borderless'
                                onChange={(value) => setRevenueFilter(value)}
                                options={[
                                    { value: 'weekly', label: __('This Week', 'quillbooking') },
                                    { value: 'monthly', label: __('This Month', 'quillbooking') },
                                    { value: 'year', label: __('This Year', 'quillbooking') },
                                ]}
                            />
                        </Flex>
                        <Flex vertical>
                            <div className='text-[#292D32] text-base'>{__('Total Revenue', 'quillbooking')}</div>
                            <div className='text-[#292D32] font-medium text-xl'>{formatCurrency(revenueData.total)}</div>
                        </Flex>
                    </Flex>
                </Card>
                <Card className='w-full'>
                    <Flex vertical gap={20}>
                        <Flex justify='space-between' align='center'>
                            <div className='text-color-primary bg-color-secondary p-2 rounded-lg'>
                                <SettingsTeamIcon width={24} height={24} />
                            </div>
                            <Select
                                className='border-none shadow-none'
                                value={guestsFilter}
                                variant='borderless'
                                onChange={(value) => setguestsFilter(value)}
                                options={[
                                    { value: 'weekly', label: __('This Week', 'quillbooking') },
                                    { value: 'monthly', label: __('This Month', 'quillbooking') },
                                    { value: 'year', label: __('This Year', 'quillbooking') },
                                ]}
                            />
                        </Flex>
                        <Flex vertical>
                            <div className='text-[#292D32] text-base'>{__('Total Guests', 'quillbooking')}</div>
                            <div className='text-[#292D32] font-medium text-xl'>{guestCountData.total}</div>
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
            <Card>
                <Flex justify='space-between' align='center'>
                    <div className='text-[#202027] text-[18px] font-semibold pb-2'>
                        {__('Booking Analytics', 'quillbooking')}
                    </div>
                    <Select
                        variant='borderless'
                        className='rounded-md bg-[#F4F4F5] cursor-pointer text-[#7E8299] w-fit'
                        options={monthFilter}
                        value={selectedMonth}
                        onChange={(value) => setSelectedMonth(value)}
                    />
                </Flex>
                <Flex justify='center' align='center' gap={20} className='mt-4'>
                    <Flex align='center' gap={8}>
                        <div className="w-6 h-2 rounded-full bg-color-primary"></div>
                        <div className='text-color-primary font-semibold'>{__('Booked', 'quillbooking')}</div>
                    </Flex>
                    <Flex align='center' gap={8}>
                        <div className="w-6 h-2 rounded-full bg-[#34C759]"></div>
                        <div className='text-[#34C759] font-semibold'>{__('Completed', 'quillbooking')}</div>
                    </Flex>
                    <Flex align='center' gap={8}>
                        <div className="w-6 h-2 rounded-full bg-[#EF4444]"></div>
                        <div className='text-[#EF4444] font-semibold'>{__('Canceled', 'quillbooking')}</div>
                    </Flex>
                </Flex>

                {/* Chart */}
                <div className='h-[14.4rem] w-full mt-4'>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div>{__('Loading data...', 'quillbooking')}</div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-red-500">
                            {error}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 'dataMax + 50']} />
                                <Tooltip />
                                <Bar dataKey="booked" fill="#953AE4" radius={[4, 4, 0, 0]} barSize={10} />
                                <Bar dataKey="completed" fill="#34C759" radius={[4, 4, 0, 0]} barSize={10} />
                                <Bar dataKey="canceled" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>
        </Flex>
    );
};

export default BookingAnalyticsChart;
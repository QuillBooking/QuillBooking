/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Input, Skeleton, Divider, Checkbox, Radio } from 'antd';

/**
 * Internal dependencies
 */
import { TimezoneSelect, CardHeader, AdvancedSettingsIcon } from '@quillbooking/components';
import { useBreadcrumbs } from '@quillbooking/hooks';
import { useCalendarContext } from '../../state/context';
import AvatarSelector from './avatar-selector';
import FeaturedImageSelector from './featured-image-selector';

/**
 * Main Calendars Component.
 */
const GeneralSettings: React.FC = () => {
    const { state, actions } = useCalendarContext();
    const [bookingForms, setBookingForms] = useState<string>('all')
    const setBreadcrumbs = useBreadcrumbs();

    useEffect(() => {
        if (!state) {
            return;
        }

        setBreadcrumbs([
            {
                path: `calendars/${state.id}/general`,
                title: __('Settings', 'quillbooking')
            }
        ]);
    }, [state]);

    if (!state) {
        return <Skeleton active />;
    }

    const handleChange = (key: string, value: any) => {
        actions.setCalendar({ ...state, [key]: value });
    };

    const getCurrentTimeInTimezone = (timezone) => {
        if (!timezone) {
            return __('Unknown (timezone not set)', 'quillbooking');
        }

        try {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: timezone,
            };

            const now = new Date();
            // @ts-ignore
            return now.toLocaleString('en-US', options);
        } catch (error) {
            return __('Invalid timezone format', 'quillbooking');
        }
    }

    return (
        <Card className="quillbooking-calendar-settings">
            <CardHeader title={__('General Settings', 'quillbooking')}
                description={__('Manage general settings for this calendar.', 'quillbooking')}
                icon={<AdvancedSettingsIcon />}
                border={false}
            />
            <Card className='mb-2 px-5'>
                <Flex vertical gap={20}>
                    <FeaturedImageSelector
                        value={state.featured_image}
                        onChange={(value) => handleChange('featured_image', value)}
                    />
                    <Flex justify='space-between' align='flex-start' className='w-full'>
                        <AvatarSelector
                            value={state.avatar}
                            onChange={(value) => handleChange('avatar', value)}
                        />
                        <Flex vertical gap={50} className='w-full'>
                            <Flex vertical gap={4}>
                                <div className='text-base font-semibold'>{__('Host Name / Calendar Title', 'quillbooking')}</div>
                                <Input
                                    value={state.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder={__('Host Name / Calendar Title', 'quillbooking')}
                                    className='rounded-lg h-[48px]'
                                />
                            </Flex>
                            <Flex vertical gap={4}>
                                <div className='text-base font-semibold'>{__('About', 'quillbooking')}</div>
                                <Input.TextArea
                                    value={state.description}
                                    rows={6}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder={__('Type your a description for this calendar', 'quillbooking')}
                                    className='rounded-lg'
                                />
                                <div className='text-[#9197A4]'>{__('Will be shown on your calendar landing page / team block UI', 'quillbooking')}</div>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Card className='mt-4'>
                        <Flex vertical gap={8}>
                            <Flex vertical gap={4}>
                                <div className='text-base font-semibold'>{__('Host Timezone', 'quillbooking')}</div>
                                <TimezoneSelect
                                    value={state.timezone}
                                    onChange={(value) => handleChange('timezone', value)}
                                />
                            </Flex>
                            <Divider />
                            <Checkbox
                                className="custom-check text-base font-semibold"
                                checked={state.enable_landing_page || false}
                                onChange={(e) => handleChange('enable_landing_page', e.target.checked)}
                            >
                                {__('Enable Landing Page Features for this calendar', 'quillbooking')}
                            </Checkbox>
                            <Flex vertical gap={6} className='mt-4'>
                                <div className='text-base font-semibold'>{__('Which Booking Forms to Show?', 'quillbooking')}</div>
                                <Radio.Group
                                    value={bookingForms}
                                    onChange={(e) => setBookingForms(e.target.value)}
                                    className="flex"
                                >
                                    <Radio value="all"
                                        className={`custom-radio border w-[300px] rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${bookingForms === 'all'
                                                ? 'bg-color-secondary border-color-primary'
                                                : 'border'
                                            }`}
                                    >
                                        {__('All Active Booking Forms', 'quillbooking')}
                                    </Radio>
                                    <Radio value="select"
                                        className={`custom-radio border w-[300px] rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${bookingForms === 'select'
                                                ? 'bg-color-secondary border-color-primary'
                                                : 'border'
                                            }`}
                                    >
                                        {__('Only Selected Active Booking Types', 'quillbooking')}
                                    </Radio>
                                </Radio.Group>
                            </Flex>
                            {bookingForms === 'select' && (
                                <Flex vertical gap={6} className='mt-4'>
                                    <div className='text-base font-semibold'>{__('Please select which Booking Forms to show in the page?', 'quillbooking')}</div>
                                    <Checkbox.Group className='flex'>
                                        <Checkbox
                                            className="custom-check text-base font-semibold">
                                            {__('Booking Form 01', 'quillbooking')}
                                        </Checkbox>
                                        <Checkbox
                                            className="custom-check text-base font-semibold">
                                            {__('Booking Form 01', 'quillbooking')}
                                        </Checkbox>
                                    </Checkbox.Group>
                                </Flex>
                            )}
                        </Flex>
                    </Card>
                </Flex>
            </Card>
        </Card>
    );
};

export default GeneralSettings;
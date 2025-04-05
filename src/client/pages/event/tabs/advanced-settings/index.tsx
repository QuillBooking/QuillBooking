/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Switch, Select, Input, InputNumber, Radio, Skeleton, Typography, Divider, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import { AdvancedSettingsIcon, EditIcon, FieldWrapper, Header, UrlIcon } from '@quillbooking/components';
import { BiEditAlt } from "react-icons/bi";

const { Title } = Typography;

type UnitOptions = 'minutes' | 'hours' | 'days';

interface AdvancedSettings {
    submit_button_text: string;
    redirect_after_submit: boolean;
    redirect_url: string;
    require_confirmation: boolean;
    confirmation_time: 'always' | 'less_than';
    confirmation_time_value: number;
    confirmation_time_unit: UnitOptions;
    allow_multiple_bookings: boolean;
    maximum_bookings: number;
    attendee_cannot_cancel: boolean;
    cannot_cancel_time: 'event_start' | 'less_than';
    cannot_cancel_time_value: number;
    cannot_cancel_time_unit: UnitOptions;
    permission_denied_message: string;
    attendee_cannot_reschedule: boolean;
    cannot_reschedule_time: 'event_start' | 'less_than';
    cannot_reschedule_time_value: number;
    cannot_reschedule_time_unit: UnitOptions;
    reschedule_denied_message: string;
    event_slug: string;
}

const unitOptions = [
    { value: 'minutes', label: __('Minutes', 'quillbooking') },
    { value: 'hours', label: __('Hours', 'quillbooking') },
    { value: 'days', label: __('Days', 'quillbooking') },
];

const EventAdvancedSettings: React.FC = () => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [showSlugField, setShowSlugField] = useState(false);
    const [settings, setSettings] = useState<AdvancedSettings | null>(null);
    const setBreadcrumbs = useBreadcrumbs();
    const [passingFields, setPassingFields] = useState<boolean>(false);

    const handleCheckboxChange = () => {
        setPassingFields(!passingFields); // Toggle passingFields state
    };

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/advanced_settings`,
            method: 'GET',
            onSuccess(response: AdvancedSettings) {
                setSettings(response);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    useEffect(() => {
        if (!event) {
            return;
        }

        fetchSettings();
        setBreadcrumbs([
            {
                path: `calendars/${event.calendar_id}/events/${event.id}/advanced`,
                title: __('Advanced Settings', 'quillbooking'),
            },
        ]);
    }, [event]);

    const handleChange = (key: keyof AdvancedSettings, value: any) => {
        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const saveSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                advanced_settings: settings,
            },
            onSuccess() {
                successNotice(__('Settings saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    if (!settings) {
        return <Skeleton active />;
    }

    return (
        <div className='grid grid-cols-2 gap-5 px-9'>
            <Card className='rounded-lg'>
                <Flex gap={10} className='items-center border-b pb-4'>
                    <div className='bg-[#EDEDED] text-[50px] rounded-lg p-2'>
                        <AdvancedSettingsIcon />
                    </div>
                    <Header header={__('Advanced Settings', 'quillbooking')}
                        subHeader={__(
                            'Customize the question asked on the booking page',
                            'quillbooking'
                        )} />
                </Flex>
                <Card className='rounded-lg mt-4'>
                    <Flex vertical>
                        <div className="text-[#09090B] text-[16px]">
                            {__("Booking Title", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        {/* static */}
                        <Input
                            placeholder={__("{event name} between {host name} and {{guest.first_name}}", "quillbooking")}
                            className="h-[48px] rounded-lg"
                            suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg'>
                                <UrlIcon />
                            </span>}
                            style={{ padding: "0 0 0 10px" }}
                        />
                    </Flex>
                    <Flex vertical className='mt-4'>
                        <div className="text-[#09090B] text-[16px]">
                            {__("Submit Button Text", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <Input
                            value={settings.submit_button_text}
                            onChange={(e) => handleChange('submit_button_text', e.target.value)}
                            size='large'
                            placeholder={__('Schedule Now', 'quillbooking')}
                            className='rounded-lg h-[48px]'
                        />
                    </Flex>
                </Card>
            </Card>
            <Card>
                <Flex vertical gap={20}>
                    <Card className='rounded-lg'>
                        <FieldWrapper
                            label={<span className="text-[#09090B] text-[20px]">
                                {__('Redirect After Booking', 'quillbooking')}
                            </span>}
                            description={<span className='text-[#71717A] text-[14px]'>
                                {__('Redirect user to a custom URL after a successful booking', 'quillbooking')}
                            </span>}
                            type="horizontal">
                            <Switch
                                checked={settings.redirect_after_submit}
                                onChange={(checked) => handleChange('redirect_after_submit', checked)}
                                className={settings.redirect_after_submit ? "bg-color-primary" : "bg-gray-400"}
                            />
                        </FieldWrapper>
                        {settings.redirect_after_submit && (
                            <>
                                <Divider />
                                <FieldWrapper label={<span className="text-[#09090B] font-semibold">
                                    {__('Redirect URL', 'quillbooking')}
                                </span>}>
                                    <Input
                                        value={settings.redirect_url}
                                        onChange={(e) => handleChange('redirect_url', e.target.value)}
                                        size='large'
                                        placeholder={__('https://example.com/redirect-to-my-success-page', 'quillbooking')}
                                        className='rounded-lg h-[48px]'
                                        suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg'>
                                            <UrlIcon />
                                        </span>}
                                        style={{ padding: "0 0 0 10px", marginBottom: "20px" }}
                                    />
                                </FieldWrapper>
                                <FieldWrapper label={<span className="text-[#09090B] font-semibold">
                                    {__('Redirect Query String', 'quillbooking')}
                                </span>}
                                    description={<span className='text-[#71717A] text-[14px] italic'>
                                        {__('Sample: email={{guest.email}}&phone={{booking.phone}}', 'quillbooking')}
                                    </span>}
                                >
                                    <Checkbox
                                        className="w-full transition-all duration-300 custom-check pb-2"
                                        checked={passingFields}
                                        onChange={handleCheckboxChange}
                                    >
                                        <div className="text-[#3F4254] text-[16px] font-semibold">
                                            {__("Pass field data via query string", "quillbooking")}
                                        </div>
                                    </Checkbox>
                                    <Input
                                        value={settings.redirect_url}
                                        onChange={(e) => handleChange('redirect_url', e.target.value)}
                                        size='large'
                                        placeholder={__('Redirect query string', 'quillbooking')}
                                        className='rounded-lg h-[48px]'
                                        suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg'>
                                            <UrlIcon />
                                        </span>}
                                        style={{ padding: "0 0 0 10px" }}
                                    />
                                </FieldWrapper>
                            </>
                        )}
                    </Card>
                    <Card className='rounded-lg'>
                        <FieldWrapper
                            label={<span className="text-[#09090B] text-[20px]">
                                {__('Attendee Cannot Cancel', 'quillbooking')}
                            </span>}
                            description={<span className='text-[#71717A] text-[14px]'>
                                {__('Please ensure the cancel link is included in the confirmation email.', 'quillbooking')}
                            </span>}
                            type="horizontal">
                            <Switch
                                checked={settings.attendee_cannot_cancel}
                                onChange={(checked) => handleChange('attendee_cannot_cancel', checked)}
                                className={settings.attendee_cannot_cancel ? "bg-color-primary" : "bg-gray-400"}
                            />
                        </FieldWrapper>
                        {settings.attendee_cannot_cancel && (
                            <>
                                <Divider />
                                <Flex gap={10} vertical>
                                    <FieldWrapper>
                                        <Radio.Group
                                            value={settings.cannot_cancel_time}
                                            onChange={(e) => handleChange('cannot_cancel_time', e.target.value)}
                                            className='mb-4'
                                        >
                                            <Radio
                                                value="event_start"
                                                className={`custom-radio text-[#09090B] p-4 mr-4 rounded-lg border ${settings.cannot_cancel_time === 'event_start' ? 'border border-color-primary bg-color-secondary' : ''}`}
                                            >
                                                {__('Always', 'quillbooking')}
                                            </Radio>
                                            <Radio
                                                value="less_than"
                                                className={`custom-radio text-[#09090B] p-4 rounded-lg border ${settings.cannot_cancel_time === 'less_than' ? 'border border-color-primary bg-color-secondary' : ''}`}
                                            >
                                                {__('When meeting starts in less than', 'quillbooking')}
                                            </Radio>
                                        </Radio.Group>
                                    </FieldWrapper>
                                    {settings.cannot_cancel_time === 'less_than' && (
                                        <FieldWrapper label={<span className="text-[#09090B] text-[16px] font-[500]">
                                            {__('Add Time', 'quillbooking')}
                                        </span>}>
                                        <Flex gap={15} className='w-full mb-4'>
                                            <InputNumber
                                                value={settings.cannot_cancel_time_value}
                                                onChange={(value) => handleChange('cannot_cancel_time_value', value)}
                                                size='large'
                                                className='rounded-lg h-[48px] w-full'
                                            />
                                            <Select
                                                value={settings.cannot_cancel_time_unit}
                                                options={unitOptions}
                                                onChange={(value) => handleChange('cannot_cancel_time_unit', value)}
                                                size='large'
                                                getPopupContainer={(trigger) => trigger.parentElement}
                                                className='rounded-lg h-[48px] w-full'
                                            />
                                            </Flex>
                                        </FieldWrapper>
                                    )}
                                    <FieldWrapper label={<span className="text-[#09090B] text-[16px] font-[500]">
                                        {__('Permission Denied Message', 'quillbooking')}
                                    </span>}
                                        description={<span className='text-[#71717A] text-[14px] italic'>
                                            {__('User will see this if they attempt to cancel without permission.', 'quillbooking')}
                                        </span>}
                                    >
                                        <Input
                                            value={settings.permission_denied_message}
                                            onChange={(e) => handleChange('permission_denied_message', e.target.value)}
                                            size='large'
                                            className='rounded-lg h-[48px]'
                                            placeholder='Sorry! you can not cancel this'
                                            suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg'>
                                                <UrlIcon />
                                            </span>}
                                            style={{ padding: "0 0 0 10px" }}
                                        />
                                    </FieldWrapper>
                                </Flex>
                            </>
                        )}
                    </Card>
                    <Card className='rounded-lg'>
                        <FieldWrapper
                            label={<span className="text-[#09090B] text-[20px]">
                                {__('Landing Page Settings', 'quillbooking')}
                            </span>}
                            description={<span className='text-[#71717A] text-[14px]'>
                                {__('Update the slug to customize your event landing page URL', 'quillbooking')}
                            </span>}
                            type="horizontal">
                            <div className='border border-[#EDEBEB] rounded-md cursor-pointer h-fit p-2' onClick={() => setShowSlugField(true)}>
                                <EditIcon />
                            </div>
                        </FieldWrapper>

                        {showSlugField && (
                            <div className='pt-4'>
                                <FieldWrapper label={<span className="text-[#09090B] text-[14px] font-semibold">
                                    {__('Slug', 'quillbooking')}
                                </span>}
                                    description={<span className='text-[#71717A] text-[14px]'>
                                        {__('Slug must be unique to avoid any conflicts with other events', 'quillbooking')}
                                    </span>}
                                >
                                    <Input
                                        value={settings.event_slug || event?.slug}
                                        onChange={(e) => handleChange('event_slug', e.target.value)}
                                        size='large'
                                        placeholder={__('event-slug', 'quillbooking')}
                                        className='rounded-lg h-[48px]'
                                    />
                                </FieldWrapper>
                            </div>
                        )}
                    </Card>
                </Flex>
            </Card >
        </div >
        // <Flex vertical gap={20} className="quillbooking-advanced-tab">
        //     <Title className="quillbooking-tab-title" level={4}>
        //         {__('Advanced Settings', 'quillbooking')}
        //     </Title>
        //     <Card>
        //         <FieldWrapper label={__('Submit Button Text', 'quillbooking')}>
        //             <Input
        //                 value={settings.submit_button_text}
        //                 onChange={(e) => handleChange('submit_button_text', e.target.value)}
        //                 size='large'
        //                 placeholder={__('Schedule Now', 'quillbooking')}
        //             />
        //         </FieldWrapper>
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Redirect After Submit', 'quillbooking')} type="horizontal" description={__('Redirect user to a custom URL after submitting the booking form.', 'quillbooking')}>
        //             <Switch
        //                 checked={settings.redirect_after_submit}
        //                 onChange={(checked) => handleChange('redirect_after_submit', checked)}
        //             />
        //         </FieldWrapper>
        //         {settings.redirect_after_submit && (
        //             <>
        //                 <Divider />
        //                 <FieldWrapper label={__('Redirect URL', 'quillbooking')}>
        //                     <Input
        //                         value={settings.redirect_url}
        //                         onChange={(e) => handleChange('redirect_url', e.target.value)}
        //                         size='large'
        //                         placeholder={__('https://example.com', 'quillbooking')}
        //                     />
        //                 </FieldWrapper>
        //             </>
        //         )}
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Require Confirmation', 'quillbooking')} type="horizontal" description={__('Require confirmation from the user before booking.', 'quillbooking')}>
        //             <Switch
        //                 checked={settings.require_confirmation}
        //                 onChange={(checked) => handleChange('require_confirmation', checked)}
        //             />
        //         </FieldWrapper>
        //         {settings.require_confirmation && (
        //             <>
        //                 <Divider />
        //                 <Flex gap={10} vertical>
        //                     <FieldWrapper>
        //                         <Radio.Group
        //                             value={settings.confirmation_time}
        //                             onChange={(e) => handleChange('confirmation_time', e.target.value)}
        //                         >
        //                             <Radio value="always">{__('Always', 'quillbooking')}</Radio>
        //                             <Flex gap={10} align="center">
        //                                 <Radio value="less_than">
        //                                     {__('When booking notice is less than', 'quillbooking')}
        //                                 </Radio>
        //                                 <InputNumber
        //                                     value={settings.confirmation_time_value}
        //                                     onChange={(value) => handleChange('confirmation_time_value', value)}
        //                                     size='large'
        //                                 />
        //                                 <Select
        //                                     value={settings.confirmation_time_unit}
        //                                     options={unitOptions}
        //                                     onChange={(value) => handleChange('confirmation_time_unit', value)}
        //                                     size='large'
        //                                 />
        //                             </Flex>
        //                         </Radio.Group>
        //                     </FieldWrapper>
        //                 </Flex>
        //             </>
        //         )}
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Allow Multiple Bookings', 'quillbooking')} type="horizontal" description={__('Allow users to book multiple slots.', 'quillbooking')}>
        //             <Switch
        //                 checked={settings.allow_multiple_bookings}
        //                 onChange={(checked) => handleChange('allow_multiple_bookings', checked)}
        //             />
        //         </FieldWrapper>
        //         {settings.allow_multiple_bookings && (
        //             <>
        //                 <Divider />
        //                 <FieldWrapper label={__('Maximum Bookings', 'quillbooking')} description={__('Set the maximum number of bookings allowed in a single transaction.', 'quillbooking')}>
        //                     <InputNumber
        //                         value={settings.maximum_bookings}
        //                         onChange={(value) => handleChange('maximum_bookings', value)}
        //                         size='large'
        //                         style={{ width: '100%' }}
        //                     />
        //                 </FieldWrapper>
        //             </>
        //         )}
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Attendee Cannot Cancel', 'quillbooking')} type="horizontal" description={__('Prevent attendees from canceling their bookings.', 'quillbooking')}>
        //             <Switch
        //                 checked={settings.attendee_cannot_cancel}
        //                 onChange={(checked) => handleChange('attendee_cannot_cancel', checked)}
        //             />
        //         </FieldWrapper>
        //         {settings.attendee_cannot_cancel && (
        //             <>
        //                 <Divider />
        //                 <Flex gap={10} vertical>
        //                 <FieldWrapper label={__('Cannot Cancel Time', 'quillbooking')}>
        //                     <Radio.Group
        //                         value={settings.cannot_cancel_time}
        //                         onChange={(e) => handleChange('cannot_cancel_time', e.target.value)}
        //                     >
        //                         <Radio value="event_start">{__('Always', 'quillbooking')}</Radio>
        //                         <Flex gap={10} align="center">
        //                             <Radio value="less_than">
        //                                 {__('When meeting starts in less than', 'quillbooking')}
        //                             </Radio>
        //                             <InputNumber
        //                                 value={settings.cannot_cancel_time_value}
        //                                 onChange={(value) => handleChange('cannot_cancel_time_value', value)}
        //                                 size='large'
        //                             />
        //                             <Select
        //                                 value={settings.cannot_cancel_time_unit}
        //                                 options={unitOptions}
        //                                 onChange={(value) => handleChange('cannot_cancel_time_unit', value)}
        //                                 size='large'
        //                             />
        //                         </Flex>
        //                     </Radio.Group>
        //                 </FieldWrapper>
        //                 <FieldWrapper label={__('Permission Denied Message', 'quillbooking')}>
        //                     <Input
        //                         value={settings.permission_denied_message}
        //                         onChange={(e) => handleChange('permission_denied_message', e.target.value)}
        //                         size='large'
        //                     />
        //                 </FieldWrapper>
        //                 </Flex>
        //             </>
        //         )}
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Attendee Cannot Reschedule', 'quillbooking')} type="horizontal" description={__('Prevent attendees from rescheduling their bookings.', 'quillbooking')}>
        //             <Switch
        //                 checked={settings.attendee_cannot_reschedule}
        //                 onChange={(checked) => handleChange('attendee_cannot_reschedule', checked)}
        //             />
        //         </FieldWrapper>
        //         {settings.attendee_cannot_reschedule && (
        //             <>
        //                 <Divider />
        //                 <Flex gap={10} vertical>
        //                     <FieldWrapper label={__('Cannot Reschedule Time', 'quillbooking')}>
        //                         <Radio.Group
        //                             value={settings.cannot_reschedule_time}
        //                             onChange={(e) => handleChange('cannot_reschedule_time', e.target.value)}
        //                         >
        //                             <Radio value="event_start">{__('Always', 'quillbooking')}</Radio>
        //                             <Flex gap={10} align="center">
        //                                 <Radio value="less_than">
        //                                     {__('When meeting starts in less than', 'quillbooking')}
        //                                 </Radio>
        //                                 <InputNumber
        //                                     value={settings.cannot_reschedule_time_value}
        //                                     onChange={(value) => handleChange('cannot_reschedule_time_value', value)}
        //                                     size='large'
        //                                 />
        //                                 <Select
        //                                     value={settings.cannot_reschedule_time_unit}
        //                                     options={unitOptions}
        //                                     onChange={(value) => handleChange('cannot_reschedule_time_unit', value)}
        //                                     size='large'
        //                                 />
        //                             </Flex>
        //                         </Radio.Group>
        //                     </FieldWrapper>
        //                     <FieldWrapper label={__('Reschedule Denied Message', 'quillbooking')}>
        //                         <Input
        //                             value={settings.reschedule_denied_message}
        //                             onChange={(e) => handleChange('reschedule_denied_message', e.target.value)}
        //                             size='large'
        //                         />
        //                     </FieldWrapper>
        //                 </Flex>
        //             </>
        //         )}
        //     </Card>
        //     <Card>
        //         <FieldWrapper label={__('Event Slug', 'quillbooking')} description={__('The slug used in the event URL.', 'quillbooking')}>
        //             <Input
        //                 value={settings.event_slug || event?.slug}
        //                 onChange={(e) => handleChange('event_slug', e.target.value)}
        //                 size='large'
        //                 placeholder={__('event-slug', 'quillbooking')}
        //             />
        //         </FieldWrapper>
        //     </Card>
        //     <Button type="primary" onClick={saveSettings} loading={loading}>
        //         {__('Save Settings', 'quillbooking')}
        //     </Button>
        // </Flex>
    );
};

export default EventAdvancedSettings;
/**
 * WordPress dependencies
 */
import { useEffect, useState, forwardRef, useImperativeHandle } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Switch, Select, Input, InputNumber, Radio, Skeleton, Divider, Checkbox, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import { AdvancedSettingsIcon, EditIcon, FieldWrapper, Header, UrlIcon, MergeTagModal, CardHeader } from '@quillbooking/components';

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
    event_title:string;
    redirect_query_string:string;
}

interface EventAdvancedSettingsProps {
    disabled: boolean;
    setDisabled: (disabled: boolean) => void;
}

interface EventAdvancedSettingsHandle {
    saveSettings: () => Promise<void>;
}

const unitOptions = [
    { value: 'minutes', label: __('Minutes', 'quillbooking') },
    { value: 'hours', label: __('Hours', 'quillbooking') },
    { value: 'days', label: __('Days', 'quillbooking') },
];

const EventAdvancedSettings = forwardRef<EventAdvancedSettingsHandle, EventAdvancedSettingsProps>((props, ref) => {
    const { state: event } = useEventContext();
    const [slug, setSlug] = useState<string>(event?.slug || '');
    const [activeModalType, setActiveModalType] = useState<null | 'bookingTitle' | 'redirectUrl' | 'queryString' | 'permissionDenied'>(null);
    const { callApi, loading } = useApi();
    const { callApi: saveApi } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [showSlugField, setShowSlugField] = useState(false);
    const [settings, setSettings] = useState<AdvancedSettings | null>(null);
    const [initialSettings, setInitialSettings] = useState<AdvancedSettings | null>(null);
    const [initialSlug, setInitialSlug] = useState<string>('');
    const setBreadcrumbs = useBreadcrumbs();
    const [passingFields, setPassingFields] = useState<boolean>(false);

    console.log(initialSettings);

    // Expose saveSettings method to parent component
    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (settings) {
                return saveSettings();
            }
            return Promise.resolve();
        },
    }));

    const handleCheckboxChange = () => {
        setPassingFields(!passingFields);
        checkForChanges();
    };


    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/advanced_settings`,
            method: 'GET',
            onSuccess(response: AdvancedSettings) {
                setSettings(response);
                setInitialSettings(JSON.parse(JSON.stringify(response))); // Deep copy to track changes
                setInitialSlug(event.slug || '');
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

    const checkForChanges = () => {
        if (!settings || !initialSettings) return;

        const hasSettingsChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        const hasSlugChanged = slug !== initialSlug;

        if (hasSettingsChanged || hasSlugChanged) {
            props.setDisabled(false);
        } else {
            props.setDisabled(true);
        }
    };

    const handleChange = (key: keyof AdvancedSettings, value: any) => {
        setSettings((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: value };
        });

        checkForChanges();
    };

    const handleBookingTitleClick = (mention: string) => {
        setSettings((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                event_title: prev.event_title + mention,
            };
        });
        setActiveModalType(null);
        checkForChanges();
    };

    const handlePermissionDeniedClick = (mention: string) => {
        setSettings((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                permission_denied_message: prev.permission_denied_message + mention,
            };
        });
        setActiveModalType(null);
        checkForChanges();
    };

    const handleQueryStringClick = (mention: string) => {
        setSettings((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                redirect_query_string: prev.redirect_query_string + mention,
            };
        });
        setActiveModalType(null);
        checkForChanges();
    };

    const handleRedirectUrlClick = (mention: string) => {
        setSettings((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                redirect_url: prev.redirect_url + mention,
            };
        });
        setActiveModalType(null);
        checkForChanges();
    };

    const handleSlugChange = (value: string) => {
        setSlug(value);
        checkForChanges();
    };

    const saveSettings = async () => {
        if (!event) return;
        return saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                advanced_settings: settings,
                slug: slug,
            },
            onSuccess() {
                successNotice(__('Settings saved successfully', 'quillbooking'));
                // Update initial state to reflect saved state
                setInitialSettings(JSON.parse(JSON.stringify(settings)));
                setInitialSlug(slug);
                props.setDisabled(true);
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
                <CardHeader title={__('Advanced Settings', 'quillbooking')}
                    description={__(
                        'Customize the question asked on the booking page',
                        'quillbooking'
                    )}
                    icon={<AdvancedSettingsIcon />} />
                <Card className='rounded-lg mt-4'>
                    <Flex vertical>
                        <div className="text-[#09090B] text-[16px]">
                            {__("Booking Title", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <Input
                            value={settings.event_title}
                            placeholder={__("{event name} between {host name} and {{guest.first_name}}", "quillbooking")}
                            className="h-[48px] rounded-lg"
                            onChange={(e) => handleChange('event_title', e.target.value)}
                            suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg' onClick={() => setActiveModalType('bookingTitle')}>
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
                                        suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg' onClick={() => setActiveModalType('redirectUrl')}>
                                            <UrlIcon />
                                        </span>}
                                        style={{ padding: "0 0 0 10px", marginBottom: "20px" }}
                                    />
                                </FieldWrapper>
                                <FieldWrapper label={<span className="text-[#09090B] font-semibold">
                                    {__('Redirect Query String', 'quillbooking')}
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
                                    {passingFields && (
                                        <>
                                            <Input
                                                value={settings.redirect_query_string}
                                                onChange={(e) => handleChange('redirect_query_string', e.target.value)}
                                                size='large'
                                                placeholder={__('Redirect query string', 'quillbooking')}
                                                className='rounded-lg h-[48px]'
                                                suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg' onClick={() => setActiveModalType('queryString')}>
                                                    <UrlIcon />
                                                </span>}
                                                style={{ padding: "0 0 0 10px" }}
                                            />
                                            <span className='text-[#71717A] text-[14px] italic'>
                                                {__('Sample: email={{guest.email}}&phone={{booking.phone}}', 'quillbooking')}
                                            </span>
                                        </>
                                    )}
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
                                            suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg' onClick={() => setActiveModalType('permissionDenied')}>
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
                                        value={slug}
                                        onChange={(e) => handleSlugChange(e.target.value)}
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
            <Modal
                open={activeModalType !== null}
                onCancel={() => setActiveModalType(null)}
                footer={null}
                width={1000}
                getContainer={false}
            >
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-3 mt-2'>
                        <UrlIcon />
                    </div>
                    <Header
                        header={
                            activeModalType === 'bookingTitle' ? __('Booking Title Merge tags', 'quillbooking') :
                                activeModalType === 'redirectUrl' ? __('Redirect URL', 'quillbooking') :
                                    activeModalType === 'queryString' ? __('Redirect Query String', 'quillbooking') :
                                        __('Permission Denied Message', 'quillbooking')
                        }
                        subHeader={__(
                            'Choose your Merge tags type and Select one of them related to your input.',
                            'quillbooking'
                        )}
                    />
                </Flex>
                <MergeTagModal
                    onMentionClick={
                        activeModalType === 'bookingTitle' ? handleBookingTitleClick :
                            activeModalType === 'redirectUrl' ? handleRedirectUrlClick :
                                activeModalType === 'queryString' ? handleQueryStringClick :
                                    handlePermissionDeniedClick
                    }
                />
            </Modal>
        </div >
    );
});

export default EventAdvancedSettings;
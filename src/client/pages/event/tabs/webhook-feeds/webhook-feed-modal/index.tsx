/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { Input, Select, Checkbox, Radio, Button, Card, Flex } from 'antd';

/**
 * Internal dependencies
 */
import { FlashIcon, TrashIcon } from '@quillbooking/components';

const { Option } = Select;

export type WebhookFeedType = {
    name: string;
    url: string;
    method: string;
    format: string;
    hasHeaders: boolean;
    headers: { header: string; value: string }[];
    hasBodyFields: boolean;
    bodyFields: { field: string; value: string }[];
    triggers: string[];
    enabled: boolean;
};

type WebhookFeedComponentProps = {
    onSave: (values: WebhookFeedType) => void;
    webhookFeed?: WebhookFeedType | null;
};

const WebhookFeedComponent: React.FC<WebhookFeedComponentProps> = ({ onSave, webhookFeed }) => {
    const initialState: WebhookFeedType = {
        name: '',
        url: '',
        method: 'POST',
        format: 'json',
        hasHeaders: false,
        headers: [],
        hasBodyFields: false,
        bodyFields: [],
        triggers: [],
        enabled: true,
    };

    const [formState, setFormState] = useState<WebhookFeedType>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Update form state when webhookFeed prop changes
    useEffect(() => {
        if (webhookFeed) {
            setFormState(webhookFeed);
        } else {
            // Reset to initial state when webhookFeed is null (adding new)
            setFormState(initialState);
        }
    }, [webhookFeed]);

    const handleInputChange = (field: keyof WebhookFeedType, value: any) => {
        setFormState((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when field is updated
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleHeaderChange = (index: number, field: 'header' | 'value', value: string) => {
        const newHeaders = [...formState.headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };

        setFormState((prev) => ({
            ...prev,
            headers: newHeaders,
        }));
    };

    const addHeader = () => {
        setFormState((prev) => ({
            ...prev,
            headers: [...prev.headers, { header: '', value: '' }],
        }));
    };

    const removeHeader = (index: number) => {
        const newHeaders = [...formState.headers];
        newHeaders.splice(index, 1);

        setFormState((prev) => ({
            ...prev,
            headers: newHeaders,
        }));
    };

    const handleBodyFieldChange = (index: number, field: 'field' | 'value', value: string) => {
        const newBodyFields = [...formState.bodyFields];
        newBodyFields[index] = { ...newBodyFields[index], [field]: value };

        setFormState((prev) => ({
            ...prev,
            bodyFields: newBodyFields,
        }));
    };

    const addBodyField = () => {
        setFormState((prev) => ({
            ...prev,
            bodyFields: [...prev.bodyFields, { field: '', value: '' }],
        }));
    };

    const removeBodyField = (index: number) => {
        const newBodyFields = [...formState.bodyFields];
        newBodyFields.splice(index, 1);

        setFormState((prev) => ({
            ...prev,
            bodyFields: newBodyFields,
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Validate required fields
        if (!formState.name) {
            newErrors.name = __('Please enter a name', 'quillbooking');
        }

        if (!formState.url) {
            newErrors.url = __('Please enter a URL', 'quillbooking');
        } else if (!/^https?:\/\/\S+$/.test(formState.url)) {
            newErrors.url = __('Please enter a valid URL', 'quillbooking');
        }

        if (!formState.method) {
            newErrors.method = __('Please select a request method', 'quillbooking');
        }

        if (!formState.format) {
            newErrors.format = __('Please select a request format', 'quillbooking');
        }

        if (formState.triggers.length === 0) {
            newErrors.triggers = __('Please select at least one trigger', 'quillbooking');
        }

        // Validate headers if hasHeaders is true
        if (formState.hasHeaders) {
            formState.headers.forEach((header, index) => {
                if (!header.header) {
                    newErrors[`header-${index}-name`] = __('Missing header name', 'quillbooking');
                }
                if (!header.value) {
                    newErrors[`header-${index}-value`] = __('Missing header value', 'quillbooking');
                }
            });
        }

        // Validate body fields if hasBodyFields is true
        if (formState.hasBodyFields) {
            formState.bodyFields.forEach((field, index) => {
                if (!field.field) {
                    newErrors[`field-${index}-name`] = __('Missing field name', 'quillbooking');
                }
                if (!field.value) {
                    newErrors[`field-${index}-value`] = __('Missing field value', 'quillbooking');
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave(formState);
            // Reset form only if it's not in edit mode (when webhookFeed is null)
            if (!webhookFeed) {
                setFormState(initialState);
                setErrors({});
            }
        }
    };

    return (
        <>
            <Card className='mt-5'>
                <Flex vertical gap={2}>
                    <label className="text-[#09090B] text-[16px] font-semibold">
                        {__('Name', 'quillbooking')}
                        <span className="text-red-500">*</span>
                    </label>
                    <Input
                        className='h-[48px] rounded-lg'
                        value={formState.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        status={errors.name ? 'error' : ''}
                    />
                    {errors.name && <div className="text-red-500 mt-1">{errors.name}</div>}
                </Flex>

                <Flex vertical gap={2} className="mt-7">
                    <label className=" text-[#09090B] text-[16px] font-semibold">
                        {__('Request URL', 'quillbooking')}
                        <span className="text-red-500">*</span>
                    </label>
                    <Input
                        className='h-[48px] rounded-lg'
                        value={formState.url}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        status={errors.url ? 'error' : ''}
                    />
                    {errors.url && <div className="text-red-500 mt-1">{errors.url}</div>}
                </Flex>

                <Flex vertical gap={2} className="mt-7">
                    <label className="text-[#09090B] text-[16px] font-semibold">
                        {__('Request Header', 'quillbooking')}
                    </label>
                    <Radio.Group
                        value={formState.hasHeaders}
                        onChange={(e) => {
                            handleInputChange('hasHeaders', e.target.value);
                            // When selecting "Selected Fields", add one empty field if none exists
                            if (e.target.value === true && formState.headers.length === 0) {
                                addHeader();
                            }
                        }}
                    >
                        <Radio
                            value={false}
                            className={`custom-radio text-[#3F4254] font-semibold p-4 mr-4 rounded-lg border ${formState.hasHeaders === false ? 'border border-color-primary bg-color-secondary' : ''}`}
                        >
                            {__('No Headers', 'quillbooking')}
                        </Radio>
                        <Radio
                            value={true}
                            className={`custom-radio text-[#3F4254] font-semibold p-4 mr-4 rounded-lg border ${formState.hasHeaders === true ? 'border border-color-primary bg-color-secondary' : ''}`}
                        >
                            {__('With Headers', 'quillbooking')}
                        </Radio>
                    </Radio.Group>
                </Flex>

                {formState.hasHeaders && (
                    <Flex vertical justify='center' gap={10} className="mt-7">
                        {formState.headers.map((header, index) => (
                            <Flex gap={10} key={index} align="flex-end" className="w-full">
                                <Flex vertical className='w-full'>
                                    <label className="text-[#09090B] text-[16px] font-semibold">
                                        {__('Header Name', 'quillbooking')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder={__('Header', 'quillbooking')}
                                        value={header.header}
                                        className='rounded-lg h-[48px]'
                                        onChange={(e) => handleHeaderChange(index, 'header', e.target.value)}
                                        status={errors[`header-${index}-name`] ? 'error' : ''}
                                    />
                                    {errors[`header-${index}-name`] && (
                                        <div className="text-red-500 mt-1">{errors[`header-${index}-name`]}</div>
                                    )}
                                </Flex>
                                <Flex vertical className='w-full'>
                                    <label className="text-[#09090B] text-[16px] font-semibold">
                                        {__('Header Value', 'quillbooking')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder={__('Value', 'quillbooking')}
                                        value={header.value}
                                        className='rounded-lg h-[48px]'
                                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                        status={errors[`header-${index}-value`] ? 'error' : ''}
                                    />
                                    {errors[`header-${index}-value`] && (
                                        <div className="text-red-500 mt-1">{errors[`header-${index}-value`]}</div>
                                    )}
                                </Flex>
                                {formState.headers.length > 1 && ( // Only show remove if more than one field
                                    <Button
                                        onClick={() => removeHeader(index)}
                                        className='border border-[#EDEBEB] rounded-md shadow-none h-[48px] text-[#B3261E]'
                                    >
                                        <TrashIcon width={20} height={20} />
                                    </Button>
                                )}
                            </Flex>
                        ))}
                        <Button
                            onClick={addHeader}
                            className="mt-2 text-color-primary font-semibold text-[16px] border-none shadow-none w-fit"
                        >
                            {__('+ Add Other Request', 'quillbooking')}
                        </Button>
                    </Flex>
                )}

                <Flex align='center' gap={28} className='w-full mt-7'>
                    <Flex gap={2} vertical className="w-1/2">
                        <label className="text-[#09090B] text-[16px] font-semibold">
                            {__('Request Method', 'quillbooking')}
                            <span className="text-red-500">*</span>
                        </label>
                        <Select
                            className='h-[48px] rounded-lg w-full'
                            value={formState.method}
                            onChange={(value) => handleInputChange('method', value)}
                            status={errors.method ? 'error' : ''}
                            getPopupContainer={(trigger) => trigger.parentElement}
                        >
                            <Option value="GET">GET</Option>
                            <Option value="POST">POST</Option>
                            <Option value="PUT">PUT</Option>
                            <Option value="DELETE">DELETE</Option>
                        </Select>
                        {errors.method && <div className="text-red-500 mt-1">{errors.method}</div>}
                    </Flex>
                    <Flex gap={2} vertical className="w-1/2">
                        <label className="text-[#09090B] text-[16px] font-semibold">
                            {__('Request Format', 'quillbooking')}
                        </label>
                        <Select
                            className='h-[48px] rounded-lg w-full'
                            value={formState.format}
                            onChange={(value) => handleInputChange('format', value)}
                            status={errors.format ? 'error' : ''}
                            getPopupContainer={(trigger) => trigger.parentElement}
                        >
                            <Option value="json">JSON</Option>
                            <Option value="form">Form</Option>
                        </Select>
                        {errors.format && <div className="text-red-500 mt-1">{errors.format}</div>}
                    </Flex>
                </Flex>

                <Flex vertical gap={2} className="mt-7">
                    <label className="text-[#09090B] text-[16px] font-semibold">
                        {__('Request Body', 'quillbooking')}
                        <span className="text-red-500">*</span>
                    </label>
                    <Radio.Group
                        value={formState.hasBodyFields}
                        onChange={(e) => {
                            handleInputChange('hasBodyFields', e.target.value);
                            // When selecting "Selected Fields", add one empty field if none exists
                            if (e.target.value === true && formState.bodyFields.length === 0) {
                                addBodyField();
                            }
                        }}
                    >
                        <Radio
                            value={false}
                            className={`custom-radio text-[#3F4254] font-semibold p-4 mr-4 rounded-lg border ${formState.hasBodyFields === false ? 'border border-color-primary bg-color-secondary' : ''}`}
                        >
                            {__('All Data', 'quillbooking')}
                        </Radio>
                        <Radio
                            value={true}
                            className={`custom-radio text-[#3F4254] font-semibold p-4 mr-4 rounded-lg border ${formState.hasBodyFields === true ? 'border border-color-primary bg-color-secondary' : ''}`}
                        >
                            {__('Selected Fields', 'quillbooking')}
                        </Radio>
                    </Radio.Group>
                </Flex>

                {formState.hasBodyFields && (
                    <Flex vertical justify='center' gap={10} className="mt-7">
                        {formState.bodyFields.map((field, index) => (
                            <Flex gap={10} key={index} align="flex-end" className="w-full">
                                <Flex vertical className='w-full'>
                                    <label className="text-[#09090B] text-[16px] font-semibold">
                                        {__('Field Name', 'quillbooking')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder={__('Field', 'quillbooking')}
                                        value={field.field}
                                        onChange={(e) => handleBodyFieldChange(index, 'field', e.target.value)}
                                        className='rounded-lg h-[48px]'
                                        status={errors[`field-${index}-name`] ? 'error' : ''}
                                    />
                                    {errors[`field-${index}-name`] && (
                                        <div className="text-red-500 mt-1">{errors[`field-${index}-name`]}</div>
                                    )}
                                </Flex>
                                <Flex vertical className='w-full'>
                                    <label className="text-[#09090B] text-[16px] font-semibold">
                                        {__('Field Value', 'quillbooking')}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder={__('Value', 'quillbooking')}
                                        value={field.value}
                                        className='rounded-lg h-[48px]'
                                        onChange={(e) => handleBodyFieldChange(index, 'value', e.target.value)}
                                        status={errors[`field-${index}-value`] ? 'error' : ''}
                                    />
                                    {errors[`field-${index}-value`] && (
                                        <div className="text-red-500 mt-1">{errors[`field-${index}-value`]}</div>
                                    )}
                                </Flex>
                                {formState.bodyFields.length > 1 && ( // Only show remove if more than one field
                                    <Button
                                        onClick={() => removeBodyField(index)}
                                        className='border border-[#EDEBEB] rounded-md shadow-none h-[48px] text-[#B3261E]'
                                    >
                                        <TrashIcon width={20} height={20} />
                                    </Button>
                                )}
                            </Flex>
                        ))}
                        <Button
                            onClick={addBodyField}
                            className="mt-2 text-color-primary font-semibold text-[16px] border-none shadow-none w-fit"
                        >
                            {__('+ Add Other Request', 'quillbooking')}
                        </Button>
                    </Flex>
                )}

                <Flex gap={2} vertical className="border-t pt-4 mt-4">
                    <Flex gap={5} align='flex-start' className="text-[#09090B] text-[16px] font-semibold border-b pb-4 mb-4">
                        <div className='text-[#09090B]'><FlashIcon /></div>
                        <Flex vertical gap={8}>
                            <div>{__('Event Triggers', 'quillbooking')}</div>
                            <div className='text-[12px] text-[#71717A] font-medium'>{__('Select in which booking stage you want to trigger this feed', 'quillbooking')}</div>
                        </Flex>

                    </Flex>
                    <Checkbox.Group
                        value={formState.triggers}
                        onChange={(checkedValues) => handleInputChange('triggers', checkedValues)}
                        className='text-[#3F4254] font-semibold mb-4'
                    >
                        <Checkbox value="Booking Confirmed" className='custom-check'>{__('Booking Confirmed', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Canceled" className='custom-check'>{__('Booking Canceled', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Completed" className='custom-check'>{__('Booking Completed', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Rescheduled" className='custom-check'>{__('Booking Rescheduled', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Rejected" className='custom-check'>{__('Booking Rejected', 'quillbooking')}</Checkbox>
                    </Checkbox.Group>
                    {errors.triggers && <div className="text-red-500 mt-1">{errors.triggers}</div>}
                </Flex>


            </Card>
            <Flex justify="end">
                <Button type="primary" onClick={handleSave} className='mt-6'>
                    {webhookFeed ? __('Update Webhook', 'quillbooking') : __('Submit Webhook', 'quillbooking')}
                </Button>
            </Flex>
        </>
    );
};

export default WebhookFeedComponent;
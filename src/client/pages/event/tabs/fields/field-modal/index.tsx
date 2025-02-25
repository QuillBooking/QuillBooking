/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Button, Space } from 'antd';

/**
 * Internal dependencies
 */
import { FieldType } from '../index';

const DEFAULT_FIELD: FieldType = {
    label: '',
    type: 'text',
    required: false,
    group: 'custom',
    event_location: '',
    placeholder: '',
    order: 0,
};

const FieldModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    onSave: (values: any) => void;
    field?: FieldType;
    isEdit: boolean;
    loading: boolean;
}> = ({ visible, onCancel, onSave, field, isEdit, loading }) => {
    const [form] = Form.useForm();

    if (!field) {
        field = DEFAULT_FIELD;
    }

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            onSave({ ...field, ...values });
        });
    };

    return (
        <Modal
            title={isEdit ? __('Edit Field', 'quillbooking') : __('Add Field', 'quillbooking')}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    {__('Cancel', 'quillbooking')}
                </Button>,
                <Button key="save" type="primary" onClick={handleSubmit} loading={loading}>
                    {__('Save', 'quillbooking')}
                </Button>,
            ]}
            forceRender
        >
            <Form form={form} layout="vertical" initialValues={field}>
                <Form.Item name="type" label={__('Field Type', 'quillbooking')} rules={[{ required: true, message: __('Field type is required', 'quillbooking') }]}>
                    <Select
                        options={[
                            { value: 'text', label: __('Text', 'quillbooking') },
                            { value: 'textarea', label: __('Textarea', 'quillbooking') },
                            { value: 'checkbox', label: __('Checkbox', 'quillbooking') },
                            { value: 'select', label: __('Select', 'quillbooking') },
                            { value: 'radio', label: __('Radio', 'quillbooking') },
                            { value: 'date', label: __('Date', 'quillbooking') },
                            { value: 'time', label: __('Time', 'quillbooking') },
                            { value: 'datetime', label: __('Datetime', 'quillbooking') },
                            { value: 'number', label: __('Number', 'quillbooking') },
                            { value: 'multiple_select', label: __('Multiple Select', 'quillbooking') },
                            { value: 'file', label: __('File', 'quillbooking') },
                            { value: 'hidden', label: __('Hidden', 'quillbooking') },
                            { value: 'checkbox_group', label: __('Checkbox Group', 'quillbooking') },
                            { value: 'terms', label: __('Terms', 'quillbooking') },
                        ]}
                        disabled={field.group === 'system' || field.group === 'location'}
                    />
                </Form.Item>
                <Form.Item name="label" label={__('Label', 'quillbooking')} rules={[{ required: true, message: __('Label is required', 'quillbooking') }]}>
                    <Input placeholder={__('Enter field label', 'quillbooking')} />
                </Form.Item>
                <Form.Item name="placeholder" label={__('Placeholder', 'quillbooking')}>
                    <Input placeholder={__('Enter field placeholder', 'quillbooking')} />
                </Form.Item>
                <Form.Item name="helpText" label={__('Help Text', 'quillbooking')}>
                    <Input placeholder={__('Enter help text', 'quillbooking')} />
                </Form.Item>
                <Form.Item shouldUpdate>
                    {({ getFieldValue }) => {
                        if (field.group === 'system' || field.group === 'location') {
                            return null;
                        }

                        const type = getFieldValue('type');
                        return (
                            <>
                                {type === 'select' || type === 'multiple_select' || type === 'radio' || type === 'checkbox' || type === 'checkbox_group' ? (
                                    <Form.List name={['settings', 'options']} initialValue={!field.settings?.options ? ['Option 1', 'Option 2'] : undefined}>
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="end">
                                                        <Form.Item {...restField} name={name} rules={[{ required: true, message: __('Option is required', 'quillbooking') }]} style={{ marginBottom: 0 }}>
                                                            <Input placeholder={__('Enter option value', 'quillbooking')} />
                                                        </Form.Item>
                                                        <Button onClick={() => remove(name)} danger>
                                                            {__('Remove', 'quillbooking')}
                                                        </Button>
                                                    </Space>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block>
                                                        {__('Add Option', 'quillbooking')}
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                ) : null}
                                {type === 'number' ? (
                                    <>
                                        <Form.Item name={['settings', 'min']} label={__('Min Value', 'quillbooking')} rules={[{ required: true, message: __('Min value is required', 'quillbooking') }]}>
                                            <InputNumber placeholder={__('Enter minimum value', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'max']} label={__('Max Value', 'quillbooking')} rules={[{ required: true, message: __('Max value is required', 'quillbooking') }]}>
                                            <InputNumber placeholder={__('Enter maximum value', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'format']} label={__('Format', 'quillbooking')}>
                                            <Input placeholder={__('Enter format', 'quillbooking')} />
                                        </Form.Item>
                                    </>
                                ) : null}
                                {type === 'date' || type === 'datetime' ? (
                                    <>
                                        <Form.Item name={['settings', 'min']} label={__('Min Date', 'quillbooking')} rules={[{ required: true, message: __('Min date is required', 'quillbooking') }]}>
                                            <DatePicker placeholder={__('Select minimum date', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'max']} label={__('Max Date', 'quillbooking')} rules={[{ required: true, message: __('Max date is required', 'quillbooking') }]}>
                                            <DatePicker placeholder={__('Select maximum date', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'format']} label={__('Format', 'quillbooking')}>
                                            <Input placeholder={__('Enter format', 'quillbooking')} />
                                        </Form.Item>
                                    </>
                                ) : null}
                                {type === 'file' ? (
                                    <>
                                        <Form.Item name={['settings', 'maxFileSize']} label={__('Max File Size (MB)', 'quillbooking')} rules={[{ required: true, message: __('Max file size is required', 'quillbooking') }]}>
                                            <InputNumber placeholder={__('Enter maximum file size', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'maxFileCount']} label={__('Max File Count', 'quillbooking')} rules={[{ required: true, message: __('Max file count is required', 'quillbooking') }]}>
                                            <InputNumber placeholder={__('Enter maximum file count', 'quillbooking')} />
                                        </Form.Item>
                                        <Form.Item name={['settings', 'allowedFiles']} label={__('Allowed File Types', 'quillbooking')}>
                                            <Input placeholder={__('Enter allowed file types', 'quillbooking')} />
                                        </Form.Item>
                                    </>
                                ) : null}
                                <Form.Item name="required" label={__('Required', 'quillbooking')} valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </>
                        );
                    }}
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default FieldModal;
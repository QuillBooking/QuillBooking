/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Typography, List, Skeleton, Flex, Popconfirm } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import slugify from 'slugify';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import FieldModal from './field-modal';
import './style.scss';

const { Title } = Typography;

export type FieldType = {
    label: string;
    type: string;
    required: boolean;
    group: string;
    event_location: string;
    placeholder: string;
    order: number;
    settings?: {
        options?: string[];
        min?: string;
        max?: string;
        format?: string;
        maxFileSize?: number;
        maxFileCount?: number;
        allowedFiles?: string[];
    };
};

type FieldsGroup = {
    [key: string]: FieldType;
};

type Fields = {
    system: FieldsGroup;
    location: FieldsGroup;
    custom: FieldsGroup;
};

const EventFieldsTab: React.FC = () => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { callApi: saveApi, loading: saveLoading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [fields, setFields] = useState<Fields | null>(null);
    const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
    const [isAddFieldModalVisible, setIsAddFieldModalVisible] = useState(false);

    useEffect(() => {
        if (event) {
            fetchFields();
        }
    }, [event]);

    const fetchFields = () => {
        if (!event) return;
        callApi({
            path: `events/${event.id}/meta/fields`,
            method: 'GET',
            onSuccess(response: Fields) {
                setFields(response);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const handleSave = (values: any) => {
        if (!fields || !editingFieldKey) return;
        const updatedFields = { ...fields };
        const group = updatedFields.system[editingFieldKey] ? 'system' : updatedFields.location[editingFieldKey] ? 'location' : 'custom';
        const updatedField = { ...updatedFields[group][editingFieldKey], ...values };
        updatedFields[group][editingFieldKey] = updatedField;
        setFields(updatedFields);
        saveFields(updatedFields);
    };

    const saveFields = (fields: Fields) => {
        if (!event) return;
        saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                fields,
            },
            onSuccess() {
                successNotice(__('Fields saved successfully', 'quillbooking'));
                setEditingFieldKey(null);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const addField = () => {
        setIsAddFieldModalVisible(true);
    };

    const handleAddFieldSave = (values: any) => {
        if (!fields) return;
        const newFieldKey = slugify(values.label, { lower: true });
        const newField: FieldType = {
            label: values.label,
            type: values.type,
            required: values.required || false,
            group: 'custom',
            event_location: 'all',
            placeholder: values.placeholder || '',
            order: Object.keys(fields?.system || {}).length + Object.keys(fields?.location || {}).length + Object.keys(fields?.custom || {}).length + 1,
            settings: values.settings || {},
        };
        const updatedFields = { ...fields, custom: { ...fields?.custom, [newFieldKey]: newField } };
        setFields(updatedFields);
        saveFields(updatedFields);
        setIsAddFieldModalVisible(false);
    };

    const removeField = async (fieldKey: string, group: 'system' | 'location' | 'custom') => {
        if (!event || !fields) return;
        
        const updatedFields = { ...fields };
        delete updatedFields[group][fieldKey];
        
        await saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                fields: updatedFields,
            },
            onSuccess() {
                setFields(updatedFields);
                successNotice(__('Field deleted successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const moveField = (fieldKey: string, direction: 'up' | 'down') => {
        setFields((prevFields) => {
            if (!prevFields) {
                return { system: {}, location: {}, custom: {} };
            }
            const allFields = { ...prevFields.system, ...prevFields.location, ...prevFields.custom };
            const sortedFields = Object.keys(allFields).sort((a, b) => allFields[a].order - allFields[b].order);
            const index = sortedFields.indexOf(fieldKey);
            if (index === -1) return prevFields;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= sortedFields.length) return prevFields;

            const temp = sortedFields[index];
            sortedFields[index] = sortedFields[newIndex];
            sortedFields[newIndex] = temp;

            const reorderedFields = sortedFields.reduce((acc, key, idx) => {
                const group = prevFields.system[key] ? 'system' : prevFields.location[key] ? 'location' : 'custom';
                acc[group][key] = { ...prevFields[group][key], order: idx + 1 };
                return acc;
            }, { system: {}, location: {}, custom: {} } as Fields);

            return reorderedFields;
        });
    };

    if (loading || !fields) {
        return <Skeleton active />;
    }

    const allFields = fields ? { ...fields.system, ...fields.location, ...fields.custom } : {};
    const sortedFields = Object.keys(allFields).sort((a, b) => allFields[a].order - allFields[b].order);

    return (
        <div className="event-fields-tab">
            <Title level={4}>{__('Event Fields', 'quillbooking')}</Title>
            <Card>
                <List
                    bordered
                    dataSource={sortedFields}
                    renderItem={(fieldKey) => (
                        <List.Item
                            style={{
                                color: allFields[fieldKey].group === 'system' ? '#888' : 'inherit',
                            }}
                        >
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Typography.Title level={5} style={{ margin: 0 }}>
                                    {allFields[fieldKey].label}
                                </Typography.Title>
                                <div className='quillbooking-field-bagde'>
                                    {allFields[fieldKey].group}
                                </div>
                            </div>
                            <Flex gap={5} className="field-actions" align='center'>
                                <div>
                                    <Button
                                        icon={<ArrowUpOutlined />}
                                        onClick={() => moveField(fieldKey, 'up')}
                                        disabled={sortedFields.indexOf(fieldKey) === 0}
                                    />
                                    <Button
                                        icon={<ArrowDownOutlined />}
                                        onClick={() => moveField(fieldKey, 'down')}
                                        disabled={sortedFields.indexOf(fieldKey) === sortedFields.length - 1}
                                    />
                                </div>
                                <Button onClick={() => {
                                    setEditingFieldKey(fieldKey);
                                }}>
                                    {__('Edit', 'quillbooking')}
                                </Button>
                                {allFields[fieldKey].group === 'custom' && (
                                    <Popconfirm
                                        title={__('Are you sure to delete this field?', 'quillbooking')}
                                        onConfirm={() => removeField(fieldKey, allFields[fieldKey].group as 'system' | 'location' | 'custom')}
                                        okText={__('Yes', 'quillbooking')}
                                        cancelText={__('No', 'quillbooking')}
                                    >
                                        <Button danger>{__('Delete', 'quillbooking')}</Button>
                                    </Popconfirm>
                                )}
                            </Flex>
                        </List.Item>
                    )}
                />
                <Flex justify='space-between' style={{ marginTop: 16 }}>
                    <Button type="dashed" onClick={addField}>
                        {__('Add Field', 'quillbooking')}
                    </Button>
                    <Button type="primary" onClick={() => saveFields(fields)} loading={saveLoading}>
                        {__('Save', 'quillbooking')}
                    </Button>
                </Flex>
            </Card>
            <FieldModal
                visible={isAddFieldModalVisible}
                onCancel={() => setIsAddFieldModalVisible(false)}
                onSave={handleAddFieldSave}
                isEdit={false}
                loading={saveLoading}
            />
            {editingFieldKey && (
                <FieldModal
                    visible={!!editingFieldKey}
                    onCancel={() => {
                        setEditingFieldKey(null);
                    }}
                    onSave={handleSave}
                    field={get(allFields, editingFieldKey)}
                    isEdit={true}
                    loading={saveLoading}
                />
            )}
        </div>
    );
};

export default EventFieldsTab;
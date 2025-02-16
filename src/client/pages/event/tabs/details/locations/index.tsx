/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Select, Input, Modal, Form, Switch } from 'antd';
import { map, isEmpty, get } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import type { LocationField } from '@quillbooking/config';
import type { Location } from '@quillbooking/client';

const Locations: React.FC<{
    locations: Location[];
    onChange: (locations: Location[]) => void;
}> = ({ locations, onChange }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
    const [newLocationType, setNewLocationType] = useState<string | null>(null); // Track the new location type
    const [form] = Form.useForm();
    const locationTypes = ConfigAPI.getLocations();

    const handleLocationTypeChange = (index: number, newType: string) => {
        const locationType = get(locationTypes, newType);

        // If the new location type has no fields, update it directly
        if (isEmpty(locationType?.fields)) {
            const updatedLocations = [...locations];
            updatedLocations[index] = {
                type: newType,
                fields: {},
            };
            onChange(updatedLocations);
            return;
        }

        // Otherwise, open the modal to fill the fields
        setEditingLocationIndex(index);
        setNewLocationType(newType); // Set the new location type
        setIsModalVisible(true);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const updatedLocations = [...locations];
            updatedLocations[editingLocationIndex!] = {
                type: newLocationType!, // Use the new location type
                fields: values,
            };
            onChange(updatedLocations);
            setIsModalVisible(false);
            setEditingLocationIndex(null);
            setNewLocationType(null); // Reset the new location type
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleModalCancel = () => {
        // Remove the location if the user cancels the modal
        if (editingLocationIndex !== null) {
            const updatedLocations = locations.filter((_, i) => i !== editingLocationIndex);
            onChange(updatedLocations);
        }

        setIsModalVisible(false);
        setEditingLocationIndex(null);
        setNewLocationType(null); // Reset the new location type
        form.resetFields();
    };

    const removeLocation = (index: number) => {
        const updatedLocations = locations.filter((_, i) => i !== index);
        onChange(updatedLocations);
    };

    const addLocation = () => {
        const newLocation = {
            type: '', // No default location type
            fields: {},
        };
        onChange([...locations, newLocation]);
    };

    return (
        <Card title={__('Event Locations', 'quillbooking')}>
            <Flex vertical gap={20}>
                {/* Display All Locations */}
                {map(locations, (location, index) => {
                    return (
                        <Flex key={index} align="center" gap={10}>
                            <Select
                                value={location.type || undefined} // Use undefined for placeholder
                                onChange={(value) => handleLocationTypeChange(index, value)}
                                options={map(locationTypes, (locType, key) => ({
                                    label: locType.title,
                                    value: key,
                                }))}
                                placeholder={__('Select location', 'quillbooking')}
                                style={{ flex: 1 }}
                            />
                            <Button danger onClick={() => removeLocation(index)}>
                                {__('Remove', 'quillbooking')}
                            </Button>
                        </Flex>
                    );
                })}

                {/* Add Another Location Option */}
                <Button type="dashed" onClick={addLocation}>
                    {__('+ Add another location option', 'quillbooking')}
                </Button>

                {/* Modal for Location Fields */}
                <Modal
                    title={sprintf(
                        __('Edit %s Location', 'quillbooking'),
                        get(locationTypes, `${newLocationType}.title`, '')
                    )}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                >
                    <Form form={form} layout="vertical">
                        {newLocationType &&
                            map(
                                get(locationTypes, `${newLocationType}.fields`, {}),
                                (field: LocationField, fieldKey) => (
                                    <Form.Item
                                        key={fieldKey}
                                        name={fieldKey}
                                        label={field.label}
                                        rules={[
                                            {
                                                required: field.required,
                                                message: sprintf(__('Please enter %s', 'quillbooking'), field.label),
                                            },
                                        ]}
                                    >
                                        {field.type === 'checkbox' ? (
                                            <Switch />
                                        ) : (
                                            <Input
                                                type={field.type}
                                                placeholder={sprintf(__('Enter %s', 'quillbooking'), field.label)}
                                            />
                                        )}
                                    </Form.Item>
                                )
                            )}
                    </Form>
                </Modal>
            </Flex>
        </Card>
    );
};

export default Locations;
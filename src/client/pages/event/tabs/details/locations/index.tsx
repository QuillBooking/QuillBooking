/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Input, Modal, Form, Switch, Checkbox } from 'antd';
import { map, isEmpty, get } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import type { LocationField } from '@quillbooking/config';
import type { Location } from '@quillbooking/client';
import { Header, EventLocIcon, EditIcon } from '@quillbooking/components';
import { FaPlus } from 'react-icons/fa';
import { SiGooglemeet } from "react-icons/si";
import { BiLogoZoom } from "react-icons/bi";
import "./style.scss";
import { BsMicrosoftTeams } from 'react-icons/bs';
import { FaRegEdit } from "react-icons/fa";
import meet from "../../../../../../../assets/icons/google/google_meet.png";
import zoom from "../../../../../../../assets/icons/zoom/zoom_video.png";
import teams from "../../../../../../../assets/icons/teams/teams.png";

const Locations: React.FC<{
    locations: Location[];
    onChange: (locations: Location[]) => void;
    onKeepDialogOpen: () => void;
}> = ({ locations, onChange, onKeepDialogOpen }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
    const [newLocationType, setNewLocationType] = useState<string | null>(null); // Track the new location type
    const [form] = Form.useForm();
    const locationTypes = ConfigAPI.getLocations();

    console.log(locationTypes);
    console.log(locations)

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
            console.log("Form Values Before Submit:", form.getFieldsValue());
            console.log("Validated values:", values);
            console.log("Form Values:", values);
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
            console.error("Validation failed:", error);
            console.log("Error fields:", error.errorFields);
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

        if (typeof onKeepDialogOpen === "function") {
            onKeepDialogOpen();
        } else {
            console.warn("onKeepDialogOpen is not defined or not a function");
        }
    };

    const handleEditLocation = (type: string) => {
        const index = locations.findIndex(loc => loc.type === type);
        if (index !== -1) {
            setEditingLocationIndex(index);
            setNewLocationType(type);
            form.setFieldsValue(locations[index].fields); // prefill form with existing fields
            setIsModalVisible(true);
        }
    };

    const removeLocation = (index: number) => {
        const updatedLocations = locations.filter((_, i) => i !== index);
        onChange(updatedLocations);
    };

    const addLocation = () => {
        const newLocation = {
            type: 'custom',
            fields: {},
        };
        onChange([...locations, newLocation]);
    };

    return (
        <Card className='rounded-lg'>
            <Flex vertical gap={20}>
                <Flex gap={10} className='items-center border-b pb-4'>
                    <div className="bg-[#EDEDED] rounded-lg p-2">
                        <EventLocIcon />
                    </div>
                    <Header header={__('Event Location', 'quillbooking')}
                        subHeader={__(
                            'Select Where you will Meet Guests.',
                            'quillbooking'
                        )} />
                </Flex>
                <Flex className='justify-between'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("How Will You Meet", "quillbooking")}
                        <span className='text-red-500'>*</span>
                    </div>
                    <div className="text-[#848484] italic">
                        {__("You Can Select More Than One", "quillbooking")}
                    </div>
                </Flex>
                <Flex vertical gap={10} className='justify-start items-start'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Conferencing", "quillbooking")}
                    </div>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "google_meet")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "google_meet");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "google_meet");
                                } else {
                                    handleLocationTypeChange(locations.length, "google_meet");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "google_meet");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex gap={12} className='items-center ml-2'>
                            <img src={meet} alt='google_meet.png' className='size-7' />
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold">
                                    {__("Google Meet", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic">
                                    {__("Connected", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                    </Checkbox>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "zoom_video")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "zoom_video")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "zoom_video");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "zoom_video");
                                } else {
                                    handleLocationTypeChange(locations.length, "zoom_video");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "zoom_video");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex gap={12} className='items-center ml-2'>
                            <img src={zoom} alt='zoom.png' className='size-7' />
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold">
                                    {__("Zoom Video", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic">
                                    {__("Connected", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                    </Checkbox>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "ms_teams")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "ms_teams")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "ms_teams");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "ms_teams");
                                } else {
                                    handleLocationTypeChange(locations.length, "ms_teams");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "ms_teams");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex gap={12} className='items-center ml-2'>
                            <img src={teams} alt='teams.png' className='size-7' />
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold">
                                    {__("MS Teams", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic">
                                    {__("Connected", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                    </Checkbox>
                </Flex>
                <Flex vertical gap={10} className='justify-start items-start'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("In Person", "quillbooking")}
                    </div>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "attendee_address")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "attendee_address")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "attendee_address");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "attendee_address");
                                } else {
                                    handleLocationTypeChange(locations.length, "attendee_address");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "attendee_address");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex vertical>
                            <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                {__("Attendee Address", "quillbooking")}
                            </div>
                            <div className="text-[#3F4254] text-[12px] italic ml-2">
                                {__("In Person", "quillbooking")}
                            </div>
                        </Flex>
                    </Checkbox>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "person_address")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "person_address")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "person_address");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "person_address");
                                } else {
                                    handleLocationTypeChange(locations.length, "person_address");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "person_address");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex align='center' className='justify-between gap-x-[22rem]'>
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                    {__("Organizer Address", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic ml-2">
                                    {
                                        (() => {
                                            const personAddress = locations.find(loc => loc.type === "person_address");
                                            return personAddress?.fields?.location
                                                ? personAddress.fields.location
                                                : __("In Person", "quillbooking");
                                        })()
                                    }
                                </div>
                            </Flex>
                            {
                                (() => {
                                    const personAddress = locations.find(loc => loc.type === "person_address");
                                    if (personAddress?.fields?.location) {
                                        return (
                                            <Button
                                                onClick={() => handleEditLocation("person_address")}
                                                className='bg-transparent border-none text-[#3F4254]'
                                            >
                                                <EditIcon />
                                                {__('Edit', 'quillbooking')}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })()
                            }
                        </Flex>
                    </Checkbox>
                </Flex>
                <Flex vertical gap={10} className='justify-start items-start'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Phone & Online Meeting", "quillbooking")}
                    </div>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "attendee_phone")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "attendee_phone")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "attendee_phone");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "attendee_phone");
                                } else {
                                    handleLocationTypeChange(locations.length, "attendee_phone");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "attendee_phone");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex vertical>
                            <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                {__("Attendee Phone", "quillbooking")}
                            </div>
                            <div className="text-[#3F4254] text-[12px] italic ml-2">
                                {__("Phone", "quillbooking")}
                            </div>
                        </Flex>
                    </Checkbox>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "person_phone")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "person_phone")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "person_phone");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "person_phone");
                                } else {
                                    handleLocationTypeChange(locations.length, "person_phone");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "person_phone");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex align='center' className='justify-between gap-x-[26rem]'>
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                    {__("Organizer Phone", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic ml-2">
                                    {
                                        (() => {
                                            const personPhone = locations.find(loc => loc.type === "person_phone");
                                            return personPhone?.fields?.phone
                                                ? personPhone.fields.phone
                                                : __("Phone", "quillbooking");
                                        })()
                                    }
                                </div>
                            </Flex>
                            {
                                (() => {
                                    const personPhone = locations.find(loc => loc.type === "person_phone");
                                    if (personPhone?.fields?.phone) {
                                        return (
                                            <Button
                                                onClick={() => handleEditLocation("person_phone")}
                                                className='bg-transparent border-none text-[#3F4254]'
                                            >
                                                <EditIcon />
                                                {__('Edit', 'quillbooking')}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })()
                            }
                        </Flex>
                    </Checkbox>
                    <Checkbox
                        className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "online")
                            ? "border-color-primary bg-color-secondary" // Checked styles
                            : "border-[#D3D4D6] bg-white" // Default styles
                            }`}
                        checked={locations.some(loc => loc.type === "online")}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            const existingIndex = locations.findIndex(loc => loc.type === "online");

                            if (checked) {
                                if (existingIndex !== -1) {
                                    handleLocationTypeChange(existingIndex, "online");
                                } else {
                                    handleLocationTypeChange(locations.length, "online");
                                }
                            } else {
                                const updatedLocations = locations.filter(loc => loc.type !== "online");
                                onChange(updatedLocations);
                            }
                        }}
                    >
                        <Flex align='center' className='justify-between gap-x-[22rem]'>
                            <Flex vertical>
                                <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                    {__("Online Meeting", "quillbooking")}
                                </div>
                                <div className="text-[#3F4254] text-[12px] italic ml-2">
                                    {
                                        (() => {
                                            const meetingUrl = locations.find(loc => loc.type === "online");
                                            return meetingUrl?.fields?.meeting_url
                                                ? meetingUrl.fields.meeting_url
                                                : __("Online", "quillbooking");
                                        })()
                                    }
                                </div>
                            </Flex>
                            {
                                (() => {
                                    const meetingUrl = locations.find(loc => loc.type === "online");
                                    if (meetingUrl?.fields?.meeting_url) {
                                        return (
                                            <Button
                                                onClick={() => handleEditLocation("online")}
                                                className='bg-transparent border-none text-[#3F4254]'
                                            >
                                                <EditIcon />
                                                {__('Edit', 'quillbooking')}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })()
                            }
                        </Flex>
                    </Checkbox>
                </Flex>
                {/* Display All Locations */}
                {/* {map(locations, (location, index) => {
                    return (
                        <Flex key={index} align="center" gap={10}>
                            <Select
                                value={location.type || undefined} // Use undefined for placeholder
                                onChange={(value) => handleLocationTypeChange(index, value)}
                                getPopupContainer={(trigger) => trigger.parentElement}
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
                })} */}

                {/* Add Another Location Option */}
                <Flex vertical gap={2} className='justify-start items-start'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Other", "quillbooking")}
                    </div>
                    {
                        locations.some(loc => loc.type === "custom") && (
                            <Checkbox
                                className={`border rounded-lg p-4 w-full transition-all duration-300 custom-check ${locations.some(loc => loc.type === "custom")
                                    ? "border-color-primary bg-color-secondary"
                                    : "border-[#D3D4D6] bg-white"
                                    }`}
                                checked={locations.some(loc => loc.type === "custom")}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    const existingIndex = locations.findIndex(loc => loc.type === "custom");

                                    if (checked) {
                                        // Add or edit the custom location
                                        if (existingIndex !== -1) {
                                            handleLocationTypeChange(existingIndex, "custom");
                                        } else {
                                            handleLocationTypeChange(locations.length, "custom");
                                        }
                                    } else {
                                        // Remove the custom location directly, no modal
                                        const updatedLocations = locations.filter(loc => loc.type !== "custom");
                                        onChange(updatedLocations);
                                    }
                                }}
                            >
                                <Flex align='center' className='justify-between gap-x-[26rem]'>
                                    <Flex vertical>
                                        <div className="text-[#3F4254] text-[16px] font-semibold ml-2">
                                            {
                                                (() => {
                                                    const customLocation = locations.find(loc => loc.type === "custom");
                                                    return customLocation?.fields?.location
                                                        ? customLocation.fields.location
                                                        : __("Custom", "quillbooking");
                                                })()
                                            }
                                        </div>
                                        <div className="text-[#3F4254] text-[12px] italic ml-2">
                                            {__("description", "quillbooking")}
                                        </div>

                                    </Flex>
                                    {
                                        (() => {
                                            const customLocation = locations.find(loc => loc.type === "custom");
                                            if (customLocation?.fields?.location) {
                                                return (
                                                    <Button
                                                        onClick={() => handleEditLocation("custom")}
                                                        className='bg-transparent border-none text-[#3F4254]'
                                                    >
                                                        <EditIcon />
                                                        {__('Edit', 'quillbooking')}
                                                    </Button>
                                                );
                                            }
                                            return null;
                                        })()
                                    }
                                </Flex>
                            </Checkbox>
                        )
                    }
                    <Button
                        onClick={() => {
                            const existingIndex = locations.findIndex(loc => loc.type === "custom");
                            if (existingIndex !== -1) {
                                handleLocationTypeChange(existingIndex, "custom");
                            } else {
                                handleLocationTypeChange(locations.length, "custom"); // Add new one
                            }
                        }}
                        icon={<FaPlus className='text-color-primary' />}
                        className='text-color-primary font-semibold outline-none border-none shadow-none'>
                        {__('Add Custom Location', 'quillbooking')}
                    </Button>
                </Flex>

                {/* Modal for Location Fields */}
                <Modal
                    title={
                        <div>
                            <h2 className='text-[#09090B] text-[30px] font-[700]'>
                                {sprintf(__(' %s ', 'quillbooking'), get(locationTypes, `${newLocationType}.title`, ''))}
                            </h2>
                            <span className='text-[#979797] font-[400] text-[14px]'>Add the following data.</span>
                        </div>
                    }
                    open={isModalVisible}
                    getContainer={false}
                    footer={null}
                    //onOk={handleModalOk}
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
                                        {...(field.type === "checkbox" && { valuePropName: "checked" })}
                                        rules={[
                                            {
                                                required: field.required,
                                                message: sprintf(__('Please enter %s', 'quillbooking'), field.label),
                                            },
                                        ]}
                                    >
                                        {field.type === 'checkbox' ? (
                                            <Checkbox className='custom-check text-[#3F4254] font-semibold'>{field.label}</Checkbox>
                                        ) : (
                                            <>
                                                <div className="text-[#09090B] text-[16px] mb-2">
                                                    {field.label}
                                                    <span className='text-red-500'>*</span>
                                                    {field.label === "Person Phone" && (
                                                        <span className="text-[#afb9c4] text-sm ml-2">(with country code)</span>
                                                    )}
                                                </div>
                                                <Input
                                                    type={field.type}
                                                    onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
                                                    placeholder={sprintf(__('%s', 'quillbooking'), field.label)}
                                                    className='rounded-lg h-[48px]'
                                                />
                                            </>
                                        )}
                                    </Form.Item>
                                )
                            )}
                        <Form.Item>
                            <Button
                                htmlType="submit"
                                className="w-full bg-color-primary text-white font-semibold rounded-lg py-2 transition-all"
                                onClick={handleModalOk}
                            >
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Flex >
        </Card >
    );
};

export default Locations;
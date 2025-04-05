/**
 * External dependencies.
 */
import React, { useState } from 'react';
import { Flex, Card, Input, Select, Button } from 'antd';
import { Header, ShareEventIcon } from '@quillbooking/components';
import { FaCheck, FaRegEdit } from "react-icons/fa";
import { __ } from '@wordpress/i18n';

interface EventInfoProps {
    name: string;
    description?: string | null;
    hosts: { id: number | string; name: string }[];
    color: string;
    onChange: (key: string, value: any) => void;
}

const colors = ["#953AE4", "#0099FF", "#FF4F00", "#E55CFF", "#0AE8F0", "#17E885", "#CCF000", "#FFA600"];

const EventInfo: React.FC<EventInfoProps> = ({ name, description, hosts, color, onChange }) => {

    return (
        <Card className='rounded-lg'>
            <Flex gap={10} className='items-center border-b pb-4'>
                <ShareEventIcon />
                <Header header={__('Event Details', 'quillbooking')}
                    subHeader={__(
                        'Set your Event Name and Event Host.',
                        'quillbooking'
                    )} />
            </Flex>
            <Flex vertical className='border-b pb-4'>
                <Flex gap={1} vertical className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Event Calendar Name", "quillbooking")}
                        <span className='text-red-500'>*</span>
                    </div>
                    <Input
                        value={name}
                        onChange={(e) => onChange("name", e.target.value)}
                        placeholder={__('Enter name of this event calendar', 'quillbooking')}
                        className='h-[48px] rounded-lg'
                    />
                </Flex>
                <Flex gap={1} vertical className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Description", "quillbooking")}
                        <span className='text-red-500'>*</span>
                    </div>
                    <Input.TextArea
                        value={description || ''}
                        onChange={(e) => onChange("description", e.target.value)}
                        placeholder={__('type your Description', 'quillbooking')}
                        rows={4}
                        className='rounded-lg'
                    />
                </Flex>
            </Flex>
            <Flex vertical>
                {/* <Flex gap={1} vertical className='mt-4'>
                    {hosts && <>
                        <div className="text-[#09090B] text-[16px]">
                            {__("Select Event Host", "quillbooking")}
                            <span className='text-red-500'>*</span>
                        </div>
                        <Select
                            defaultValue={hosts[0]?.id}
                            className="h-[48px] rounded-lg"
                            onChange={(selectedId) => {
                                const selectedHost = hosts.find((host) => host.id === selectedId);
                                onChange("hosts", selectedHost ? [selectedHost] : []);
                            }}
                            getPopupContainer={(trigger) => trigger.parentElement}
                            options={hosts.map((host) => ({ value: host.id, label: host.name }))}
                        />
                    </>}
                </Flex> */}

                {/* static */}
                {/* <Flex gap={1} vertical className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Event Host", "quillbooking")}
                    </div>
                    <Input
                        value={name}
                        onChange={(e) => onChange("host", e.target.value)}
                        placeholder={__('host', 'quillbooking')}
                        className='h-[48px] rounded-lg flex items-center'
                        suffix={<FaRegEdit className='text-[#09090B] text-[16px]' />}
                    />
                </Flex> */}
                <Flex gap={1} vertical className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Event Color", "quillbooking")}
                    </div>
                    <div className="flex flex-wrap gap-4 place-items-center mt-2">
                        {colors.map((colorOption) => (
                            <Button
                                key={colorOption}
                                shape="circle"
                                size="large"
                                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 
                                    ${color === colorOption ? "ring ring-offset-2" : ""}`} // Apply ring only if selected
                                style={{
                                    backgroundColor: colorOption,
                                    minWidth: "25px",
                                    border: colorOption ? "" : "2px solid #F2EBF9", // Dynamic border color
                                    "--tw-ring-color": colorOption ? colorOption : "",
                                }}
                                onClick={() => onChange("color", colorOption)} // Update selected color
                            >
                                {color === colorOption && <FaCheck className="text-white text-md absolute" />}
                            </Button>
                        ))}
                    </div>
                </Flex>
            </Flex>
        </Card >
    );
};

export default EventInfo;
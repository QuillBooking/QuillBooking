/**
 * External dependencies.
 */
import React, { useEffect, useState } from 'react';
import { Flex, Card, Input } from 'antd';
import { Header } from '@quillbooking/components';
import { PiClockClockwiseFill } from "react-icons/pi";
import { __ } from '@wordpress/i18n';


const Duration: React.FC<{ duration: number; onChange: (key: string, value: any) => void; }> = ({ duration, onChange }) => {
    const durations = [
        { value: 15, label: __("15 Minutes", "quillbooking"), description: __("Quick Check-in", "quillbooking") },
        { value: 30, label: __("30 Minutes", "quillbooking"), description: __("Standard Consultation", "quillbooking") },
        { value: 60, label: __("60 Minutes", "quillbooking"), description: __("In-depth discussion", "quillbooking") }
    ];

    const [selectedDuration, setSelectedDuration] = useState<number>(() =>
        durations.find(d => d.value === duration)?.value || durations[0].value
    );

    useEffect(() => {
        console.log("Received duration prop:", duration); // Debugging
        console.log("Setting selectedDuration:", duration);
        setSelectedDuration(duration);
    }, [duration]);

    const handleSelect = (value: number) => {
        console.log("Selected duration:", value);
        setSelectedDuration(value);
        onChange("duration", value);
    };


    return (
        <Card className='rounded-lg'>
            <Flex gap={10} className='items-center border-b pb-4'>
                <PiClockClockwiseFill className='bg-[#EDEDED] text-[50px] rounded-lg p-2' />
                <Header header={__('Set Duration', 'quillbooking')}
                    subHeader={__(
                        'Define how long your event will be. it can be as long as 12 hours.',
                        'quillbooking'
                    )} />
            </Flex>
            <Flex vertical gap={20}>
                <Flex vertical gap={8} className='mt-4'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Meeting Duration", "quillbooking")}
                        <span className='text-red-500'>*</span>
                    </div>
                    <Flex gap={20} className='flex-wrap'>
                        {durations.map((item) => (
                            <Card
                                key={item.value}
                                className={`cursor-pointer transition-all rounded-lg
                                    ${selectedDuration == item.value ? "border-color-primary bg-[#F1E0FF]" : "border-[#f0f0f0]"}`}
                                onClick={() => handleSelect(item.value)}
                                bodyStyle={{ paddingTop: "18px" }}
                            >
                                <div className={`font-semibold ${selectedDuration == item.value ? "text-color-primary" : "text-[#1E2125]"}`}>{item.label}</div>
                                <div className='text-[#1E2125] mt-[6px]'>{item.description}</div>
                            </Card>
                        ))}
                    </Flex>
                </Flex>
                <Flex gap={20} className='items-center'>
                    <div className="text-[#09090B] text-[16px]">
                        {__("Custom Duration", "quillbooking")}
                    </div>
                    <Input
                        suffix={<span className='border-l pl-3'>{__("Min", "quillbooking")}</span>}
                        className='h-[48px] rounded-lg flex items-center w-[194px]'
                        value={duration}
                        onChange={(e) => onChange("duration", Number(e.target.value))}
                    />
                </Flex>
            </Flex>
        </Card>
    );
};

export default Duration;
/**
 * External dependencies.
 */
import React, { useState } from 'react';

import { Flex } from 'antd';
import { __ } from '@wordpress/i18n';
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { CardContent, Card } from '@mui/material';
import { CiShare1 } from "react-icons/ci";
import { LuClock5 } from "react-icons/lu";
import type { Location } from '@quillbooking/client';

interface LivePreviewProps {
    name: string;
    hosts: { id: number | string; name: string }[];
    duration: number;
    locations: Location[];
}

const LivePreview: React.FC<LivePreviewProps> = ({ name, hosts, duration, locations }) => {

    return (
        <Card className='rounded-lg shadow-none border border-[#e5e7eb] border-[0.1px]'>
            <CardContent className='p-0'>
                <Flex className='justify-between items-center bg-color-primary px-[30px] py-5'>
                    <div className="text-white text-[24px] font-[700]">
                        {__("Event Live Preview", "quillbooking")}
                    </div>
                    <SlArrowUp className='text-white text-[16px]' />
                </Flex>
                <Flex vertical gap={10} className='px-[30px] py-5'>
                    <Flex className='justify-between items-start'>
                        <Flex vertical gap={4}>
                            {/* static */}
                            <div>User Image</div>
                            <div className='text-[#1A1A1A99] text-[16px]'>host name</div>
                            <div className='text-[#1A1A1A] text-[24px]'>{name}</div>
                        </Flex>
                        <Flex gap={4} className='text-color-primary text-[16px] font-semibold items-center'>
                            <CiShare1 className='text-[20px]' />
                            <span>{__("Event Link", "quillbooking")}</span>
                        </Flex>
                    </Flex>
                    <Flex gap={4} className='text-[#1A1A1A99] text-[16px] items-center'>
                        <LuClock5 className='text-[20px]' />
                        <span>{duration} {__("min", "quillbooking")}</span>
                    </Flex>
                    <span className="text-[16px] text-[#1A1A1A99] font-[500] capitalize">
                        {locations.map((loc, index) => (
                            <span key={index}>
                                {loc.type}{index !== locations.length - 1 && ", "}
                            </span>
                        ))}
                    </span>
                    <div className='text-[16px] text-[#1A1A1A] pb-4'>{__("This is an example of a meeting you would have with a potential customer to demonstrate your product.", "quillbooking")}</div>
                </Flex>
            </CardContent>
        </Card>
    );
};

export default LivePreview;
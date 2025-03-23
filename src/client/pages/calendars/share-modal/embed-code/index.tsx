import { CopyWhiteIcon } from "@quillbooking/components";
import { useCopyToClipboard } from "@quillbooking/hooks";
import { __ } from "@wordpress/i18n";
import { Button, Flex, Input } from "antd";
import React from "react";

const EmbedCode: React.FC<{ url: string; icon: React.ReactNode; title: string }> = ({ url, icon, title }) => {
    const copyToClipboard = useCopyToClipboard();

    return (
        <>
        {/* static */}
            <Flex gap={10} className="flex items-center border-b pb-4 border-[#E4E4E4]">
                <div className="rounded-lg p-2 border border-color-secondary">
                    {icon}
                </div>
                <div className='flex flex-col'>
                    <span className='text-[#09090B] text-[20px] font-[700]'>{title}</span>
                    <span className="text-[12px] font-[400] text-[#71717A]">{__("Copy the embed code below and insert it in your external page.",'quillbooking')}
                    </span>
                </div>
            </Flex>
            <Flex vertical className="pt-4">
                <div className="pb-2 text-[#3F4254] text-[16px] font-semibold">{__("Embed Code",'quillbooking')}</div>
                <Flex gap={10}>
                    <Input value={url} readOnly className="h-[48px] text-[#999999] rounded-lg" />
                    <Button className="bg-color-primary h-[48px] px-7 rounded-lg"
                        onClick={() => copyToClipboard(url, __('Link copied', 'quillbooking'))}>
                        <CopyWhiteIcon />
                        <span className="text-white text-[16px] font-[500] self-center">{__("Copy",'quillbooking')}</span>
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};

export default EmbedCode;
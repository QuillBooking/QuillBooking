import { __ } from "@wordpress/i18n";
import { Button, Card, Flex, Input, Select } from "antd";
import { CopyWhiteIcon } from "@quillbooking/components";
import { useCopyToClipboard } from "@quillbooking/hooks";
import React from "react";

const PopupCode: React.FC<{ url: string; icon: React.ReactNode; title: string }> = ({ url, icon, title }) => {
    const copyToClipboard = useCopyToClipboard();
    const handleChange = (value: string) => {
        console.log(`selected ${value}`);
    };

    return (
        <>
            {/* static */}
            <Flex gap={10} className="flex items-center border-b pb-4 border-[#E4E4E4]">
                <div className="rounded-lg p-2 border border-color-secondary">
                    {icon}
                </div>
                <div className='flex flex-col'>
                    <span className='text-[#09090B] text-[20px] font-[700]'>{title}</span>
                    <span className="text-[12px] font-[400] text-[#71717A]">{__("Popup Settings", "quillbooking")}</span>
                </div>
            </Flex>
            <Card className="mt-5">
                <Flex vertical gap={20}>
                    <Flex className="items-center justify-between">
                        <span className="text-[#1E2125] text-[16px] font-[700]">Width</span>
                        <Flex gap={18}>
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="100" />
                            <Select
                                defaultValue="%"
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={handleChange}
                                getPopupContainer={(trigger) => trigger.parentElement}
                                options={[
                                    { value: '%', label: '%' },
                                    { value: 'Px', label: 'Px' },
                                    { value: 'Auto', label: 'Auto' },
                                ]}
                            />
                        </Flex>
                    </Flex>
                    <Flex className="items-center justify-between">
                        <span className="text-[#1E2125] text-[16px] font-[700]">Minimum Height</span>
                        <Flex gap={18}>
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="500" />
                            <Select
                                defaultValue="Px"
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={handleChange}
                                getPopupContainer={(trigger) => trigger.parentElement}
                                options={[
                                    { value: '%', label: '%' },
                                    { value: 'Px', label: 'Px' },
                                    { value: 'Auto', label: 'Auto' },
                                ]}
                            />
                        </Flex>
                    </Flex>
                    <Flex className="items-center justify-between">
                        <span className="text-[#1E2125] text-[16px] font-[700]">Maximum Height</span>
                        <Flex gap={18}>
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="0" />
                            <Select
                                defaultValue="Auto"
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={handleChange}
                                getPopupContainer={(trigger) => trigger.parentElement}
                                options={[
                                    { value: '%', label: '%' },
                                    { value: 'Px', label: 'Px' },
                                    { value: 'Auto', label: 'Auto' },
                                ]}
                            />
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
            <Flex vertical className="pt-4">
                <div className="pb-2 text-[#3F4254] text-[16px] font-semibold">{__("Copy the shortcode below and insert it in your WordPress page or post.", "quillbooking")}</div>
                <Flex gap={10} vertical>
                    <Input value={url} readOnly className="h-[140px] text-[#999999] rounded-lg" />
                    <Button className="bg-color-primary h-[48px] px-9 w-fit rounded-lg"
                        onClick={() => copyToClipboard(url, __('Link copied', 'quillbooking'))}>
                        <CopyWhiteIcon />
                        <span className="text-white text-[16px] font-[500] self-center">{__("Copy", 'quillbooking')}</span>
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};

export default PopupCode;
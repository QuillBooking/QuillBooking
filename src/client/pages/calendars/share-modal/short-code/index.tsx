/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";

/**
 * External dependencies
 */
import { Button, Card, Flex, Input, Select } from "antd";
import React, { useState } from "react";

/**
 * Internal dependencies
 */
import { CopyWhiteIcon } from "@quillbooking/components";
import { useCopyToClipboard } from "@quillbooking/hooks";


const ShortCode: React.FC<{ url: string; icon: React.ReactNode; title: string }> = ({ url, icon, title }) => {
    const copyToClipboard = useCopyToClipboard();
    const [shortCode, setShortCode] = useState({
        Width: { value: 100, unit: "%" },
        MinHeight: { value: 500, unit: "Px" },
        MaxHeight: { value: 0, unit: "Auto" },
    });
    const handleSizeChange = (field, value, unit) => {
        setShortCode((prev) => ({
            ...prev,
            [field]: { value, unit },
        }));
    };
    console.log(shortCode)

    return (
        <>
            {/* static */}
            <Flex gap={10} className="flex items-center border-b pb-4 border-[#E4E4E4]">
                <div className="rounded-lg p-2 border border-[#F1E0FF]">
                    {icon}
                </div>
                <div className='flex flex-col'>
                    <span className='text-[#09090B] text-[20px] font-[700]'>{title}</span>
                    <span className="text-[12px] font-[400] text-[#71717A]">{__("Customize your form display settings and copy the generated shortcode.", "quillbooking")}
                    </span>
                </div>
            </Flex>
            <Card className="mt-5">
                <Flex vertical gap={20}>
                    <Flex className="items-center justify-between">
                        <span className="text-[#1E2125] text-[16px] font-[700]">Width</span>
                        <Flex gap={18}>
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="100"
                                value={shortCode.Width.value}
                                onChange={(e) => handleSizeChange("Width", e.target.value, shortCode.Width.unit)} />
                            <Select
                                defaultValue={shortCode.Width.unit}
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={(unit) => handleSizeChange("Width", shortCode.Width.value, unit)}
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
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="100"
                                value={shortCode.MinHeight.value}
                                onChange={(e) => handleSizeChange("MinHeight", e.target.value, shortCode.MinHeight.unit)} />
                            <Select
                                defaultValue={shortCode.MinHeight.unit}
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={(unit) => handleSizeChange("MinHeight", shortCode.MinHeight.value, unit)}
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
                            <Input className="h-[48px] rounded-lg w-[132px]" placeholder="100"
                                value={shortCode.MaxHeight.value}
                                onChange={(e) => handleSizeChange("MaxHeight", e.target.value, shortCode.MaxHeight.unit)} />
                            <Select
                                defaultValue={shortCode.MaxHeight.unit}
                                className="h-[48px] rounded-lg w-[132px]"
                                onChange={(unit) => handleSizeChange("MaxHeight", shortCode.MaxHeight.value, unit)}
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
                <div className="pb-2 text-[#3F4254] text-[16px] font-semibold">{__("Generated Shortcode", "quillbooking")}</div>
                <Flex gap={10}>
                    <Input value={url} readOnly className="h-[48px] text-[#999999] rounded-lg" />
                    <Button className="bg-color-primary h-[48px] px-7 rounded-lg text-white"
                        onClick={() => copyToClipboard(url, __('Link copied', 'quillbooking'))}>
                        <CopyWhiteIcon />
                        <span className="text-white text-[16px] font-[500] self-center">{__("Copy", 'quillbooking')}</span>
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};

export default ShortCode;
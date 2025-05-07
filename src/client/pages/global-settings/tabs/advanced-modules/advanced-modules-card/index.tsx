/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";

/**
 * External dependencies
 */
import { Button, Card, Checkbox, Flex, Radio, Select } from "antd";
import { CiShare1 } from "react-icons/ci";

/**
 * Internal dependencies
 */
import { AdvancedSettingsIcon, CardHeader } from "@quillbooking/components";

const AdvancedModulesCard: React.FC = () => {
    const [shortCode, setShortCode] = useState<string>('');
    const [message, setMessage] = useState<boolean>(false);
    return (
        <Card>
            <CardHeader title={__("Advanced Modules", "quillbooking")}
                description={__("Enable/Disable Quill Booking Advanced features or integrations.", "quillbooking")}
                icon={<AdvancedSettingsIcon />} />
            <Card className="mt-4">
                <Flex vertical gap={20}>
                    <Flex vertical gap={4}>
                        <Flex gap={15} align="center">
                            <div className="text-[#3F4254] text-[18px] font-semibold">
                                {__("Frontend Portal", "quillbooking")}
                            </div>
                            <span className="bg-[#EDEDED] text-[#292D32] rounded-lg text-[11px] pt-[3px] px-2 h-[22px]">
                                {__('DISABLED', 'quillbooking')}
                            </span>
                        </Flex>
                        <ul className="list-disc pl-4 text-[#818181]">
                            <li>
                                <span>{__("Load Quill Booking in the frontend of the website", "quillbooking")}</span>
                                <span className="text-color-primary underline font-semibold mx-1">
                                    {__('Learn more', 'quillbooking')}
                                </span>
                                <span>{__('about this feature.', 'quillbooking')}</span>
                            </li>
                        </ul>
                        {message && (
                            <Flex vertical gap={10} className="border border-[#E4E4E4] py-3 px-5 rounded-lg">
                                <div className="text-color-primary text-[16px] font-semibold">
                                    {__("This portal can be accessed from", "quillbooking")}
                                </div>
                                <Flex gap={4}>
                                    <div className="text-[#9197A4] text-[12px] font-semibold">
                                        {__("https://dev123.quillsmtp.com/wp-admin/admin.php?page=fluent-booking#/", "quillbooking")}
                                    </div>
                                    <CiShare1 className='text-[20px]'/>
                                </Flex>
                            </Flex>
                        )}
                    </Flex>
                    <div className="text-[#3F4254] text-[18px] font-semibold">
                        {__("Add your Quill Booking to WordPress frontend / any Page via Shortcode.", "quillbooking")}
                    </div>
                    <Flex vertical gap={4}>
                        <div className="font-semibold text-[16px]">
                            {__('Status', 'quillbooking')}
                        </div>
                        <Checkbox
                            className="custom-check text-[#3F4254] font-semibold"
                        >
                            {__('Enable Frontend Portal.', 'quillbooking')}
                        </Checkbox>
                    </Flex>
                    <Flex vertical gap={4}>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('Via Shortcode / Dedicated Page?', 'quillbooking')}
                        </div>
                        <Radio.Group
                            className="flex flex-col gap-3 w-full"
                            value={shortCode}
                            onChange={(e) => setShortCode(e.target.value)}
                        >
                            <Radio value="standalone"
                                className={`custom-radio border w-full rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${shortCode === 'standalone'
                                        ? 'bg-color-secondary border-color-primary'
                                        : 'border'
                                    }`}
                            >
                                {__('Show in a standalone fontend URL', 'quillbooking')}
                            </Radio>
                            <Radio value="predefined"
                                className={`custom-radio border w-full rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                ${shortCode === 'predefined'
                                        ? 'bg-color-secondary border-color-primary'
                                        : 'border'
                                    }`}
                            >
                                {__('Use a Pre-defined Page View Shortcode.', 'quillbooking')}
                            </Radio>
                        </Radio.Group>
                    </Flex>
                    <Flex vertical gap={4}>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('URL Slug for the frontend panel (eg: projects)', 'quillbooking')}
                        </div>
                        <Select
                            className="w-full rounded-lg h-[48px]"
                            options={[]}
                            placeholder={__('my-bookings', 'quillbooking')}
                        />
                    </Flex>
                    <Flex justify='flex-end'>
                        <Button
                            type='primary'
                            //onClick={handleSave}
                            //disabled={saveLoading}
                            className='rounded-lg font-medium px-10 text-white bg-color-primary '
                        >
                            {__('Save', 'quillbooking')}
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </Card>
    );
};

export default AdvancedModulesCard;
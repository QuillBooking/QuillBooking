/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";

/**
 * External dependencies
 */
import { Button, Card, Flex, Switch } from "antd";


/**
 * Internal dependencies
 */
import { CardHeader, PluginsIcon } from "@quillbooking/components";
import quillforms from "../../../../../../../assets/icons/quillforms/quillforms.png";
import quillcrm from "../../../../../../../assets/icons/quillcrm/quillcrm.png";
import woocommerce from "../../../../../../../assets/icons/woocommerce/woocommerce.png";

const PluginsCard: React.FC = () => {
    const [status, setStatus] = useState('install');

    return (
        <Card>
            <CardHeader title={__("Recommended Plugins and Addons", "quillbooking")}
                description={__("Plugins that will extend your Quill Booking Functionalities", "quillbooking")}
                icon={<PluginsIcon />} />
            <Flex vertical gap={10} className='mt-4'>
                <Card>
                    <Flex justify="space-between" align="center">
                        <Flex gap={12} align="center">
                            <img src={woocommerce} alt='woocommerce.png' className='w-[3.25rem] h-9' />
                            <Flex vertical gap={2}>
                                <div className="text-[#3F4254] text-base font-semibold">
                                    {__("Woo Commerce", "quillbooking")}
                                </div>
                                <div className="text-[#9197A4] text-xs">
                                    {__("WooCommerce is the worlds most popular open source eCommerce solution.", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                        {status == 'install' && (
                            <Button
                                type='text'
                                className="bg-color-primary text-white font-semibold"
                                onClick={() => setStatus('disabled')}
                            >
                                {__("Install Woo Commerce", "quillbooking")}
                            </Button>
                        )}
                        {status == 'disabled' && (
                            <Switch
                                checked={false}
                                onChange={(checked) => setStatus(checked ? 'enabled' : 'disabled')}
                                className={false ? "bg-color-primary" : "bg-gray-400"}
                            />
                        )}
                        {status == 'enabled' && (
                            <div className="text-color-primary font-semibold">{__("System Enabled", "quillbooking")}</div>
                        )}
                    </Flex>
                </Card>
                <Card>
                    <Flex justify="space-between" align="center">
                        <Flex gap={12} align="center">
                            <img src={quillcrm} alt='quillcrm.png' className='size-[3.25rem]' />
                            <Flex vertical gap={2}>
                                <div className="text-[#3F4254] text-base font-semibold">
                                    {__("Quill CRM", "quillbooking")}
                                </div>
                                <div className="text-[#9197A4] text-xs">
                                    {__("Quill CRM is dummy text used in laying out print, graphic or web designs.", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                        {status == 'install' && (
                            <Button
                                type='text'
                                className="bg-color-primary text-white font-semibold"
                                onClick={() => setStatus('disabled')}
                            >
                                {__("Install Quill CRM", "quillbooking")}
                            </Button>
                        )}
                        {status == 'disabled' && (
                            <Switch
                                checked={false}
                                onChange={(checked) => setStatus(checked ? 'enabled' : 'disabled')}
                                className={false ? "bg-color-primary" : "bg-gray-400"}
                            />
                        )}
                        {status == 'enabled' && (
                            <div className="text-color-primary font-semibold">{__("System Enabled", "quillbooking")}</div>
                        )}
                    </Flex>
                </Card>
                <Card>
                    <Flex justify="space-between" align="center">
                        <Flex gap={12} align="center">
                            <img src={quillforms} alt='quillforms.png' className='size-[3.25rem]' />
                            <Flex vertical gap={2}>
                                <div className="text-[#3F4254] text-base font-semibold">
                                    {__("Quill Forms", "quillbooking")}
                                </div>
                                <div className="text-[#9197A4] text-xs">
                                    {__("Quill Forms is a new revolution for online forms and surveys", "quillbooking")}
                                </div>
                            </Flex>
                        </Flex>
                        {status == 'install' && (
                            <Button
                                type='text'
                                className="bg-color-primary text-white font-semibold"
                                onClick={() => setStatus('disabled')}
                            >
                                {__("Install Quill Forms", "quillbooking")}
                            </Button>
                        )}
                        {status == 'disabled' && (
                            <Switch
                                checked={false}
                                onChange={(checked) => setStatus(checked ? 'enabled' : 'disabled')}
                                className={false ? "bg-color-primary" : "bg-gray-400"}
                            />
                        )}
                        {status == 'enabled' && (
                            <div className="text-color-primary font-semibold">{__("System Enabled", "quillbooking")}</div>
                        )}
                    </Flex>
                </Card>
            </Flex>
        </Card>
    );
};

export default PluginsCard;
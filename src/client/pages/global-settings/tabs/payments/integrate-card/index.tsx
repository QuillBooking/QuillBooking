/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
    Card,
    Flex,
} from 'antd';

/**
 * Internal dependencies
 */
import { CardHeader, IntegrationsTabIcon, NoticeComponent } from '@quillbooking/components';
import paypal from '../../../../../../../assets/icons/paypal/paypal_vertical.png';
import stripe from '../../../../../../../assets/icons/stripe/stripe.png';

export interface IntegrateCardProps {
    paymentGateways: Record<string, any>;
    activeTab: string | null;
    setActiveTab: (tab: string) => void;
}

const IntegrateCard: React.FC<IntegrateCardProps> = ({ paymentGateways, activeTab, setActiveTab }) => {
    const [isNoticeVisible, setNoticeVisible] = useState(true);
    
    return (
        <Card className="rounded-lg mb-6 w-full">
            <CardHeader 
                title={__("Integrate Quill Booking, boost productivity", "quillbooking")}
                description={__("Connect Quill Booking to your tools and apps to enhance your scheduling automations.", "quillbooking")}
                icon={<IntegrationsTabIcon />} 
            />
            <Flex vertical gap={8} className="mt-6">
                <NoticeComponent
                    isNoticeVisible={isNoticeVisible}
                    setNoticeVisible={setNoticeVisible}
                />
                <Card
                    className={`w-full cursor-pointer ${activeTab === 'paypal' ? 'bg-color-secondary border-color-primary' : ''}`}
                    onClick={() => { setActiveTab('paypal'); }}
                >
                    <Flex gap={18} align="center">
                        <img src={paypal} alt='paypal.png' className='size-12' />
                        <Flex vertical gap={2}>
                            <div
                                className={`text-base font-semibold ${activeTab === 'paypal' ? 'text-color-primary' : 'text-[#3F4254]'}`}
                            >
                                {__("PayPal", "quillbooking")}
                            </div>
                            <div
                                className={`text-xs ${activeTab === 'paypal' ? 'text-color-primary' : 'text-[#9197A4]'}`}
                            >
                                {__("Collect payment before the meeting.", "quillbooking")}
                            </div>
                        </Flex>
                    </Flex>
                </Card>
                <Card
                    className={`w-full cursor-pointer ${activeTab === 'stripe' ? 'bg-color-secondary border-color-primary' : ''}`}
                    onClick={() => { setActiveTab('stripe'); }}
                >
                    <Flex gap={18} align="center">
                        <img src={stripe} alt='stripe.png' className='w-16 h-8' />
                        <Flex vertical gap={2}>
                            <div
                                className={`text-base font-semibold ${activeTab === 'stripe' ? 'text-color-primary' : 'text-[#3F4254]'}`}
                            >
                                {__("Stripe", "quillbooking")}
                            </div>
                            <div
                                className={`text-xs ${activeTab === 'stripe' ? 'text-color-primary' : 'text-[#9197A4]'}`}
                            >
                                {__("Collect payment before the meeting.", "quillbooking")}
                            </div>
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
        </Card>
    );
};

export default IntegrateCard;
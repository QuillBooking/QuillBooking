/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import IntegrateCard from './integrate-card';
import PaymentGatewayCard from './method-card';

const PaymentsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [paymentGateways, setPaymentGateways] = useState(() => ConfigAPI.getPaymentGateways());

    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0 && !activeTab) {
            setActiveTab(Object.keys(paymentGateways)[0]);
        }
    }, [paymentGateways, activeTab]);

    const activeGateway = activeTab ? paymentGateways[activeTab] : null;

    // Update gateway properties
    const updateGatewayProperty = (gatewayId: string, property: string, value: any) => {
        setPaymentGateways(prevGateways => ({
            ...prevGateways,
            [gatewayId]: {
                ...prevGateways[gatewayId],
                [property]: value
            }
        }));
    };

    // Update gateway settings
    const updateGatewaySettings = (gatewayId: string, settings: any) => {
        setPaymentGateways(prevGateways => ({
            ...prevGateways,
            [gatewayId]: {
                ...prevGateways[gatewayId],
                settings: {
                    ...prevGateways[gatewayId].settings,
                    ...settings
                }
            }
        }));
    };

    return (
        <div className="quillbooking-payment-settings grid grid-cols-2 gap-5 w-full">
            <IntegrateCard
                paymentGateways={paymentGateways}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            {activeTab && activeGateway && (
                <PaymentGatewayCard 
                    slug={activeTab} 
                    gateway={activeGateway}
                    updateGatewayProperty={(property, value) => 
                        updateGatewayProperty(activeTab, property, value)
                    }
                    updateGatewaySettings={updateGatewaySettings}
                />
            )}
        </div>
    );
};

export default PaymentsTab;
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
import { useApi } from '@quillbooking/hooks';

const PaymentsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [paymentGateways, setPaymentGateways] = useState(() => ConfigAPI.getPaymentGateways());
    const { callApi } = useApi();

    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0 && !activeTab) {
            setActiveTab(Object.keys(paymentGateways)[0]);
        }
    }, [paymentGateways, activeTab]);

    const fetchGatewaySettings = async (gatewayId: string) => {
        return new Promise((resolve) => {
            callApi({
                path: `payment-gateways/${gatewayId}`,
                method: 'GET',
                onSuccess(response) {
                    console.log('Settings loaded successfully:', response);
                    setPaymentGateways(prevGateways => ({
                        ...prevGateways,
                        [gatewayId]: {
                            ...prevGateways[gatewayId],
                            settings: response.settings || {}
                        }
                    }));
                    resolve(true);
                },
                onError(error) {
                    console.error('Error loading settings:', error);
                    // Consider adding a retry mechanism or user notification
                    resolve(false);
                }
            });
        });
    };

    // Fetch only the active gateway if set, otherwise fetch the first one
    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0) {
            const gatewayToFetch = activeTab || Object.keys(paymentGateways)[0];
            fetchGatewaySettings(gatewayToFetch);
        }
    }, [activeTab]);

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
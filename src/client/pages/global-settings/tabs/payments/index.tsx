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
    const [isLoading, setIsLoading] = useState(true);
    const { callApi } = useApi();

    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0 && !activeTab) {
            setActiveTab(Object.keys(paymentGateways)[0]);
        }
    }, [paymentGateways, activeTab]);

    const fetchGatewaySettings = async (gatewayId: string) => {
        setIsLoading(true);
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
                            settings: response.settings || {},
                            enabled: response.enabled || false
                        }
                    }));
                    setIsLoading(false);
                    resolve(true);
                },
                onError(error) {
                    setIsLoading(false);
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

        // For enabled property, we need to save it to the server
        if (property === 'enabled') {
            callApi({
                path: `payment-gateways/${gatewayId}/enabled`,
                method: 'POST',
                data: { enabled: value },
                onSuccess(response) {
                    console.log('Gateway enabled state updated successfully:', response);
                },
                onError(error) {
                    console.error('Error updating gateway enabled state:', error);
                    // Rollback the UI state change if the server update fails
                    setPaymentGateways(prevGateways => ({
                        ...prevGateways,
                        [gatewayId]: {
                            ...prevGateways[gatewayId],
                            enabled: !value // Revert to previous state
                        }
                    }));
                }
            });
        }
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
                isLoading={isLoading}
            />
            {activeTab && activeGateway && (
                <PaymentGatewayCard 
                    slug={activeTab} 
                    gateway={activeGateway}
                    updateGatewayProperty={(property, value) => 
                        updateGatewayProperty(activeTab, property, value)
                    }
                    updateGatewaySettings={updateGatewaySettings}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default PaymentsTab;
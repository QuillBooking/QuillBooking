/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';

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
    const [isLoading, setIsLoading] = useState(false);
    const { callApi } = useApi();

    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0 && !activeTab) {
            setActiveTab(Object.keys(paymentGateways)[0]);
        }
    }, [paymentGateways, activeTab]);

    const fetchGatewaySettings = useCallback(async (gatewayId: string) => {
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
    }, [callApi]);

    // Fetch gateway settings on initial load and when activeTab changes
    useEffect(() => {
        // Only fetch if we have gateways and a valid activeTab
        if (Object.keys(paymentGateways).length > 0 && activeTab) {
            // Check if we already have settings for this gateway
            const gateway = paymentGateways[activeTab];
            if (!gateway.settings) {
                fetchGatewaySettings(activeTab);
            }
        }
    }, [activeTab, paymentGateways, fetchGatewaySettings]);

    // Initial fetch on component mount for the first gateway
    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0) {
            const firstGateway = Object.keys(paymentGateways)[0];
            if (!paymentGateways[firstGateway].settings) {
                fetchGatewaySettings(firstGateway);
            }
        }
    }, []);

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
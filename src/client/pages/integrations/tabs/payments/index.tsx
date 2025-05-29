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
import { NoticeBanner } from '@quillbooking/components';
import type { NoticeMessage } from '@quillbooking/client';
import IntegrationsShimmerLoader from '../../shimmer-loader';

const PaymentsTab: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const [paymentGateways, setPaymentGateways] = useState(() =>
		ConfigAPI.getPaymentGateways()
	);
	const [isLoading, setIsLoading] = useState(false);
	const { callApi } = useApi();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	useEffect(() => {
		if (Object.keys(paymentGateways).length > 0 && !activeTab) {
			setActiveTab(Object.keys(paymentGateways)[0]);
		}
	}, [paymentGateways, activeTab]);

	const fetchGatewaySettings = useCallback(
		async (gatewayId: string, forceRefresh = false) => {
			setIsLoading(true);
			return new Promise((resolve) => {
				callApi({
					path: `payment-gateways/${gatewayId}`,
					method: 'GET',
					onSuccess(response) {
						setPaymentGateways((prevGateways) => ({
							...prevGateways,
							[gatewayId]: {
								...prevGateways[gatewayId],
								settings: response.settings || {},
								enabled: response.enabled || false,
							},
						}));
						setIsLoading(false);
						resolve(true);
					},
					onError(error) {
						setIsLoading(false);
						setNotice({
							type: 'error',
							title: __('Error', 'quillbooking'),
							message:
								error.message ||
								__(
									'Failed to load payment gateway settings',
									'quillbooking'
								),
						});
						resolve(false);
					},
				});
			});
		},
		[callApi]
	);

	const handleTabChange = useCallback(
		(newTab: string) => {
			setActiveTab(newTab);
			fetchGatewaySettings(newTab, true);
		},
		[fetchGatewaySettings]
	);

	// Initial fetch on component mount for the first gateway
	useEffect(() => {
		if (Object.keys(paymentGateways).length > 0) {
			const firstGateway = Object.keys(paymentGateways)[0];
			fetchGatewaySettings(firstGateway);
		}
	}, []);

	const activeGateway = activeTab ? paymentGateways[activeTab] : null;

	// Update gateway properties
	const updateGatewayProperty = (
		gatewayId: string,
		property: string,
		value: any
	) => {
		setPaymentGateways((prevGateways) => ({
			...prevGateways,
			[gatewayId]: {
				...prevGateways[gatewayId],
				[property]: value,
			},
		}));

		// For enabled property, we need to save it to the server
		if (property === 'enabled') {
			callApi({
				path: `payment-gateways/${gatewayId}/enabled`,
				method: 'POST',
				data: { enabled: value },
				onSuccess(response) {
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: value
							? __(
									'Payment gateway enabled successfully',
									'quillbooking'
								)
							: __(
									'Payment gateway disabled successfully',
									'quillbooking'
								),
					});
				},
				onError(error) {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message:
							error.message ||
							__(
								'Failed to update payment gateway status',
								'quillbooking'
							),
					});
					// Rollback the UI state change if the server update fails
					setPaymentGateways((prevGateways) => ({
						...prevGateways,
						[gatewayId]: {
							...prevGateways[gatewayId],
							enabled: !value, // Revert to previous state
						},
					}));
				},
			});
		}
	};

	// Update gateway settings
	const updateGatewaySettings = (gatewayId: string, settings: any) => {
		setPaymentGateways((prevGateways) => ({
			...prevGateways,
			[gatewayId]: {
				...prevGateways[gatewayId],
				settings: {
					...prevGateways[gatewayId].settings,
					...settings,
				},
			},
		}));
	};

	if (isLoading) {
		return <IntegrationsShimmerLoader />;
	}

	return (
		<div className="quillbooking-payment-settings grid grid-cols-2 gap-5 w-full">
			{notice && (
				<div className="col-span-2">
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				</div>
			)}
			<IntegrateCard
				paymentGateways={paymentGateways}
				activeTab={activeTab}
				setActiveTab={handleTabChange}
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

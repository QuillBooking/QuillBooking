/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import {
	NoticeComponent,
} from '@quillbooking/components';
// @ts-ignore
import paypal from '../../../../../../../assets/icons/paypal/paypal_vertical.png';
// @ts-ignore
import stripe from '../../../../../../../assets/icons/stripe/stripe.png';

export interface IntegrateCardProps {
	paymentGateways: Record<string, any>;
	activeTab: string | null;
	setActiveTab: (tab: string) => void;
	isLoading?: boolean;
}

const IntegrateCard: React.FC<IntegrateCardProps> = ({
	paymentGateways,
	activeTab,
	setActiveTab,
	isLoading = false,
}) => {
	// Manage notice visibility state locally since it's only used in this component
	const [isNoticeVisible, setNoticeVisible] = useState(true);

	// Define gateway images mapping
	const gatewayImages = {
		paypal: paypal,
		stripe: stripe,
	};

	return (
		<Card className="rounded-lg mb-6 w-full">
			<Flex vertical gap={15}>
				<NoticeComponent
					isNoticeVisible={isNoticeVisible}
					setNoticeVisible={setNoticeVisible}
				/>
				{isLoading ? (
					<Skeleton active paragraph={{ rows: 2 }} />
				) : (
					Object.entries(paymentGateways).map(
						([gatewayId, gateway]) => (
							<Card
								key={gatewayId}
								className={`w-full cursor-pointer ${activeTab === gatewayId ? 'bg-color-secondary border-color-primary' : ''}`}
								onClick={() => {
									if (activeTab !== gatewayId) {
										setActiveTab(gatewayId);
									}
								}}
							>
								<Flex gap={18} align="center">
									<img
										src={
											gatewayImages[
												gatewayId as keyof typeof gatewayImages
											]
										}
										alt={`${gatewayId}.png`}
										className={
											gatewayId === 'paypal'
												? 'size-12'
												: 'w-16 h-8'
										}
									/>
									<Flex vertical gap={2}>
										<div
											className={`text-base font-semibold ${activeTab === gatewayId ? 'text-color-primary' : 'text-[#3F4254]'}`}
										>
											{gateway.title ||
												__(
													gatewayId
														.charAt(0)
														.toUpperCase() +
														gatewayId.slice(1),
													'quillbooking'
												)}
										</div>
										<div
											className={`text-xs ${activeTab === gatewayId ? 'text-color-primary' : 'text-[#9197A4]'}`}
										>
											{gateway.description ||
												__(
													'Collect payment before the meeting.',
													'quillbooking'
												)}
										</div>
									</Flex>
								</Flex>
							</Card>
						)
					)
				)}
			</Flex>
		</Card>
	);
};

export default IntegrateCard;

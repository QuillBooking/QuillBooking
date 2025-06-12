/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import { Card, Flex, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
// @ts-ignore
import paypal from '@quillbooking/assets/icons/paypal/paypal_vertical.png';
// @ts-ignore
import stripe from '@quillbooking/assets/icons/stripe/stripe.png';
import type { PaymentGateway } from '@quillbooking/config';
import { ProGlobalIntegrations } from '../../../../../../components';

export interface PaymentGatewayCardProps {
	slug: string | null;
	gateway: PaymentGateway;
	updateGatewayProperty: (property: string, value: any) => void;
	updateGatewaySettings: (gatewayId: string, settings: any) => void;
	isLoading?: boolean;
}

const PaymentGatewayCard: React.FC<PaymentGatewayCardProps> = (props) => {
	const { slug, isLoading = false } = props;

	if (!slug) return null;

	// Check if we have a pro version of the component available
	const proComponent = applyFilters(
		'quillbooking.payment_gateway_card',
		null,
		props
	);

	// If pro component is available, use it
	if (proComponent) {
		return proComponent as React.ReactNode;
	}

	// Get gateway info for the free version
	const title = slug === 'paypal' ? 'PayPal' : 'Stripe';
	const logo = slug === 'paypal' ? paypal : stripe;
	const logoClass = slug === 'paypal' ? 'size-12' : 'w-16 h-8';

	// Prepare payment information for the free version
	const paymentList = {
		stripe: {
			[__('Save time and reduce no-shows:', 'quillbooking')]: [
				__(
					'Automatically collect full or partial payments at the time an event is scheduled.',
					'quillbooking'
				),
				__(
					'Allow your clients to pay with Stripe, debit, or credit card.',
					'quillbooking'
				),
			],
			[__('Requirements', 'quillbooking')]: [
				__(
					'A PayPal Business account — create an account with Stripe',
					'quillbooking'
				),
				__('A Standard Quill Booking subscription', 'quillbooking'),
			],
		},
		paypal: {
			[__('Requirements', 'quillbooking')]: [
				__('Quill Booking Pro Account.', 'quillbooking'),
				__(
					'A PayPal Business account — create an account with PayPal.',
					'quillbooking'
				),
			],
		},
	};

	return (
		<Card className="rounded-lg mb-6 w-full">
			{isLoading ? (
				<Flex vertical gap={20}>
					<Skeleton.Avatar size={64} active />
					<Skeleton active paragraph={{ rows: 4 }} />
				</Flex>
			) : (
				<>
					<Flex
						align="center"
						gap={16}
						className="p-0 text-color-primary-text border-b pb-5 mb-4"
					>
						<img
							src={logo}
							alt={`${slug}.png`}
							className={logoClass}
						/>
						<div>
							<p className="text-[#09090B] font-bold text-2xl">
								{__(title, 'quillbooking')}
							</p>
							<p className="text-[#71717A] font-medium text-sm">
								{__(`${title} Information`, 'quillbooking')}
							</p>
						</div>
					</Flex>
					<ProGlobalIntegrations list={paymentList[slug]} />
				</>
			)}
		</Card>
	);
};

export default PaymentGatewayCard;

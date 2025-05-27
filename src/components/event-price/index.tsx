/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import woocommerce from '@quillbooking/assets/icons/woocommerce/woocommerce.png';
import { PriceIcon } from '../icons';
import { PaymentsSettings } from 'client/types';

const EventPrice: React.FC<{
	payments_settings: PaymentsSettings;
	duration: number;
}> = ({ payments_settings, duration }) => {
	const [price, setPrice] = useState<number>(0);

	useEffect(() => {
		if (payments_settings.enable_items_based_on_duration) {
			setPrice(
				payments_settings.multi_duration_items[duration]?.price ?? 0
			);
			return;
		}

		if (payments_settings.enable_payment) {
			// Check if items array exists before mapping
			const totalPrice =
				payments_settings.items && payments_settings.items.length > 0
					? payments_settings.items
							.map((item) => item.price ?? 0)
							.reduce((sum, price) => sum + price, 0)
					: 0;
			setPrice(totalPrice);
			return;
		}

		// Reset price if payment is not enabled
		setPrice(0);
	}, [payments_settings, duration]);

	return (
		<Flex gap={10} className="items-center">
			<PriceIcon />
			<div className="flex flex-col">
				<span className="text-[#71717A] text-[12px]">
					{__('Price', 'quillbooking')}
				</span>
				<span className="text-[#007AFF] text-[14px] font-[500] capitalize">
					{payments_settings.enable_payment ? (
						payments_settings.type === 'native' ? (
							price !== null && price > 0 ? (
								price.toString()
							) : (
								__('Free', 'quillbooking')
							)
						) : (
							<img
								src={woocommerce}
								alt="WooCommerce"
								className="w-6 h-4"
							/>
						)
					) : (
						<span>{__('Free', 'quillbooking')}</span>
					)}
				</span>
			</div>
		</Flex>
	);
};

export default EventPrice;

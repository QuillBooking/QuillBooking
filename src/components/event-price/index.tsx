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
	const [price, setPrice] = useState<string | number>(
		__('Free', 'quillbooking')
	);

	useEffect(() => {
		if (payments_settings.enable_items_based_on_duration) {
			setPrice(payments_settings.multi_duration_items[duration]?.price);
			return;
		}

		if (payments_settings.enable_payment) {
			const totalPrice = payments_settings.items
				.map((item) => item.price)
				.reduce((sum, price) => sum + price, 0);
			setPrice(totalPrice);
			return;
		}
	}, [payments_settings]);
	return (
		<Flex gap={10} className="items-center">
			<PriceIcon />
			<div className="flex flex-col">
				<span className="text-[#71717A] text-[12px]">
					{__('Price', 'quillbooking')}
				</span>
				<span className="text-[#007AFF] text-[14px] font-[500] capitalize">
					{payments_settings.type === 'native' ? (
						price
					) : (
						<img
							src={woocommerce}
							alt="WooCommerce"
							className="w-6 h-4"
						/>
					)}
				</span>
			</div>
		</Flex>
	);
};

export default EventPrice;

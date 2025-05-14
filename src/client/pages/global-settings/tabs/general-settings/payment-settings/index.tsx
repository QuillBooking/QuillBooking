/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Checkbox, Flex, Select } from 'antd';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	GeneralSettingsPaymentIcon,
} from '@quillbooking/components';

const PaymentSettings = ({ settings, updateSettings }) => {
	const [enablePaymentModule, setEnablePaymentModule] = useState(false);
	// Currency options
	const currencyOptions = [
		{ value: 'USD', label: 'USD - US Dollar' },
		{ value: 'EUR', label: 'EUR - Euro' },
		{ value: 'GBP', label: 'GBP - British Pound' },
		{ value: 'JPY', label: 'JPY - Japanese Yen' },
		{ value: 'AUD', label: 'AUD - Australian Dollar' },
		{ value: 'CAD', label: 'CAD - Canadian Dollar' },
		{ value: 'CHF', label: 'CHF - Swiss Franc' },
		{ value: 'CNY', label: 'CNY - Chinese Yuan' },
		{ value: 'INR', label: 'INR - Indian Rupee' },
		{ value: 'BRL', label: 'BRL - Brazilian Real' },
	];

	return (
		<Card>
			<CardHeader
				title={__('Payment Settings', 'quillbooking')}
				description={__(
					'Configure your global payment settings for booking related payments',
					'quillbooking'
				)}
				icon={<GeneralSettingsPaymentIcon />}
			/>

			<Flex vertical gap={20} className="mt-4">
				<Flex vertical gap={4}>
					<div className="font-semibold text-[16px]">
						{__('Payment Module', 'quillbooking')}
					</div>
					<Checkbox
						className="custom-check text-[#3F4254] font-semibold"
						checked={enablePaymentModule}
						onChange={(e) =>
							setEnablePaymentModule(e.target.checked)
						}
					>
						{__('Enable Payment Module', 'quillbooking')}
					</Checkbox>
				</Flex>
				{enablePaymentModule && (
					<Flex vertical gap={4}>
						<div className="text-[#3F4254] font-semibold text-[16px]">
							{__('Currency', 'quillbooking')}
						</div>
						<Select
							id="currency"
							className="w-full rounded-lg h-[48px]"
							value={settings.currency}
							onChange={(value) =>
								updateSettings('currency', value)
							}
							options={currencyOptions}
						/>
					</Flex>
				)}
			</Flex>
		</Card>
	);
};

export default PaymentSettings;

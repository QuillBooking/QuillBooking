import { PaymentSettingsIcon, ProTab } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const Payments: React.FC = () => {
	return applyFilters(
		'quillbooking.event.payments_tab',
		<ProTab
			title={__('Payment Settings', 'quillbooking')}
			description={__(
				'Select Pricing Modal and your price.',
				'quillbooking'
			)}
			icon={<PaymentSettingsIcon />}
		/>
	) as React.ReactNode;
};

export default Payments;

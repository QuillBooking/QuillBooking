import { PaymentSettingsIcon, ProTab } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';

const Payments = forwardRef((props, ref) => {
	return applyFilters(
		'quillbooking.event.payments_tab',
		<ProTab
			title={__('Payment Settings', 'quillbooking')}
			description={__(
				'Select Pricing Modal and your price.',
				'quillbooking'
			)}
			icon={<PaymentSettingsIcon />}
		/>,
		props,
		ref
	) as React.ReactNode;
});

export default Payments;

import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProGlobalIntegrations } from '@quillbooking/components';

const ZapierFields = ({
	fields,
	form,
	calendar,
	handleNavigation = () => {}, // Default to a no-op function if not provided
}: {
	fields: any;
	form: any;
	calendar?: any;
	handleNavigation?: (path: string) => void;
}) => {
	const zapierList = {
		[__('Features that save you time:', 'quillbooking')]: [
			__(
				'Automate your bookings with 5000+ apps and services',
				'quillbooking'
			),
			__(
				'Connect to CRMs, email marketing tools, payment processors, and more',
				'quillbooking'
			),
			__(
				'Send booking data to other platforms automatically',
				'quillbooking'
			),
		],
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account', 'quillbooking'),
			__('Zapier account', 'quillbooking'),
		],
	};
	return applyFilters(
		'quillbooking.zapierFields',
		<ProGlobalIntegrations list={zapierList} />,
		// convert to object instead of array
		{ fields, form, calendar, handleNavigation } // Pass the additional props
	) as React.ReactNode;
};

export default ZapierFields;

import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProGlobalIntegrations } from '@quillbooking/components';

const GoogleAnalyticsFields = ({
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
	const googleAnalyticsList = {
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account.', 'quillbooking'),
			__('A Google Analytics account.', 'quillbooking'),
			__(
				'Give Quill Booking Full Access to manage Google Analytics and Tracking.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.googleAnalyticsFields',
		<ProGlobalIntegrations list={googleAnalyticsList} />,
		// convert to object instead of array
		{ fields, form, calendar, handleNavigation } // Pass the additional props
	) as React.ReactNode;
};

export default GoogleAnalyticsFields;

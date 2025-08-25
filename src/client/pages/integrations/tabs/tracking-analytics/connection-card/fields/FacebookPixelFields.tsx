import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProGlobalIntegrations } from '@quillbooking/components';

const FacebookPixelFields = ({
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
	const facebookPixelList = {
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account.', 'quillbooking'),
			__('A Facebook Pixel account.', 'quillbooking'),
			__(
				'Give Quill Booking Full Access to manage Facebook Pixel and Tracking.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.facebookPixelFields',
		<ProGlobalIntegrations list={facebookPixelList} />,
		// convert to object instead of array
		{ fields, form, calendar, handleNavigation } // Pass the additional props
	) as React.ReactNode;
};

export default FacebookPixelFields;

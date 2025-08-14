import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ProGlobalIntegrations } from '@quillbooking/components';

const ZoomFields = ({
	fields,
	form,
	calendar,
	handleNavigation = () => {}, // Default to a no-op function if not provided
	onAccountsChange = () => {},
}: {
	fields: any;
	form: any;
	calendar?: any;
	handleNavigation?: (path: string) => void;
	onAccountsChange?: (hasAccounts: boolean) => void;
}) => {
	const zoomList = {
		[__('Features that save you time:', 'quillbooking')]: [
			__(
				'Automatically create Zoom meetings at the time an event is scheduled',
				'quillbooking'
			),
			__(
				'Instantly share unique conferencing details upon confirmation.',
				'quillbooking'
			),
		],
		[__('Requirements', 'quillbooking')]: [
			__(
				'Automatically create Zoom meetings at the time an event is scheduled',
				'quillbooking'
			),
			__(
				'Instantly share unique conferencing details upon confirmation.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.zoomFields',
		<ProGlobalIntegrations list={zoomList} />,
		// convert to object instead of array
		{ fields, form, calendar, handleNavigation, onAccountsChange } // Pass the additional props
	) as React.ReactNode;
};

export default ZoomFields;

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ProGlobalIntegrations } from '@quillbooking/components';

const OutlookFields = ({
	CACHE_TIME_OPTIONS,
	form,
	calendar,
	handleNavigation,
}) => {
	const outlookList = {
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account.', 'quillbooking'),
			__('Microsoft account.', 'quillbooking'),
			__(
				'Give Quill Booking Full Access to manage Calendar and Conferencing.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.outlookFields',
		<ProGlobalIntegrations list={outlookList} />,
		{ CACHE_TIME_OPTIONS, form, calendar, handleNavigation }
	) as React.ReactNode;
};

export default OutlookFields;

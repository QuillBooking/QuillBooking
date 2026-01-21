import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProGlobalIntegrations } from '@quillbooking/components';

const GoogleFields = ({
	CACHE_TIME_OPTIONS,
	handleNavigation,
}) => {
	const googleList = {
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account.', 'quillbooking'),
			__('A Google account.', 'quillbooking'),
			__(
				'Give Quill Booking Full Access to manage Calendar and Conferencing.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.googleFields',
		<ProGlobalIntegrations list={googleList} />,
		{ CACHE_TIME_OPTIONS, handleNavigation }
	) as React.ReactNode;
};

export default GoogleFields;

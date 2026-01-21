import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProGlobalIntegrations } from '@quillbooking/components';

const AppleFields = ({
	CACHE_TIME_OPTIONS,
	handleNavigation,
}) => {
	const appleList = {
		[__('Requirements', 'quillbooking')]: [
			__('Quill Booking Pro Account.', 'quillbooking'),
			__('Apple account.', 'quillbooking'),
			__(
				'Give Quill Booking Full Access to manage Calendar.',
				'quillbooking'
			),
		],
	};
	return applyFilters(
		'quillbooking.appleFields',
		<ProGlobalIntegrations list={appleList} />,
		{ CACHE_TIME_OPTIONS, handleNavigation }
	) as React.ReactNode;
};

export default AppleFields;

import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ProGlobalIntegrations } from '@quillbooking/components';

const ZoomFields = ({
	fields,
	form,
	calendar,
}: {
	fields: any;
	form: any;
	calendar?: any;
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
		[fields, form, calendar]
	) as React.ReactNode;
};

export default ZoomFields;

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InfoIcon } from '@quillbooking/components';

interface InfoComponentProps {
	eventsNumber: number;
}

const InfoComponent: React.FC<InfoComponentProps> = ({ eventsNumber }) => {
	return (
		<div className="flex gap-2 bg-color-secondary p-2 text-color-primary border border-[#C497EC] rounded-lg">
			<InfoIcon />
			{`${eventsNumber} ${__('calendar events are using this schedule', 'quillbooking')}`}
		</div>
	);
};

export default InfoComponent;

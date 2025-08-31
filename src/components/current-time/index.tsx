/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getCurrentTimeInTimezone,
	getCurrentTimezone,
} from '@quillbooking/utils';

interface CurrentTimeInTimezoneProps
	extends React.HTMLAttributes<HTMLDivElement> {
	currentTimezone?: string;
	timeClassName?: string;
	timeFormat?: string;
}

const CurrentTimeInTimezone: React.FC<CurrentTimeInTimezoneProps> = ({
	currentTimezone,
	timeClassName,
	timeFormat = '12',
	...rest
}) => {
	return (
		<div {...rest}>
			{__('Current DateTime', 'quillbooking')}:{' '}
			<span className={timeClassName}>
				{getCurrentTimeInTimezone(
					currentTimezone || getCurrentTimezone(),
					timeFormat
				)}
			</span>
		</div>
	);
};

export default CurrentTimeInTimezone;

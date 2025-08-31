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
	timeFormat?: string;
}

const CurrentTimeInTimezone: React.FC<CurrentTimeInTimezoneProps> = ({
	currentTimezone,
	timeFormat = '12',
	...rest
}) => {
	return (
		<div {...rest}>
			{getCurrentTimeInTimezone(
				currentTimezone || getCurrentTimezone(),
				timeFormat
			)}
		</div>
	);
};

export default CurrentTimeInTimezone;

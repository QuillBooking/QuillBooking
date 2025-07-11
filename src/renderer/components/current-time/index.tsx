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
}

const CurrentTimeInTimezone: React.FC<CurrentTimeInTimezoneProps> = ({
	currentTimezone,
	...rest
}) => {
	return (
		<div {...rest}>
				{getCurrentTimeInTimezone(
					currentTimezone || getCurrentTimezone()
				)}
		</div>
	);
};

export default CurrentTimeInTimezone;

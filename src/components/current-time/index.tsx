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
}

const CurrentTimeInTimezone: React.FC<CurrentTimeInTimezoneProps> = ({
	currentTimezone,
	timeClassName,
	...rest
}) => {
	return (
		<div {...rest}>
			{__('Current DateTime', 'quillbooking')}:{' '}
			<span className={timeClassName}>
				{getCurrentTimeInTimezone(currentTimezone || getCurrentTimezone())}
			</span>
		</div>
	);
};

export default CurrentTimeInTimezone;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography } from 'antd';

/**
 * Internal dependencies
 */
import {
	getCurrentTimeInTimezone,
	getCurrentTimezone,
} from '@quillbooking/utils';

interface CurrentTimeInTimezoneProps {
	currentTimezone?: string;
}

const { Text } = Typography;
const CurrentTimeInTimezone: React.FC<CurrentTimeInTimezoneProps> = ({
	currentTimezone,
}) => {
	return (
		<Text>
			{__('Current DateTime', 'quillbooking')}:{' '}
			{getCurrentTimeInTimezone(currentTimezone || getCurrentTimezone())}
		</Text>
	);
};

export default CurrentTimeInTimezone;

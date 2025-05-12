/**
 * External dependencies
 */
// import Select from 'react-select';
import { Select, SelectProps } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import { getCurrentTimezone } from '../../utils';

interface TimezoneSelectProps extends SelectProps {
	value: string | null;
	onChange: (value: string) => void;
}

/**
 * Timezone Select Component.
 */
const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange, ...rest }) => {
	const timezones = ConfigAPI.getTimezones();

	const options = map(timezones, (label, val) => ({
		label,
		value: val,
	}));

	return (
		<Select<string>
			size="large"
			value={value ?? getCurrentTimezone()}
			onChange={(newVal) => onChange(newVal)}
			options={options}
			{...rest}
			className='h-[48px] rounded-lg'
			getPopupContainer={(trigger) => trigger.parentElement}
		/>
	);
};

export default TimezoneSelect;

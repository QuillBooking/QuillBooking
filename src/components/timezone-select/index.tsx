/**
 * External dependencies
 */
// import Select from 'react-select';
import { Select } from 'antd';
import { map, isObject } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';

interface TimezoneSelectProps {
	value: string | null;
	onChange: (value: string) => void;
}

/**
 * Timezone Select Component.
 */
const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange }) => {
	const timezones = ConfigAPI.getTimezones();

	return (
		<Select
            size='large'
			value={value ? { label: timezones[value], value } : null}
			onChange={(selected) => {
				if (selected && isObject(selected)) {
					onChange(selected.value);
				}
			}}
			options={map(timezones, (label, value) => ({ label, value }))}
		/>
	);
};

export default TimezoneSelect;

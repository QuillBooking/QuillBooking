/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Calendar } from 'client/types';

/**
 * Internal dependencies
 */
import { useState } from '@wordpress/element';
import HostAvailability from './host-availability';
import HostData from './host-data';

interface HostCalendarProps {
	formData: Partial<Calendar & { members: number[] }>;
	updateFormData: (
		key: keyof HostCalendarProps['formData'],
		value: any
	) => void;
	excludedUsers: number[];
	open: boolean;
	loading: boolean;
	closeHandler: () => void;
	saveCalendar: () => void;
	validateHost: () => boolean;
}

const HostCalendar: React.FC<HostCalendarProps> = ({
	formData,
	updateFormData,
	excludedUsers,
	open,
	closeHandler,
	loading,
	saveCalendar,
	validateHost
}) => {
	const [showAvailbility, setShowAvailability] = useState(false);
	return (
		<>
			{showAvailbility ? (
				<HostAvailability
					closeHandler={closeHandler}
					loading={loading}
					open={open}
					formData={formData}
					saveCalendar={saveCalendar}
					updateFormData={updateFormData}
				/>
			) : (
				<HostData
					closeHandler={closeHandler}
					loading={loading}
					open={open}
					formData={formData}
					excludedUsers={excludedUsers}
					setShowAvailability={setShowAvailability}
					updateFormData={updateFormData}
					validateHost={validateHost}
				/>
			)}
		</>
	);
};

export default HostCalendar;

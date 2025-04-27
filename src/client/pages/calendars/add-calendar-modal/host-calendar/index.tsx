/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Availability, Calendar } from 'client/types';

/**
 * Internal dependencies
 */
import { useState } from '@wordpress/element';
import HostAvailability from './host-availability';
import HostData from './host-data';

interface CalendarWithAvailability extends Calendar {
	availability: Availability;
}

interface HostCalendarProps {
	formData: Partial<CalendarWithAvailability & { members: number[] }>;
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
			{!showAvailbility ? (
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
			) : (
			<HostAvailability
				closeHandler={closeHandler}
				loading={loading}
				open={open}
				formData={formData}
				saveCalendar={saveCalendar}
				updateFormData={updateFormData}
			/>
			)}
		</>
	);
};

export default HostCalendar;

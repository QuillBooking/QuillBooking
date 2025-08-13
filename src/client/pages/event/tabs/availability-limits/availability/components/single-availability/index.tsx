import { __ } from '@wordpress/i18n';
import SelectSchedule from '../../select-schedule';
import { Availability } from '../../../../../../..';

const SingleAvailability = ({ availability, hosts, onAvailabilityChange }) => {
	return (
		<>
			<SelectSchedule
				availability={availability as Availability}
				hosts={hosts || []}
				onAvailabilityChange={onAvailabilityChange}
				title={__('Which Schedule Do You Want to Use?', 'quillbooking')}
			/>
			<p className="text-[#71717A] text-[14px] py-2">
				{__(
					'Changing the availability here will affect the original availability settings. If you wish to set a separate schedule, please select the Custom Availability option.',
					'quillbooking'
				)}
			</p>
		</>
	);
};

export default SingleAvailability;

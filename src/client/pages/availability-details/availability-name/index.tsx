import { __ } from '@wordpress/i18n';
import { Input, Switch } from 'antd';
import { Availability } from '@quillbooking/types';

interface AvailabilityNameProps {
	availabilityName: string;
	setAvailabilityName: (name: string) => void;
	handleNameUpdate: (name: string) => void;
	setDefault: (availability: Availability) => void;
	availabilityDetails: Availability;
}
const AvailabilityName: React.FC<AvailabilityNameProps> = ({
	availabilityName,
	setAvailabilityName,
	handleNameUpdate,
	setDefault,
	availabilityDetails,
}) => {
	return (
		<>
			<label className="font-normal text-sm">
				<div className="pb-1">
					{__('Availability Name', 'quillbooking')}
					<span className="text-[#EF4444]">*</span>
				</div>
				<Input
					size="large"
					value={availabilityName}
					onChange={(e) => setAvailabilityName(e.target.value)}
					onBlur={() => handleNameUpdate(availabilityName)}
					placeholder={__(
						'Enter a name for the availability',
						'quillbooking'
					)}
				/>
			</label>

			<div className="flex justify-end">
				<div className="flex gap-2 items-center pt-4">
					<Switch
						checked={availabilityDetails.is_default}
						onChange={() => {
							setDefault(availabilityDetails as Availability);
						}}
						className={
							availabilityDetails.is_default
								? 'bg-color-primary'
								: 'bg-gray-400'
						}
					/>
					<p className="text-color-primary-text font-bold">
						{__('Set as Default', 'quillbooking')}
					</p>
				</div>
			</div>
		</>
	);
};

export default AvailabilityName;

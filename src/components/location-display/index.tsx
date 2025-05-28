import { BookingLocation } from 'client/types';
import './style.scss';

const LocationDisplay: React.FC<{ location: BookingLocation }> = ({
	location,
}) => {
	return (
		<>
			{['online', 'zoom', 'ms-teams', 'google-meet'].includes(
				location['type']
			) ? (
				<a
					href={location['value']}
					target="_blank"
					rel="noopener noreferrer"
					className="link"
				>
					{location['label']}
				</a>
			) : (
				<>
					{location['label']} {': '}
					{location['value']}
				</>
			)}
		</>
	);
};

export default LocationDisplay;

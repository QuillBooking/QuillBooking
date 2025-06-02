import { ProIcon } from '@quillbooking/components';
import { __ } from '@wordpress/i18n';
import { Link } from 'react-router';

const ProVersion: React.FC = ({}) => {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="bg-[#F1E0FF] rounded-lg p-2 flex items-center justify-center">
				<ProIcon width={48} height={48} />
			</div>
			<div>
				<h2 className="text-2xl font-bold my-1">
					{__(
						'This feature is available in Pro Version',
						'quillbooking'
					)}
				</h2>
				<p className="text-gray-600 mb-4 text-base">
					{__(
						'Please upgrade to get all the advanced features.',
						'quillbooking'
					)}
				</p>
				<div className="mt-5">
					<Link
						className="bg-color-primary text-white rounded-lg p-3 text-lg font-[600]"
						to="/"
					>
						{__('Upgrade Pro Now', 'quillbooking')}
					</Link>
				</div>
			</div>
		</div>
	);
};

export default ProVersion;

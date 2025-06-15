import { ProIcon } from '@quillbooking/components';
import { __ } from '@wordpress/i18n';
import { ACTIVE_PRO_URL } from '../../constants';

const ProVersion: React.FC = ({}) => {
	return (
		<div className="flex flex-col items-center text-center py-10">
			<div className="bg-[#F1E0FF] rounded-lg p-2 mb-2 flex items-center justify-center">
				<ProIcon width={48} height={48} />
			</div>
			<div>
				<h2 className="text-base font-semibold my-1 text-[#3F4254]">
					{__(
						'This feature is available in Pro Version',
						'quillbooking'
					)}
				</h2>
				<p className="text-[#9197A4] mb-4 text-xs">
					{__(
						'Please upgrade to get all the advanced features.',
						'quillbooking'
					)}
				</p>
				<div className="mt-5">
					<a
						className="bg-color-primary text-[#FBF9FC] rounded-lg py-3 px-4 font-medium"
						href={ACTIVE_PRO_URL}
						rel="noopener noreferrer"
					>
						{__('Upgrade To Pro Now', 'quillbooking')}
					</a>
				</div>
			</div>
		</div>
	);
};

export default ProVersion;

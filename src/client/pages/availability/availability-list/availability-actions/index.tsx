/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Popconfirm } from 'antd';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import { NavLink as Link } from '@quillbooking/navigation';
import {
	CopyWhiteIcon,
	EditAvailabilityIcon,
	TrashIcon,
} from '@quillbooking/components';

interface AvailabilityActionsProps {
	availabilityId: string;
	availabilities: Partial<Availability>[];
	setAvailabilities: (availabilities: Partial<Availability>[]) => void;
}
const AvailabilityActions: React.FC<AvailabilityActionsProps> = ({
	availabilityId,
	availabilities,
	setAvailabilities,
}) => {
	const navigate = useNavigate();
	const { successNotice, errorNotice } = useNotice();
	const { callApi } = useApi();

	const deleteAvailability = async (availabilityId: string) => {
		await callApi({
			path: `availabilities/${availabilityId}`,
			method: 'DELETE',
			onSuccess: () => {
				const updatedAvailability = filter(
					availabilities,
					(a) => a.id !== availabilityId
				);
				setAvailabilities(updatedAvailability);
				successNotice(__('Calendar deleted', 'quillbooking'));
			},
			onError: () => {
				errorNotice(__('Failed to delete calendar', 'quillbooking'));
			},
		});
	};

	const setCloneCalendar = async (availabilityId: string) => {
		await callApi({
			path: `availabilities/${availabilityId}/clone`,
			method: 'POST',
			onSuccess: (data) => {
				navigate(`availability/${data.id}`);
				successNotice(__('Calendar duplicated', 'quillbooking'));
			},
			onError: () => {
				errorNotice(__('Failed to duplicate calendar', 'quillbooking'));
			},
		});
	};

	return (
		<Flex gap={10} align="center">
			<Link to={`availability/${availabilityId}`}>
				<div className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer">
					<EditAvailabilityIcon width={20} height={20} />
				</div>
			</Link>

			<div
				className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer"
				onClick={() => setCloneCalendar(availabilityId)}
			>
				<CopyWhiteIcon width={21} height={21} />
			</div>

			<Popconfirm
				title={__(
					'Are you sure to delete this calendar?',
					'quillbooking'
				)}
				onConfirm={() => deleteAvailability(availabilityId)}
				okText={__('Yes', 'quillbooking')}
				cancelText={__('No', 'quillbooking')}
			>
				<div className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer text-[#B3261E]">
					<TrashIcon width={20} height={22} />
				</div>
			</Popconfirm>
		</Flex>
	);
};

export default AvailabilityActions;

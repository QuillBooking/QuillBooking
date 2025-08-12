/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex } from 'antd';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi, useNavigate } from '@quillbooking/hooks';
import { NavLink as Link } from '@quillbooking/navigation';
import {
	ConfirmationModal,
	CopyWhiteIcon,
	EditAvailabilityIcon,
	TrashIcon,
} from '@quillbooking/components';
import { useState } from '@wordpress/element';

interface AvailabilityActionsProps {
	availabilityId: string;
	availabilities: Partial<Availability>[];
	setAvailabilities: (availabilities: Partial<Availability>[]) => void;
	isAvailabilityDefault: boolean;
	eventsCount: number;
	setNotice: (
		notice: {
			type: 'success' | 'error';
			title: string;
			message: string;
		} | null
	) => void;
}

const AvailabilityActions: React.FC<AvailabilityActionsProps> = ({
	availabilityId,
	availabilities,
	setAvailabilities,
	isAvailabilityDefault,
	eventsCount,
	setNotice,
}) => {
	const navigate = useNavigate();
	const { callApi } = useApi();
	const [showConfirmation, setShowConfirmation] = useState(false);

	const deleteAvailability = async (availabilityId: string) => {
		try {
			if (isAvailabilityDefault) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __(
						'You cannot delete the default availability. Please set another availability as default first.',
						'quillbooking'
					),
				});
				return;
			}

			await callApi({
				path: `availabilities/${availabilityId}`,
				method: 'DELETE',
				onSuccess: () => {
					const updatedAvailability = filter(
						availabilities,
						(a) => a.id !== availabilityId
					);
					setAvailabilities(updatedAvailability);
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __(
							'Availability deleted successfully',
							'quillbooking'
						),
					});
				},
				onError: () => {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: __(
							'Failed to delete availability',
							'quillbooking'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error in deleteAvailability:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'An unexpected error occurred while deleting the availability',
					'quillbooking'
				),
			});
		}
	};

	const setCloneAvailability = async (availabilityId: string) => {
		try {
			await callApi({
				path: `availabilities/${availabilityId}/clone`,
				method: 'POST',
				onSuccess: (data) => {
					navigate(`availability/${data.id}`);
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __(
							'Availability duplicated successfully',
							'quillbooking'
						),
					});
				},
				onError: () => {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: __(
							'Failed to duplicate availability',
							'quillbooking'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error in setCloneAvailability:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'An unexpected error occurred while duplicating the availability',
					'quillbooking'
				),
			});
		}
	};

	const getTitle = () => {
		if (eventsCount > 0) {
			return __(
				'This availability is used by some events and can not be deleted',
				'quillbooking'
			);
		}

		if (isAvailabilityDefault) {
			return __(
				'You cannot delete the default availability. Please set another availability as default first.',
				'quillbooking'
			);
		}

		return __(
			'Are you sure you want to delete this availability?',
			'quillbooking'
		);
	};

	const getDescription = () => {
		if (eventsCount > 0 || isAvailabilityDefault) {
			return '';
		}

		return __(
			"By deleting this availability you won't be able to restore it again!",
			'quillbooking'
		);
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
				onClick={() => setCloneAvailability(availabilityId)}
			>
				<CopyWhiteIcon width={21} height={21} />
			</div>

			<div
				className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer text-[#B3261E]"
				onClick={() => setShowConfirmation(true)}
			>
				<TrashIcon width={20} height={22} />
			</div>

			<ConfirmationModal
				title={getTitle()}
				description={getDescription()}
				onSave={() => deleteAvailability(availabilityId)}
				showModal={showConfirmation}
				setShowModal={setShowConfirmation}
				isSaveBtnDisabled={eventsCount > 0 || isAvailabilityDefault}
			/>
		</Flex>
	);
};

export default AvailabilityActions;

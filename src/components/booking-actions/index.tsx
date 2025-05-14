/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Flex, Input, Modal, Popover } from 'antd';

/**
 * Internal dependencies
 */
import { useApi } from '@quillbooking/hooks';
import type { Booking, NoticeMessage } from '@quillbooking/client';
import { useState } from '@wordpress/element';
import AddBookingModal from '../../client/pages/bookings/add-booking-modal';
import {
	CancelIcon,
	CancelledCalendarIcon,
	EmailConfirmIcon,
	MarkIcon,
	RebookIcon,
	ResechduleIcon,
	SquareEditIcon,
	TrashIcon,
} from '@quillbooking/components';

const Actions = {
	email: {
		label: 'Send Confirmation Email',
		action: 'send_confirmation_email',
		icon: <EmailConfirmIcon />,
	},
	rebook: {
		label: 'Rebook',
		action: 'rebook',
		icon: <RebookIcon />,
	},
	reschedule: {
		label: 'Reschedule',
		action: 'reschedule',
		icon: <ResechduleIcon />,
	},
	cancel: {
		label: 'Cancel',
		action: 'cancel',
		icon: <CancelIcon />,
		// No confirmation here since modal will be used
	},
	delete: {
		label: 'Delete',
		action: 'delete',
		icon: <TrashIcon />,
		// No confirmation here since modal will be used
	},
	completed: {
		label: 'Mark As Completed',
		action: 'mark_as_completed',
		icon: <MarkIcon />,
	},
};

const statues = {
	completed: ['delete', 'rebook'],
	cancelled: ['delete', 'rebook'],
	pending: ['cancel', 'delete', 'rebook', 'reschedule', 'completed'],
	scheduled: [
		'cancel',
		'delete',
		'rebook',
		'reschedule',
		'completed',
		'email',
	],
};

interface BookingActionsProps {
	booking: Booking;
	type: 'popover' | 'button';
	onStatusUpdated: (action?: string) => void;
	onNotice: (notice: NoticeMessage) => void;
}

const { TextArea } = Input;

const BookingActions: React.FC<BookingActionsProps> = ({
	booking,
	onStatusUpdated,
	type,
	onNotice,
}) => {
	const { callApi } = useApi();

	// State to handle modals
	const [cancelModalVisible, setCancelModalVisible] =
		useState<boolean>(false);
	const [deleteModalVisible, setDeleteModalVisible] =
		useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);
	const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
	const [cancelReason, setCancelReason] = useState<string>('');

	// API calls
	const updateStatus = async (status: string, reason?: string) => {
		const data = reason
			? { status, cancellation_reason: reason }
			: { status };
		callApi({
			path: `bookings/${booking.id}`,
			method: 'PUT',
			data,
			onSuccess: () => {
				onNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __('Booking status updated successfully', 'quillbooking'),
				});
				onStatusUpdated();
			},
		});
	};

	const deleteBooking = async () => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'DELETE',
			onSuccess: () => {
				onNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __('Booking deleted successfully', 'quillbooking'),
				});
				onStatusUpdated('delete');
			},
		});
	};

	// Handlers for opening modals
	const handleCancelClick = () => {
		setCancelModalVisible(true);
		setPopoverVisible(false);
	};

	const handleDeleteClick = () => {
		setDeleteModalVisible(true);
		setPopoverVisible(false);
	};

	const rebook = async () => {
		setOpen(true);
		setPopoverVisible(false);
	};

	const sendConfirmationEmail = async () => {
		// implement sending confirmation email logic here
	};

	// Action Handlers
	const actionHandlers: Record<string, () => void> = {
		send_confirmation_email: sendConfirmationEmail,
		rebook: rebook,
		reschedule: () => {
			// implement reschedule logic here
		},
		// Open modals for cancel and delete
		cancel: handleCancelClick,
		delete: handleDeleteClick,
		mark_as_completed: () => {
			updateStatus('completed');
			onStatusUpdated('mark_as_completed');
		},
	};

	// Function to render each action button
	const renderActionButton = (actionKey: string, type?: string) => {
		const action = Actions[actionKey];
		const style = {
			email: 'bg-color-primary text-white border-color-primary',
			completed: 'bg-[#0EA473] text-white border-color-[#0EA473]',
			reschedule: 'bg-[#ECECEC] text-color-primary-text border-[#7C7C7C]',
			rebook: 'bg-[#5F5959] text-white border-[#5F5959]',
			delete: 'bg-white text-[#B3261E] border-[#B3261E]',
			cancel: 'bg-white text-[#EF4444] border-[#EF4444]',
		};
		const handler = actionHandlers[action.action];

		return type === 'popover' ? (
			<div
				className="w-full flex items-center cursor-pointer hover:bg-[#F0F0F0] p-1 rounded gap-2 px-3"
				key={action.action}
				onClick={() => {
					// For actions with modals, do nothing extra here
					if (
						action.action === 'cancel' ||
						action.action === 'delete'
					) {
						handler && handler();
					} else {
						handler && handler();
					}
				}}
			>
				{action.icon}
				{action.label}
			</div>
		) : (
			<div
				className={`flex align-middle gap-2 py-2 px-4 cursor-pointer rounded-lg border ${style[actionKey]}`}
				key={action.action}
				onClick={() => {
					// For actions with modals, do nothing extra here
					if (
						action.action === 'cancel' ||
						action.action === 'delete'
					) {
						handler && handler();
					} else {
						handler && handler();
					}
				}}
			>
				{action.icon}
				{action.label}
			</div>
		);
	};

	return (
		<>
			{type === 'button' && (
				<Flex gap={10} align="center" className="flex-nowrap">
					{statues[booking.status].map((actionKey) =>
						renderActionButton(actionKey)
					)}
				</Flex>
			)}

			{type === 'popover' && (
				<Popover
					trigger={['click']}
					content={
						<Flex vertical gap={10} align="start" justify="start">
							{statues[booking.status].map((actionKey) =>
								renderActionButton(actionKey, type)
							)}
						</Flex>
					}
					onOpenChange={(visible) => setPopoverVisible(visible)}
					open={popoverVisible}
				>
					<Button
						icon={<SquareEditIcon width={13} height={13} />}
						className="quillbooking-edit-button bg-[#ACACAC] text-white px-2"
					>
						{__('Edit', 'quillbooking')}
					</Button>
				</Popover>
			)}

			{open && (
				<AddBookingModal
					booking={booking}
					onClose={() => {
						setOpen(false);
					}}
					onSaved={() => {
						setOpen(false);
						onStatusUpdated();
					}}
					open={open}
				/>
			)}

			{/* Cancel Booking Modal */}
			<Modal
				footer={null}
				closable={false}
				getContainer={false}
				title={
					<div className="gap-2">
						<div className="flex flex-col justify-center items-center mb-4">
							<div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg">
								<CancelledCalendarIcon width={56} height={56} />
							</div>
						</div>
						<p className="text-center text-color-primary-text text-xl font-bold">
							{__(
								'Are you sure you want to cancel this booking?',
								'quillbooking'
							)}
						</p>
						<p className="text-center text-[#71717A] font-normal">
							{__(
								"by cancelling this booking you won't be able to restore it again!",
								'quillbooking'
							)}
						</p>
					</div>
				}
				open={cancelModalVisible}
			>
				<div>
					<label htmlFor="cancelReason">
						{__('Reason for cancellation', 'quillbooking')}
						<span className="text-[#EF4444]">*</span>
					</label>

					<TextArea
						className="rounded-xl"
						id="cancelReason"
						placeholder={__('Type your reason', 'quillbooking')}
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						rows={3}
					/>

					<div className="flex justify-between gap-2 mt-4">
						<Button
							size="large"
							className="border border-[#71717A] text-[#71717A] w-1/2"
							onClick={() => {
								setCancelModalVisible(false);
								setCancelReason('');
							}}
						>
							{__('Back', 'quillbooking')}
						</Button>
						<Button
							disabled={!cancelReason.trim()}
							size="large"
							className="text-white bg-[#EF4444] w-1/2"
							onClick={() => {
								updateStatus('cancelled', cancelReason);
								setCancelModalVisible(false);
								setCancelReason('');
							}}
						>
							{__('Yes, Cancel', 'quillbooking')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Delete Booking Modal */}
			<Modal
				footer={null}
				closable={false}
				getContainer={false}
				title={
					<div className="gap-2">
						<div className="flex flex-col justify-center items-center mb-4">
							<div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg">
								<TrashIcon width={56} height={56} />
							</div>
						</div>
						<p className="text-center text-color-primary-text text-xl font-bold">
							{__(
								'Are you sure you want to delete this booking?',
								'quillbooking'
							)}
						</p>
						<p className="text-center text-[#71717A] font-normal">
							{__(
								"by Delete this booking you won't be able to restore it again!",
								'quillbooking'
							)}
						</p>
					</div>
				}
				open={deleteModalVisible}
			>
				<div className="flex justify-between gap-2 mt-4">
					<Button
						size="large"
						className="border border-[#71717A] text-[#71717A] w-1/2"
						onClick={() => {
							setDeleteModalVisible(false);
						}}
					>
						{__('Back', 'quillbooking')}
					</Button>
					<Button
						size="large"
						className="text-white bg-[#EF4444] w-1/2"
						onClick={() => {
							deleteBooking();
							setDeleteModalVisible(false);
						}}
					>
						{__('Yes, Delete', 'quillbooking')}
					</Button>
				</div>
			</Modal>
		</>
	);
};

export default BookingActions;

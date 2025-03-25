/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Flex, Popconfirm, Popover } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import type { Booking } from '@quillbooking/client';
import { useState } from '@wordpress/element';
import AddBookingModal from '../../add-booking-modal';
import {
	CancelIcon,
	EmailIcon,
	MarkIcon,
	RebookIcon,
	ResechduleIcon,
	SquareEditIcon,
	TrashIcon,
} from '@quillbooking/components';

/*
 * Main Booking Details Component
 */
const Actions = {
	email: {
		label: 'Send Confirmation Email',
		action: 'send_confirmation_email',
		icon: <EmailIcon />,
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
		confirmation: {
			title: __('Are you sure to cancel', 'quillbooking'),
			okText: __('Yes', 'quillbooking'),
			cancelText: __('No', 'quillbooking'),
		},
	},
	delete: {
		label: 'Delete',
		action: 'delete',
		icon: <TrashIcon />,
		confirmation: {
			title: __('Are you sure to delete this booking?', 'quillbooking'),
			okText: __('Yes', 'quillbooking'),
			cancelText: __('No', 'quillbooking'),
		},
	},
	completed: {
		label: 'Mark As Completed',
		action: 'mark_as_completed',
		icon: <MarkIcon />,
	},
};

const statues = {
	completed: ['email', 'rebook', 'reschedule', 'cancel', 'delete'],
	cancelled: ['rebook', 'delete'],
	pending: ['completed', 'rebook', 'reschedule', 'cancel', 'delete'],
	scheduled: [
		'email',
		'completed',
		'rebook',
		'reschedule',
		'cancel',
		'delete',
	],
};

interface BookingActionsProps {
	booking: Booking;
	onStatusUpdated: () => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({
	booking,
	onStatusUpdated,
}) => {
	const { callApi } = useApi();
	const [open, setOpen] = useState<boolean>(false);
	const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
	const { successNotice } = useNotice();
	const updateStatus = async (status: string) => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'PUT',
			data: { status },
			onSuccess: () => {
				successNotice(
					__('Booking status updated successfully', 'quillbooking')
				);
				onStatusUpdated();
			},
		});
	};

	const deleteBooking = async () => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'DELETE',
			onSuccess: () => {
				successNotice(
					__('Booking deleted successfully', 'quillbooking')
				);
				onStatusUpdated();
			},
		});
	};

	const rebook = async () => {
		setOpen(true);
		setPopoverVisible(false);
	};

	const sendConfirmationEmail = async () => {
		// implement sending confirmation email logic here
	};

	const actionHandlers: Record<string, () => void> = {
		send_confirmation_email: sendConfirmationEmail,
		rebook: rebook,
		reschedule: () => {
			// implement reschedule logic here
		},
		cancel: () => updateStatus('cancelled'),
		delete: deleteBooking,
		mark_as_completed: () => updateStatus('completed'),
	};

	return (
		<>
			<Popover
				trigger={['click']}
				content={
					<Flex vertical gap={10} align="start" justify="start">
						{statues[booking.status].map((actionKey) => {
							const action = Actions[actionKey];
							const handler = actionHandlers[action.action];

							// Create the base button element
							const buttonElement = (
								<div
									className="w-full flex items-center cursor-pointer hover:bg-[#F0F0F0] p-1 rounded"
									key={action.action}
									onClick={() => {
										// If no confirmation is needed, call the handler immediately
										if (!action.confirmation) {
											handler && handler();
										}
									}}
								>
									{action.icon}
									<span className="ml-2">{action.label}</span>
								</div>
							);

							// Wrap with Popconfirm if confirmation is required
							return action.confirmation ? (
								<Popconfirm
									key={action.action}
									title={action.confirmation.title}
									onConfirm={handler}
									okText={action.confirmation.okText}
									cancelText={action.confirmation.cancelText}
								>
									{buttonElement}
								</Popconfirm>
							) : (
								buttonElement
							);
						})}
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
			{open && (
				<AddBookingModal
					booking={booking}
					onClose={() => setOpen(false)}
					onSaved={() => setOpen(false)}
					open={open}
				/>
			)}
		</>
	);
};

export default BookingActions;

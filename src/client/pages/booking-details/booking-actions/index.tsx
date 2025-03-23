/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Flex, Popconfirm, Popover } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNavigate } from '@quillbooking/hooks';
import type { Booking } from '@quillbooking/client';
import { useState } from '@wordpress/element';
import AddBookingModal from '../../bookings/add-booking-modal';

/*
 * Main Booking Details Component
 */
const Actions = {
	email: {
		label: 'Send Confirmation Email',
		action: 'send_confirmation_email',
		icon: <SettingOutlined />,
	},
	rebook: {
		label: 'Rebook',
		action: 'rebook',
		icon: <SettingOutlined />,
	},
	reschedule: {
		label: 'Reschedule',
		action: 'reschedule',
		icon: <SettingOutlined />,
	},
	cancel: {
		label: 'Cancel',
		action: 'cancel',
		icon: <SettingOutlined />,
		confirmation: {
			title: __('Are you sure to cancel', 'quillbooking'),
			okText: __('Yes', 'quillbooking'),
			cancelText: __('No', 'quillbooking'),
		},
	},
	delete: {
		label: 'Delete',
		action: 'delete',
		icon: <SettingOutlined />,
		confirmation: {
			title: __('Are you sure to delete this booking?', 'quillbooking'),
			okText: __('Yes', 'quillbooking'),
			cancelText: __('No', 'quillbooking'),
		},
	},
	completed: {
		label: 'Mark As Completed',
		action: 'mark_as_completed',
		icon: <SettingOutlined />,
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
	onStatusUpdated?: () => void;

}

const BookingActions: React.FC<BookingActionsProps> = ({
	booking,
	onStatusUpdated,
}) => {
	const { callApi } = useApi();
	const [open, setOpen] = useState<boolean>(false);
	const navigate = useNavigate();

	const updateStatus = async (status: string) => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'PUT',
			data: { status },
			onSuccess: () => {
				if (onStatusUpdated) {
					onStatusUpdated();
				}
			},
		});
	};

	const deleteBooking = async () => {
		callApi({
			path: `bookings/${booking.id}`,
			method: 'DELETE',
			onSuccess: () => {
				navigate('bookings');
			},
		});
	};

	const rebook = async () => {
		setOpen(true);
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
				<Flex vertical gap={10}>
					{statues[booking.status].map((actionKey) => {
						const action = Actions[actionKey];
						const handler = actionHandlers[action.action];

						// Create the base button element
						const buttonElement = (
							<Button
								key={action.action}
								type="text"
								icon={action.icon}
								onClick={() => {
									// If no confirmation is needed, call the handler immediately
									if (!action.confirmation) {
										handler && handler();
									}
								}}
							>
								{action.label}
							</Button>
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
		>
			<Button icon={<SettingOutlined />} />
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

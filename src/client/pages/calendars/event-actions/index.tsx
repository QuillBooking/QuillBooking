/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Button, Flex, Modal } from 'antd';
/**
 * Internal dependencies
 */
import {
	EditIcon,
	DisableIcon,
	CloneIcon,
	TrashIcon,
	CalendarDeleteIcon,
	CalendarDisableIcon,
} from '@quillbooking/components';
import type { Event } from '@quillbooking/client';
import { useApi, useNavigate, useNotice } from '@quillbooking/hooks';

// Define the props type
interface EventActionsProps {
	event: Partial<Event>; // Ensure this matches your actual event type
	calendarId: number;
	isDisabled: boolean;
	updateCalendarEvents: () => void;
	setDisabledEvents: (eventId: number | undefined, disabled: boolean) => void;
	setStatusMessage: (message: boolean) => void;
	onActionComplete: () => void; // New prop for closing the popover
}

const EventActions: React.FC<EventActionsProps> = ({
	event,
	calendarId,
	isDisabled,
	updateCalendarEvents,
	setDisabledEvents,
	setStatusMessage,
	onActionComplete,
}) => {
	const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
	const [isModalDisableOpen, setIsModalDisableOpen] = useState(false);

	const { callApi } = useApi();
	const { successNotice, errorNotice } = useNotice();
	const navigate = useNavigate();

	const showDisableModal = () => {
		setIsModalDisableOpen(true);
	};

	const handleDisable = (status: boolean) => {
		callApi({
			path: `events/${event.id}/disable-status`,
			method: 'PUT',
			data: {
				status,
			},
			onSuccess: () => {
				successNotice(
					isDisabled
						? __('Event enabled successfully', 'quillbooking')
						: __('Event disabled successfully', 'quillbooking')
				);
				// Update the disabled state for this event
				setDisabledEvents(event.id, !isDisabled);
				
				if (!isDisabled) {
					setStatusMessage(true);
				}
				else {
					setStatusMessage(false);
				}
				// Close the popover after action is completed
				onActionComplete();
			},
			onError: (error) => {
				errorNotice(error.message);
				// Close the popover even on error
				onActionComplete();
			},
		});

		setIsModalDisableOpen(false);
	};

	const handleDisableCancel = () => {
		setIsModalDisableOpen(false);
	};

	const showDeleteModal = () => {
		setIsModalDeleteOpen(true);
	};

	const handleDelete = () => {
		callApi({
			path: `events/${event.id}`,
			method: 'DELETE',
			onSuccess: () => {
				updateCalendarEvents();
				successNotice(__('Event deleted successfully', 'quillbooking'));
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
		setIsModalDeleteOpen(false);
	};

	const handleDeleteCancel = () => {
		setIsModalDeleteOpen(false);
	};

	const handleClone = () => {
		callApi({
			path: `events/duplicate`,
			method: 'POST',
			data: { id: event.id },
			onSuccess: () => {
				updateCalendarEvents();
				successNotice(
					__('Event duplicated successfully', 'quillbooking')
				);
				// Close the popover after action is completed
				onActionComplete();
			},
			onError: (error) => {
				errorNotice(error.message);
				// Close the popover even on error
				onActionComplete();
			},
		});
	}

	const handleEdit = () => {
		// Close popover before navigation
		navigate(`calendars/${calendarId}/events/${event.id}`);
	};

	return (
		<Flex vertical gap={10} className="items-start text-color-primary-text">
			<Button
				type="text"
				icon={<EditIcon />}
				onClick={handleEdit}
				className="w-full flex justify-start"
			>
				{__('Edit', 'quillbooking')}
			</Button>

			<Button
				type="text"
				onClick={showDisableModal}
				icon={<DisableIcon />}
				className="w-full flex justify-start"
			>
				{isDisabled
					? __('Enable', 'quillbooking')
					: __('Disable', 'quillbooking')}
			</Button>

			<Button type="text" icon={<CloneIcon />} onClick={() => handleClone()} className="w-full flex justify-start">
				{__('Clone Events', 'quillbooking')}
			</Button>
			<Button type="text" icon={<TrashIcon />} onClick={showDeleteModal} className="w-full flex justify-start">
				{__('Delete', 'quillbooking')}
			</Button>
			<Modal
				open={isModalDeleteOpen}
				onOk={handleDelete}
				onCancel={handleDeleteCancel}
				okText={__('Yes', 'quillbooking')}
				cancelText={__('No', 'quillbooking')}
				footer={[
					<Flex
						className="w-full mt-5 items-center justify-center"
						gap={10}
						key="footer"
					>
						<Button
							key="cancel"
							onClick={handleDeleteCancel}
							className="border rounded-lg text-[#71717A] font-semibold w-full"
						>
							{__('Back', 'quillbooking')}
						</Button>
						<Button
							key="save"
							type="primary"
							onClick={handleDelete}
							className="bg-[#EF4444] rounded-lg font-semibold w-full"
						>
							{__('Yes, Delete', 'quillbooking')}
						</Button>
					</Flex>,
				]}
			>
				<Flex
					vertical
					justify="center"
					align="center"
					className="rounded-lg"
				>
					<div className="bg-[#EF44441F] p-4 rounded-lg">
						<CalendarDeleteIcon />
					</div>
					<p className="text-[#09090B] text-[20px] font-[700] mt-5">
						{__(
							'Do you really you want to delete this event?',
							'quillbooking'
						)}
					</p>
					<span className="text-[#71717A]">
						{__(
							'by deleting this event you will not be able to restore it again!',
							'quillbooking'
						)}
					</span>
				</Flex>
			</Modal>
			<Modal
				open={isModalDisableOpen}
				onCancel={handleDisableCancel}
				okText={__('Yes', 'quillbooking')}
				cancelText={__('No', 'quillbooking')}
				footer={[
					<Flex
						className="w-full mt-5 items-center justify-center"
						gap={10}
						key="footer"
					>
						<Button
							key="cancel"
							onClick={handleDisableCancel}
							className="border rounded-lg text-[#71717A] font-semibold w-full"
						>
							{__('Back', 'quillbooking')}
						</Button>
						<Button
							key="save"
							type="primary"
							onClick={() => handleDisable(!isDisabled)}
							className="bg-[#EF4444] rounded-lg font-semibold w-full"
						>
							{isDisabled
								? __('Yes, Enable', 'quillbooking')
								: __('Yes, Disable', 'quillbooking')}
						</Button>
					</Flex>,
				]}
			>
				<Flex
					vertical
					justify="center"
					align="center"
					className="rounded-lg"
				>
					<div className="bg-[#EF44441F] p-4 rounded-lg">
						<CalendarDisableIcon />
					</div>
					<p className="text-[#09090B] text-[20px] font-[700] mt-5">
						{isDisabled
							? __('Do you really you want to enable this event?', 'quillbooking')
							: __('Do you really you want to disable this event?', 'quillbooking')
						}
					</p>
					<span className="text-[#71717A] text-center">
						{isDisabled
							? __('Enabling this event will make it available for booking', 'quillbooking')
							: __('by Disable this event you will not be able to Share or edit event untiled you Enable it again!', 'quillbooking')
						}
					</span>
				</Flex>
			</Modal>
		</Flex>
	);
};

export default EventActions;
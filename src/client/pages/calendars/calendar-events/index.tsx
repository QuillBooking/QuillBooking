/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Popover } from 'antd';
import { SlOptions } from 'react-icons/sl';
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import type { Calendar, Event } from '@quillbooking/types';
import ConfigAPI from '@quillbooking/config';
import {
	CloneIcon,
	ShareIcon,
	TimeIcon,
	LocationIcon,
	DateIcon,
	CalendarAddIcon,
	BookingNumIcon,
	UpcomingCalendarIcon,
	ShareModal,
	EventPrice,
} from '@quillbooking/components';
import { useCopyToClipboard } from '@quillbooking/hooks';
import EventActions from '../event-actions';
import CreateEvent from '../../create-event';

/**
 * Calendar Events Component.
 */
const CalendarEvents: React.FC<{
	calendar: Calendar;
	typesLabels: Record<string, string>;
	updateCalendarEvents: () => void;
	setStatusMessage: (message: boolean) => void;
	setDeleteMessage: (message: boolean) => void;
	setCloneMessage: (message: boolean) => void;
	setErrorMessage?: (message: string | null) => void;
	navigate: (path: string) => void;
}> = ({
	calendar,
	typesLabels,
	updateCalendarEvents,
	setStatusMessage,
	setDeleteMessage,
	setCloneMessage,
	setErrorMessage,
	navigate,
}) => {
		const siteUrl = ConfigAPI.getSiteUrl();
		const copyToClipboard = useCopyToClipboard();
		const [modalShareId, setModalShareId] = useState<number | null>(null);
		const [disabledEvents, setDisabledEvents] = useState<
			Record<string, boolean>
		>({});
		const [showCreateEventModal, setShowCreateEventModal] = useState(false);
		const [events, setEvents] = useState(calendar.events);
		// New state to track which popover is open
		const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

		// Initialize disabledEvents state based on initial event status
		useEffect(() => {
			const initialDisabledState: Record<string, boolean> = {};
			calendar.events.forEach((event) => {
				if (event.id) {
					initialDisabledState[event.id] = !!event.is_disabled;
				}
			});
			setDisabledEvents(initialDisabledState);
			setEvents(calendar.events);
		}, [calendar.events]);

		// Function to handle event disable status change
		const handleEventStatusChange = (
			eventId: number | undefined,
			disabled: boolean
		) => {
			if (eventId) {
				setDisabledEvents((prev) => ({
					...prev,
					[eventId]: disabled,
				}));
			}
		};

		// Function to close the popover
		const closePopover = () => {
			setOpenPopoverId(null);
		};

		return (
			<>
				{events.length > 0 ? (
					<div className="quillbooking-calendar-events">
						{events.map((event) => {
							const isDisabled = event.id
								? disabledEvents[event.id]
								: event.is_disabled;

							return (
								<Card
									key={event.id}
									className={`quillbooking-calendar-event w-[308px] border-t-4 border-t-color-primary rounded-xl ${isDisabled ? 'opacity-50' : ''}`}
								>
									<Flex gap={20} vertical>
										<Flex
											justify="space-between"
											className="border-b pb-2"
										>
											<Flex vertical gap={2}>
												<Typography.Title
													level={5}
													style={{ margin: 0 }}
													className="capitalize text-[16px] font-[700] text-[#313131]"
												>
													{event.name}
												</Typography.Title>
												<Typography.Text
													type="secondary"
													className="text-[#1A1A1A99] text-[14px] font-[400] flex items-center gap-2"
												>
													<TimeIcon />
													{event.duration}{' '}
													{__('Mins', 'quillbooking')}
												</Typography.Text>
											</Flex>
											<Popover
												trigger={['click']}
												open={openPopoverId === event.id}
												onOpenChange={(visible) => {
													setOpenPopoverId(
														visible
															? event.id || null
															: null
													);
												}}
												content={
													<EventActions
														navigate={navigate}
														event={event}
														calendarId={calendar.id}
														updateCalendarEvents={
															updateCalendarEvents
														}
														isDisabled={isDisabled}
														setDisabledEvents={
															handleEventStatusChange
														}
														setDeleteMessage={
															setDeleteMessage
														}
														setStatusMessage={
															setStatusMessage
														}
														setCloneMessage={
															setCloneMessage
														}
														onActionComplete={
															closePopover
														}
														setErrorMessage={
															setErrorMessage
														}
													/>
												}
											>
												<Button
													icon={
														<SlOptions className="text-color-primary-text text-[16px]" />
													}
													className="bg-[#EDEBEB] border-none rounded-xl"
												/>
											</Popover>
										</Flex>
										<Flex vertical justify="center" gap={10}>
											<Flex gap={10} className="items-center">
												<div className="flex-shrink-0">
													<LocationIcon />
												</div>
												<div className="flex flex-col">
													<span className="text-[#71717A] text-[12px]">
														{__(
															'Location',
															'quillbooking'
														)}
													</span>
													{event.location.length === 1 ? (
														<span className="text-[#09090B] text-[14px] font-[500] capitalize">
															{event.location[0].type
																.split('_')
																.join(' ')}
														</span>
													) : (
														<Popover
															content={
																<div>
																	{event.location.map(
																		(
																			loc,
																			index
																		) => {
																			let displayText =
																				'';
																			if (
																				loc.type ===
																				'custom' &&
																				loc.fields &&
																				loc
																					.fields
																					.location
																			) {
																				displayText =
																					loc
																						.fields
																						.location;
																			} else {
																				displayText =
																					loc.type
																						.split(
																							'_'
																						)
																						.join(
																							' '
																						);
																			}
																			return (
																				<div
																					key={
																						index
																					}
																					className="capitalize"
																				>
																					{
																						displayText
																					}
																				</div>
																			);
																		}
																	)}
																</div>
															}
														>
															<span className="text-[#09090B] text-[14px] font-[500] capitalize cursor-pointer">
																{
																	event.location
																		.length
																}{' '}
																{__(
																	'Locations',
																	'quillbooking'
																)}
															</span>
														</Popover>
													)}
												</div>
											</Flex>
											<Flex gap={10} className="items-center">
												<DateIcon />
												<div className="flex flex-col">
													<span className="text-[#71717A] text-[12px]">
														{__(
															'Event Type',
															'quillbooking'
														)}
													</span>
													<span className="text-[#09090B] text-[14px] font-[500] capitalize">
														{event.type}
													</span>
												</div>
											</Flex>

											{/* static */}
											<Flex gap={10} className="items-center">
												<BookingNumIcon />
												<div className="flex flex-col">
													<span className="text-[#71717A] text-[12px]">
														{__(
															'Number of Bookings',
															'quillbooking'
														)}
													</span>
													<span className="text-[#09090B] text-[14px] font-[500] capitalize">
														{event.booking_count}
													</span>
												</div>
											</Flex>

											<EventPrice
												payments_settings={
													event.payments_settings
												}
												duration={
													event.additional_settings
														.default_duration
												}
											/>
										</Flex>
										<Flex
											justify="space-between"
											className="border-t pt-3"
										>
											<Button
												icon={<CloneIcon />}
												type="text"
												onClick={() =>
													copyToClipboard(
														`${siteUrl}?quillbooking_event=${event.slug}`,
														__(
															'Link copied',
															'quillbooking'
														)
													)
												}
												style={{
													paddingLeft: 0,
													paddingRight: 0,
												}}
												disabled={isDisabled}
											>
												{__('Copy Link', 'quillbooking')}
											</Button>
											<Button
												type="text"
												icon={<ShareIcon />}
												style={{
													paddingLeft: 0,
													paddingRight: 0,
												}}
												onClick={() =>
													setModalShareId(event.id)
												}
												disabled={isDisabled}
											>
												{__('Share', 'quillbooking')}
											</Button>
											{modalShareId !== null && (
												<ShareModal
													open={modalShareId !== null}
													onClose={() =>
														setModalShareId(null)
													}
													url={`${siteUrl}?quillbooking_calendar=${calendar.slug}&event=${events.find(
														(event) =>
															event.id ===
															modalShareId
													)?.slug || ''
														}`}
													event={event as Event}
												/>
											)}
										</Flex>
									</Flex>
								</Card>
							);
						})}
						{calendar.type == 'host' && (
							<>
								<Button
									className="text-color-primary border-2 border-[#C497EC] bg-color-tertiary border-dashed font-[600] w-[310px] text-[20px] flex flex-col items-center justify-center text-center h-[385px]"
									onClick={() => setShowCreateEventModal(true)}
								>
									<CalendarAddIcon />
									<span className="pt-[8.5px] text-center text-color-primary self-center">
										{__('Create Event', 'quillbooking')}
									</span>
								</Button>

								<CreateEvent
									visible={showCreateEventModal}
									setVisible={setShowCreateEventModal}
									onClose={() => setShowCreateEventModal(false)}
									calendarId={calendar.id}
									calendarType={calendar.type}
								/>
							</>
						)}
					</div>
				) : (
					<div className="quillbooking-calendar-no-events">
						{calendar.type == 'team' && (
							<>
								<Flex
									vertical
									gap={30}
									justify="center"
									align="center"
									className="py-10"
								>
									<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
										<UpcomingCalendarIcon
											width={60}
											height={60}
										/>
									</div>
									<Flex
										vertical
										gap={5}
										justify="center"
										align="center"
									>
										<span className="text-[20px] font-medium text-black">
											{__(
												'No Events Added Yet?',
												'quillbooking'
											)}
										</span>
									</Flex>
								</Flex>
							</>
						)}
						{calendar.type == 'host' && (
							<>
								<Flex
									vertical
									gap={30}
									justify="center"
									align="center"
									className="py-10"
								>
									<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
										<UpcomingCalendarIcon
											width={60}
											height={60}
										/>
									</div>
									<Flex
										vertical
										gap={5}
										justify="center"
										align="center"
									>
										<span className="text-[20px] font-medium text-black">
											{__(
												'No Events Added Yet?',
												'quillbooking'
											)}
										</span>
										<span className="text-[#8B8D97]">
											{__(
												'You can also create Teams and manage their events',
												'quillbooking'
											)}
										</span>
									</Flex>
									<Button
										color="primary"
										className="text-[16px] bg-color-primary text-white border-none shadow-none w-fit"
										onClick={() =>
											setShowCreateEventModal(true)
										}
									>
										{__('+ Add New Event', 'quillbooking')}
									</Button>
								</Flex>

								<CreateEvent
									visible={showCreateEventModal}
									setVisible={setShowCreateEventModal}
									onClose={() => setShowCreateEventModal(false)}
									calendarId={calendar.id}
									calendarType={calendar.type}
								/>
							</>
						)}
					</div>
				)}
			</>
		);
	};

export default CalendarEvents;

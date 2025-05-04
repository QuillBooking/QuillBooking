/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Popover, Empty } from 'antd';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import {
	CloneIcon,
	ShareIcon,
	TimeIcon,
	LocationIcon,
	DateIcon,
	PriceIcon,
	CalendarAddIcon,
	BookingNumIcon,
	UpcomingCalendarIcon,
} from '@quillbooking/components';
import {
	useCopyToClipboard,
	useNavigate,
} from '@quillbooking/hooks';
import { SlOptions } from 'react-icons/sl';
import { map } from 'lodash';
import { useEffect, useState } from 'react';
import ShareModal from '../share-modal';
import EventActions from '../event-actions';
import CreateEvent from '../../create-event';

/**
 * Calendar Events Component.
 */
const CalendarEvents: React.FC<{
	calendar: Calendar;
	typesLabels: Record<string, string>;
	updateCalendarEvents: () => void;
}> = ({ calendar, typesLabels, updateCalendarEvents }) => {
	const siteUrl = ConfigAPI.getSiteUrl();
	const copyToClipboard = useCopyToClipboard();
	const [modalShareId, setModalShareId] = useState<number | null>(null);
	const [disabledEvents, setDisabledEvents] = useState({});
	const [showCreateEventModal, setShowCreateEventModal] = useState(false);
	console.log(calendar.events);

	return (
		<>
			{calendar.events.length > 0 ? (
				<div className="quillbooking-calendar-events">
					{calendar.events.map((event) => {
						const isDisabled = event.is_disabled;
						return (
							<Card
								key={event.id}
								className="quillbooking-calendar-event w-[310px] border-t-4 border-t-color-primary rounded-xl"
								style={{
									opacity: isDisabled ? 0.5 : 1,
									pointerEvents: isDisabled ? 'none' : 'auto',
								}}
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
											content={
												<EventActions
													event={event}
													calendarId={calendar.id}
													updateCalendarEvents={() =>
														updateCalendarEvents()
													}
													isDisabled={isDisabled}
													setDisabledEvents={
														setDisabledEvents
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
											<LocationIcon />
											<div className="flex flex-col">
												<span className="text-[#71717A] text-[12px]">
													{__(
														'Location',
														'quillbooking'
													)}
												</span>
												<span className="text-[#09090B] text-[14px] font-[500] capitalize">
													{event.location.map(
														(loc, index) => (
															<span key={index}>
																{loc.type}
																{index !==
																	event
																		.location
																		.length -
																	1 &&
																	', '}
															</span>
														)
													)}
												</span>
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

										{/* static */}
										<Flex gap={10} className="items-center">
											<PriceIcon />
											<div className="flex flex-col">
												<span className="text-[#71717A] text-[12px]">
													{__(
														'Price',
														'quillbooking'
													)}
												</span>
												<span className="text-[#007AFF] text-[14px] font-[500] capitalize">
													Free
												</span>
											</div>
										</Flex>
									</Flex>
									{/* <Tooltip title={calendar.name}>
                                    <Avatar icon={<UserOutlined />} />
                                </Tooltip>
                                <Typography.Link href={`${siteUrl}?quillbooking_event=${event.slug}`} target='_blank'>
                                    {__('View Booking Page', 'quillbooking')}
                                </Typography.Link> */}
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
										>
											{__('Share', 'quillbooking')}
										</Button>
										{modalShareId !== null && (
											<ShareModal
												open={modalShareId !== null}
												onClose={() =>
													setModalShareId(null)
												}
												url={`${siteUrl}?quillbooking_calendar=${calendar.slug}&event=${event.slug}`}
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
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={__('No events found', 'quillbooking')}
						/>
					)}
					{calendar.type == 'host' && (
						<>
							<Flex vertical gap={30} justify='center' align='center' className='py-10'>
								<div className='border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]'>
									<UpcomingCalendarIcon width={60} height={60} />
								</div>
								<Flex vertical gap={5} justify='center' align='center'>
									<span className='text-[20px] font-medium text-black'>{__('No Events Added Yet?', 'quillbooking')}</span>
									<span className='text-[#8B8D97]'>{__('You can also create Teams and manage their events', 'quillbooking')}</span>
								</Flex>
								<Button
									color='primary'
									className='text-[16px] bg-color-primary text-white border-none shadow-none w-fit'
									onClick={() => setShowCreateEventModal(true)}
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
			{/* {cloneCalendar && (
                <CloneEventModal
                    open={!!cloneCalendar}
                    calendar={cloneCalendar}
                    onClose={() => setCloneCalendar(null)}
                    excludedEvents={map(cloneCalendar.events, 'id')}
                    onSaved={handleSaved}
                />
            )} */}
		</>
	);
};

export default CalendarEvents;

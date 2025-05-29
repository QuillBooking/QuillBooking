/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Card, Flex, Popover, Typography } from 'antd';
import { GoArrowRight } from 'react-icons/go';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import {
	useApi,
	useCopyToClipboard,
	useCurrentUser,
	useNavigate,
	useNotice,
} from '@quillbooking/hooks';
import {
	CloneIcon,
	ShareIcon,
	ShareModal,
	TimeIcon,
	UpcomingCalendarIcon,
} from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { Event } from 'client/types';

const MAX_EVENTS = 7; // Maximum number of events to display

const EventShimmer: React.FC = () => {
	return (
		<div className="border-t-2 border-dashed pt-4 pb-5">
			<Flex align="center" justify="space-between">
				<Flex align="flex-start" gap={15}>
					<div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
					<Flex vertical>
						<div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-2" />
						<Flex gap={16} align="center">
							<div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
							<div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
							<div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
						</Flex>
						<div className="h-4 w-40 bg-gray-200 animate-pulse rounded mt-2" />
					</Flex>
				</Flex>
				<Flex gap={10} align="center">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="w-8 h-8 bg-gray-200 animate-pulse rounded-lg"
						/>
					))}
				</Flex>
			</Flex>
		</div>
	);
};

const LatestEvents: React.FC<{ canManageAllCalendars: boolean }> = ({
	canManageAllCalendars,
}) => {
	const { callApi } = useApi();
	const currentUser = useCurrentUser();
	const navigate = useNavigate();
	const [events, setEvents] = useState<Event[]>([]);
	const { errorNotice } = useNotice();
	const [modalShareId, setModalShareId] = useState<number | null>(null);
	const siteUrl = ConfigAPI.getSiteUrl();
	const copyToClipboard = useCopyToClipboard();
	const [loading, setLoading] = useState(true);
	const [enabledEventsCount, setEnabledEventsCount] = useState<number>(0);

	// Function to get random background color based on event name
	const getInitialBackgroundColor = (name: string): string => {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-yellow-500',
			'bg-red-500',
			'bg-purple-500',
			'bg-pink-500',
			'bg-indigo-500',
			'bg-cyan-500',
		];
		const charSum = name
			.split('')
			.reduce((sum, char) => sum + char.charCodeAt(0), 0);
		return colors[charSum % colors.length];
	};

	// Function to get initial letter of the event name
	const getInitialLetter = (name: string): string => {
		return name.trim()[0].toUpperCase();
	};

	const fetchEvents = async () => {
		setLoading(true);
		callApi({
			path: addQueryArgs('events/latest', {
				limit: MAX_EVENTS,
				user_id: currentUser.getId(),
				status: 'active',
			}),
			onSuccess: (response: {
				events: Event[];
				enabled_events_count: number;
			}) => {
				setEvents(response.events);
				setEnabledEventsCount(response.enabled_events_count);
				setLoading(false);
			},
			onError: (error) => {
				errorNotice(error.message);
				setLoading(false);
			},
		});
	};

	useEffect(() => {
		fetchEvents();
	}, []);

	return (
		<Card>
			<Flex justify="space-between" align="center" className="pb-8">
				<Flex vertical>
					<div className="text-[18px] text-[#3F4254] font-semibold">
						{__('Latest Events', 'quillbooking')}
					</div>
					<div className="text-[#A1A5B7] font-semibold">
						{sprintf(
							/* translators: %d: number of running events */
							__('%d Events Running', 'quillbooking'),
							enabledEventsCount || 0
						)}
					</div>
				</Flex>
				<Button
					onClick={() => navigate('calendars')}
					className="bg-[#F1F1F2] text-[#A1A5B7] font-semibold border-none shadow-none"
				>
					{__('View All Events', 'quillbooking')}
				</Button>
			</Flex>
			{loading ? (
				<div className="space-y-4">
					{[1, 2, 3].map((index) => (
						<EventShimmer key={index} />
					))}
				</div>
			) : events.length > 0 ? (
				events.map((event) => (
					<div
						key={event.id}
						className="border-t-2 border-dashed pt-4 pb-5"
					>
						<Flex align="center" justify="space-between">
							<Flex align="flex-start" gap={15}>
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold ${getInitialBackgroundColor(event.name)}`}
								>
									{getInitialLetter(event.name)}
								</div>
								<Flex vertical>
									<div className="font-semibold text-[#3F4254]">
										{event.name}
									</div>
									<Flex gap={16} align="center">
										<Typography.Text
											type="secondary"
											className="text-[#1A1A1A99] flex items-center gap-2 border-r pr-4"
										>
											<TimeIcon />
											{event.duration}{' '}
											{__('Mins', 'quillbooking')}
										</Typography.Text>
										<div className="font-medium text-[#09090B] border-r pr-4">
											{event.type}
										</div>
										<div className="font-medium text-[#09090B]">
											{__(
												`Bookings No. (${event.id})`,
												'quillbooking'
											)}
										</div>
									</Flex>
									<div className="font-medium text-[#09090B] pt-1 capitalize">
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
															(loc, index) => {
																let displayText =
																	'';
																if (
																	loc.type ===
																		'custom' &&
																	loc.fields &&
																	loc.fields
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
													{event.location.length}{' '}
													{__(
														'Locations',
														'quillbooking'
													)}
												</span>
											</Popover>
										)}
									</div>
								</Flex>
							</Flex>
							<Flex gap={10} align="center">
								<Button
									onClick={() => setModalShareId(event.id)}
									className="bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none"
								>
									<ShareIcon />
								</Button>
								<Button
									onClick={() =>
										copyToClipboard(
											`${siteUrl}?quillbooking_event=${event.id}`,
											__('Link copied', 'quillbooking')
										)
									}
									className="bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none"
								>
									<CloneIcon />
								</Button>
								<Button
									onClick={() =>
										navigate(
											`calendars/${event.calendar_id}/events/${event.id}`
										)
									}
									className="bg-[#F1F1F2] p-2 rounded-lg border-none shadow-none"
								>
									<GoArrowRight
										size={16}
										className="text-[#292D32] hover:text-color-primary"
									/>
								</Button>
							</Flex>
						</Flex>
						{modalShareId === event.id && (
							<ShareModal
								open={modalShareId === event.id}
								onClose={() => setModalShareId(null)}
								url={`${siteUrl}?quillbooking_event=${event.id}`}
							/>
						)}
					</div>
				))
			) : (
				<div className="flex flex-col gap-4 justify-center items-center mt-4 h-full p-4 my-6 py-6">
					<div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9] text-[#BEC0CA]">
						<UpcomingCalendarIcon width={60} height={60} />
					</div>

					<p className="text-xl font-medium my-1 text-color-primary-text">
						{canManageAllCalendars
							? __('No Events Yet?', 'quillbooking')
							: __('No Events Yet', 'quillbooking')}
					</p>

					{canManageAllCalendars && (
						<>
							<p className="text-[#8B8D97]">
								{__('Add New Events Manually.', 'quillbooking')}
							</p>
							<Button
								type="primary"
								className="bg-color-primary text-white"
								size="large"
								onClick={() => {
									navigate('calendars');
								}}
							>
								<PlusOutlined />
								{__('Add Event', 'quillbooking')}
							</Button>
						</>
					)}
				</div>
			)}
		</Card>
	);
};

export default LatestEvents;

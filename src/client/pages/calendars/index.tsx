/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Card, Flex, Button, Popover } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { map, filter, uniq } from 'lodash';
import { SlOptions } from 'react-icons/sl';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CalendarResponse, Calendar } from '@quillbooking/types';
import CalendarEvents from './calendar-events';
import AddCalendarModal from './add-calendar-modal';
import CalendarSkeleton from './shimmer/calendar-skeleton';
import TeamCalendarSkeleton from './shimmer/team-calendar-skeleton';
import { useApi, useNavigate, useCurrentUser } from '@quillbooking/hooks';
import {
	Header,
	AddIcon,
	PeopleWhiteIcon,
	ProfileIcon,
	PeopleFillIcon,
	SearchInput,
	HostSelect,
	TabButtons,
	NoticeBanner,
	ShareIcon,
	UpcomingCalendarIcon,
	ProVersion,
	SettingsIcon,
} from '@quillbooking/components';
import CalendarActions from './calendar-actions';
import CreateEvent from '../create-event';
import ConfigAPI from '@quillbooking/config';
import { applyFilters } from '@wordpress/hooks';

/**
 * Main Calendars Component.
 */
const Calendars: React.FC = () => {
	const siteUrl = ConfigAPI.getSiteUrl();
	const { callApi, loading } = useApi();
	const currentUser = useCurrentUser();
	const [calendars, setCalendars] = useState<Calendar[] | null>(null);
	const [allCalendars, setAllCalendars] = useState<Calendar[] | null>(null);
	const [search, setSearch] = useState<string>('');
	const [filters, setFilters] = useState<{ [key: string]: string }>({
		type: 'host',
	});
	const [type, setType] = useState<string | null>(null);
	const [update, setUpdate] = useState(false);
	const [showCreateEventModal, setShowCreateEventModal] = useState(false);
	const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
		null
	);
	const [selectedUser, setSelectedUser] = useState<number>(
		currentUser.isAdmin() ? 0 : currentUser.getId()
	);
	const [excludedUserIds, setExcludedUserIds] = useState<number[]>([]);
	const [hostSelectKey, setHostSelectKey] = useState<number>(0);
	const [eventStatusMessage, setEventStatusMessage] =
		useState<boolean>(false);
	const [deleteEventMessage, setDeleteEventMessage] =
		useState<boolean>(false);
	const [deleteCalendarMessage, setDeleteCalendarMessage] =
		useState<boolean>(false);
	const [createCalendarMessage, setCreateCalendarMessage] =
		useState<boolean>(false);
	const [cloneMessage, setCloneMessage] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const navigate = useNavigate();
	const typesLabels = {
		'one-to-one': __('One to One', 'quillbooking'),
		group: __('Group', 'quillbooking'),
		'round-robin': __('Round Robin', 'quillbooking'),
	};
	const canManageAllCalendars = useCurrentUser().hasCapability(
		'quillbooking_manage_all_calendars'
	);
	// Add useEffect for handling notice timeouts
	useEffect(() => {
		const messages = [
			{
				state: eventStatusMessage,
				setState: setEventStatusMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: deleteEventMessage,
				setState: setDeleteEventMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: deleteCalendarMessage,
				setState: setDeleteCalendarMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: createCalendarMessage,
				setState: setCreateCalendarMessage as (
					value: boolean | null
				) => void,
			},
			{
				state: cloneMessage,
				setState: setCloneMessage as (value: boolean | null) => void,
			},
			{ state: errorMessage, setState: setErrorMessage },
		];

		const cleanupFunctions = messages.map(({ state, setState }) => {
			if (state) {
				const timer = setTimeout(() => {
					setState(null);
				}, 5000); // Hide after 5 seconds
				return () => clearTimeout(timer);
			}
			return undefined;
		});

		return () => {
			cleanupFunctions.forEach((cleanup) => cleanup && cleanup());
		};
	}, [
		eventStatusMessage,
		deleteEventMessage,
		deleteCalendarMessage,
		createCalendarMessage,
		cloneMessage,
		errorMessage,
	]);

	const fetchCalendars = async (shouldUpdateExcludedUsers = true) => {
		if (loading) return;

		// Build filters for API request
		let apiFilters = {
			...filters,
		};

		// Only add user_id filter if not showing all hosts (for admins only)
		if (
			(selectedUser !== 0 && selectedUser !== null) ||
			!currentUser.isAdmin()
		) {
			// If not admin, always filter by current user ID
			// Make sure selectedUser is not null before calling toString()
			apiFilters.user_id =
				currentUser.isAdmin() && selectedUser !== null
					? selectedUser.toString()
					: currentUser.getId().toString();
		}

		// Special handling for team calendars
		if (filters.type === 'team' && !currentUser.isAdmin()) {
			// For non-admins, we need to fetch team calendars where user is a member
			// This is handled by the backend, but we need to indicate we want team member filtering
			apiFilters.team_member_id = currentUser.getId().toString();
		}

		callApi({
			path: addQueryArgs(`calendars`, {
				per_page: 99,
				keyword: search,
				filters: apiFilters,
			}),
			onSuccess: (response: CalendarResponse) => {
				setCalendars(response.data);
			},
			onError: (error) => {
				setErrorMessage(error.message);
			},
		});

		// Fetch all calendars regardless of filter to build the proper exclusion list
		if (shouldUpdateExcludedUsers) {
			callApi({
				path: addQueryArgs(`calendars`, {
					per_page: 99,
					filters: { type: 'host' }, // Only need host calendars for the user list
				}),
				onSuccess: (response: CalendarResponse) => {
					setAllCalendars(response.data);
					// Extract user IDs from all calendars for exclusion
					const userIds = uniq(map(response.data, 'user_id'));
					setExcludedUserIds(userIds);
				},
				onError: (error) => {
					setErrorMessage(error.message);
				},
			});
		}
	};

	const deleteCalendar = async (calendar: Calendar) => {
		try {
			await callApi({
				path: `calendars/${calendar.id}`,
				method: 'DELETE',
				onSuccess: () => {
					const updatedCalendars = filter(
						calendars,
						(c) => c.id !== calendar.id
					);
					setCalendars(updatedCalendars);

					if (allCalendars) {
						const updatedAllCalendars = filter(
							allCalendars,
							(c) => c.id !== calendar.id
						);
						setAllCalendars(updatedAllCalendars);

						const userIds = uniq(
							map(updatedAllCalendars, 'user_id')
						);
						setExcludedUserIds(userIds);
					}
				},
				onError: (error) => {
					setErrorMessage(error.message);
				},
			});
		} catch (error: any) {
			setErrorMessage(error.message || 'Unexpected error occurred');
		}
	};

	// Initial load and whenever dependencies change
	useEffect(() => {
		fetchCalendars();
	}, [search, filters, update, selectedUser]);

	const handleSaved = (calendarType?: string) => {
		// Update host select key to force re-render of the component
		setHostSelectKey((prevKey) => prevKey + 1);

		// Switch to the appropriate tab based on the created calendar type first
		if (calendarType) {
			setFilters({ ...filters, type: calendarType });
		} else {
			// If no calendar type provided, just trigger a refresh
			setUpdate((prev) => !prev);
		}
	};

	const updateEvents = () => {
		setUpdate((prev) => !prev);
	};

	const handleUserChange = (userId: number) => {
		setSelectedUser(userId !== null && userId !== undefined ? userId : 0);
	};

	// Function to filter calendars based on selected filters
	const getFilteredCalendars = () => {
		if (!calendars) return [];

		let filteredCalendars = calendars.filter(
			(calendar) => calendar.type === filters.type
		);

		// For host calendars, apply user filtering if a specific user is selected (not "All")
		const currentSelectedUser =
			selectedUser !== null && selectedUser !== undefined
				? selectedUser
				: 0;

		if (filters.type === 'host' && currentSelectedUser !== 0) {
			filteredCalendars = filteredCalendars.filter(
				(calendar) => calendar.user_id === currentSelectedUser
			);
		}

		return filteredCalendars;
	};

	const handleCreateEvent = (calendarId: number) => {
		setSelectedCalendarId(calendarId);
		setShowCreateEventModal(true);
	};

	const handleCloseCreateEventModal = () => {
		setShowCreateEventModal(false);
		setSelectedCalendarId(null);
	};

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	return (
		<div className="quillbooking-calendars">
			<div className="calendars-header pb-5 flex justify-between items-center">
				<Header
					header={__('Calendars', 'quillbooking')}
					subHeader={__(
						'Create events to share for people to book on your calendar.',
						'quillbooking'
					)}
				/>
				{canManageAllCalendars && (
					<Flex gap={12}>
						<Button
							type="text"
							onClick={() => setType('host')}
							className="bg-color-tertiary pt-2 pb-7 px-4 flex items-start text-color-primary"
						>
							<AddIcon />
							<span className="text-[14px] font-[500]">
								{__('Add Host', 'quillbooking')}
							</span>
						</Button>
						<Button
							type="text"
							onClick={() => setType('team')}
							className="bg-color-primary pt-2 pb-7 px-4 flex items-start hover:text-color-primary"
						>
							<PeopleWhiteIcon />
							<span className="text-white text-[14px] font-[500]">
								{__('Create Team', 'quillbooking')}
							</span>
						</Button>
					</Flex>
				)}
			</div>
			<Card className="quillbooking-calendars-action">
				<Flex justify="space-between">
					<Flex gap={12}>
						<Button
							type="text"
							onClick={() =>
								setFilters({ ...filters, type: 'host' })
							}
							className={`${filters.type === 'host' ? 'bg-color-tertiary text-color-primary' : 'text-[#A1A5B7]'} pt-2 pb-7 px-4 flex items-start`}
						>
							<TabButtons
								label={__('Single Events', 'quillbooking')}
								icon={<ProfileIcon />}
								isActive={filters.type === 'host'}
							/>
						</Button>
						<Button
							type="text"
							onClick={() =>
								setFilters({ ...filters, type: 'team' })
							}
							className={`pt-2 pb-7 px-4 flex items-start ${filters.type === 'team' ? 'bg-color-tertiary' : ''}`}
						>
							<TabButtons
								label={__('Team Events', 'quillbooking')}
								icon={<PeopleFillIcon />}
								isActive={filters.type === 'team'}
							/>
						</Button>
					</Flex>
					<Flex gap={12}>
						<SearchInput
							placeholder={__('Search Events', 'quillbooking')}
							onChange={(e) => setSearch(e.target.value)}
							size="small"
							allowClear
							className="w-[280px]"
						/>
						{filters.type === 'host' && canManageAllCalendars && (
							<HostSelect
								key={hostSelectKey} // Add key to force re-render when changed
								value={selectedUser}
								onChange={handleUserChange}
								placeholder={__(
									'Filter by User',
									'quillbooking'
								)}
								defaultValue={
									currentUser.isAdmin()
										? 0
										: currentUser.getId()
								} // Default to All for admins, current user for non-admins
								selectFirstHost={!currentUser.isAdmin()} // Only auto-select first host for non-admins
								showAllOption={currentUser.isAdmin()} // Only show "All" option for admins
							/>
						)}
					</Flex>
				</Flex>
			</Card>
			{loading || !calendars ? (
				<div>
					{filters.type === 'host' ? (
						<>
							<CalendarSkeleton />
							<CalendarSkeleton />
							<CalendarSkeleton />
						</>
					) : (
						<Flex gap={15} wrap>
							<TeamCalendarSkeleton />
							<TeamCalendarSkeleton />
							<TeamCalendarSkeleton />
						</Flex>
					)}
				</div>
			) : (
				<div>
					{createCalendarMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Created',
									'quillbooking'
								),
								message: __(
									'The Calendar has been created successfully.',
									'quillbooking'
								),
							}}
							closeNotice={() => setCreateCalendarMessage(false)}
						/>
					)}
					{eventStatusMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Disabled',
									'quillbooking'
								),
								message: __(
									'The Event has been Disabled successfully.',
									'quillbooking'
								),
							}}
							closeNotice={() => setEventStatusMessage(false)}
						/>
					)}
					{deleteEventMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Deleted',
									'quillbooking'
								),
								message: __(
									'The Event has been deleted successfully.',
									'quillbooking'
								),
							}}
							closeNotice={() => setDeleteEventMessage(false)}
						/>
					)}
					{deleteCalendarMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __(
									'Successfully Deleted',
									'quillbooking'
								),
								message: __(
									'The Calendar has been deleted successfully.',
									'quillbooking'
								),
							}}
							closeNotice={() => setDeleteCalendarMessage(false)}
						/>
					)}
					{cloneMessage && (
						<NoticeBanner
							notice={{
								type: 'success',
								title: __('Success', 'quillbooking'),
								message: __(
									'The Event has been cloned successfully.',
									'quillbooking'
								),
							}}
							closeNotice={() => setCloneMessage(false)}
						/>
					)}
					{errorMessage && (
						<NoticeBanner
							notice={{
								type: 'error',
								title: __('Error', 'quillbooking'),
								message: errorMessage,
							}}
							closeNotice={() => setErrorMessage(null)}
						/>
					)}
					{getFilteredCalendars().length === 0 ? (
						<Flex
							vertical
							gap={30}
							justify="center"
							align="center"
							className="py-10"
						>
							<div className="border rounded-full p-7 bg-[#F4F5FA] border-[#E1E2E9] text-[#BEC0CA]">
								<UpcomingCalendarIcon width={60} height={60} />
							</div>
							<Flex
								vertical
								gap={5}
								justify="center"
								align="center"
							>
								<span className="text-[20px] font-medium text-black">
									{search
										? __(
												'No matching events found',
												'quillbooking'
											)
										: __(
												'No Calendars available',
												'quillbooking'
											)}
								</span>
								{filters.type === 'team' && (
									<Button
										type="primary"
										className="mt-4"
										onClick={() => setType('team')}
										icon={<PlusOutlined />}
									>
										{__(
											'Create Team Calendar',
											'quillbooking'
										)}
									</Button>
								)}
								{filters.type === 'host' &&
									canManageAllCalendars && (
										<Button
											type="primary"
											className="mt-4"
											onClick={() => setType('host')}
											icon={<PlusOutlined />}
										>
											{__(
												'Create host Calendar',
												'quillbooking'
											)}
										</Button>
									)}
							</Flex>
						</Flex>
					) : (
						<>
							{filters.type === 'host' ? (
								<>
									{getFilteredCalendars().map((calendar) => (
										<Card
											key={calendar.id}
											className="bg-[#FDFDFD] mb-4"
										>
											<Flex vertical gap={20}>
												<Card className="bg-white">
													<Flex
														justify="space-between"
														align="center"
													>
														<Flex vertical>
															<div className="text-[#313131] text-base font-semibold">
																{calendar.name}
															</div>
															<a
																href={
																	siteUrl +
																	'?quillbooking_calendar=' +
																	calendar.slug
																}
																target="_blank"
															>
																<div className="text-color-primary flex items-center gap-2 italic text-xs font-medium cursor-pointer">
																	{__(
																		'View My Landing Page',
																		'quillbooking'
																	)}
																	<ShareIcon
																		width={
																			16
																		}
																		height={
																			16
																		}
																	/>
																</div>
															</a>
														</Flex>
														<Flex gap={8}>
															<Button
																type="text"
																className="border-[#EDEBEB] text-color-primary-text flex items-center gap-2"
																onClick={() =>
																	navigate(
																		`calendars/${calendar.id}`
																	)
																}
															>
																<SettingsIcon
																	width={18}
																	height={18}
																/>
																{__(
																	'Host Settings',
																	'quillbooking'
																)}
															</Button>
															<Popover
																trigger={[
																	'click',
																]}
																content={
																	<CalendarActions
																		calendar={
																			calendar
																		}
																		setCloneMessage={
																			setCloneMessage
																		}
																		onSaved={
																			handleSaved
																		}
																		onEdit={(
																			id
																		) =>
																			navigate(
																				`calendars/${id}`
																			)
																		}
																		onDelete={(
																			id
																		) =>
																			deleteCalendar(
																				{
																					id: id,
																				} as Calendar
																			)
																		}
																		setDeleteCalendarMessage={
																			setDeleteCalendarMessage
																		}
																		setErrorMessage={
																			setErrorMessage
																		}
																	/>
																}
															>
																<Button
																	type="text"
																	icon={
																		<SlOptions className="text-color-primary-text text-[18px]" />
																	}
																	className="border-[#EDEBEB]"
																/>
															</Popover>
														</Flex>
													</Flex>
												</Card>
												<CalendarEvents
													navigate={navigate}
													calendar={calendar}
													typesLabels={typesLabels}
													updateCalendarEvents={
														updateEvents
													}
													setStatusMessage={
														setEventStatusMessage
													}
													setDeleteMessage={
														setDeleteEventMessage
													}
													setCloneMessage={
														setCloneMessage
													}
													setErrorMessage={
														setErrorMessage
													}
												/>
											</Flex>
										</Card>
									))}
								</>
							) : (
								applyFilters(
									'quillbooking.event.team_calendars',
									<ProVersion />,
									{
										getFilteredCalendars,
										siteUrl,
										setCloneMessage,
										handleSaved,
										navigate: handleNavigation,
										deleteCalendar,
										setDeleteCalendarMessage,
										setErrorMessage,
										filters,
										handleCreateEvent,
										typesLabels,
										updateEvents,
										setEventStatusMessage,
										setDeleteEventMessage,
									}
								)
							)}
						</>
					)}
				</div>
			)}
			{type && (
				<AddCalendarModal
					open={!!type}
					type={type}
					onClose={() => setType(null)}
					excludedUsers={excludedUserIds}
					onSaved={handleSaved}
					setCreateCalendarMessage={setCreateCalendarMessage}
					setErrorMessage={setErrorMessage}
				/>
			)}
			{showCreateEventModal && selectedCalendarId && (
				<CreateEvent
					visible={showCreateEventModal}
					setVisible={setShowCreateEventModal}
					onClose={handleCloseCreateEventModal}
					calendarId={selectedCalendarId}
					calendarType={filters.type}
				/>
			)}
		</div>
	);
};

export default Calendars;

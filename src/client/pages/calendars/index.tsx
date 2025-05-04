/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Card, Flex, Button, Popover, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { map, filter } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CalendarResponse, Calendar } from '@quillbooking/client';
import CalendarEvents from './calendar-events';
import AddCalendarModal from './add-calendar-modal';
import CloneEventModal from './clone-event-modal';
import {
	useApi,
	useNotice,
	useNavigate,
} from '@quillbooking/hooks';
import {
	Header,
	AddIcon,
	PeopleWhiteIcon,
	ProfileIcon,
	PeopleFillIcon,
	MultiSelect,
	SearchInput,
	UserSelect,
	HostSelect,
	TabButtons,
} from '@quillbooking/components';
import { SlOptions } from 'react-icons/sl';
import CalendarActions from './calendar-actions';
import CreateEvent from '../create-event';

/**
 * Main Calendars Component.
 */
const Calendars: React.FC = () => {
	const { callApi, loading } = useApi();
	const [calendars, setCalendars] = useState<Calendar[] | null>(null);
	const [search, setSearch] = useState<string>('');
	const [filters, setFilters] = useState<{ [key: string]: string }>({
		type: 'host',
	});
	const [type, setType] = useState<string | null>(null);
	const [cloneCalendar, setCloneCalendar] = useState<Calendar | null>(null);
	const [update, setUpdate] = useState(false);
	const [showCreateEventModal, setShowCreateEventModal] = useState(false);
	const [selectedUser, setSelectedUser] = useState<number>(0);
	const { errorNotice, successNotice } = useNotice();
	const navigate = useNavigate();
	const typesLabels = {
		'one-to-one': __('One to One', 'quillbooking'),
		group: __('Group', 'quillbooking'),
		'round-robin': __('Round Robin', 'quillbooking'),
	};

	const fetchCalendars = async () => {
		if (loading) return;

		// Always include user_id in filters
		const apiFilters = {
			...filters,
			user_id: selectedUser,
		};

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
				errorNotice(error.message);
			},
		});
	};

	console.log("calendars:",calendars)

	const deleteCalendar = async (calendar: Calendar) => {
		await callApi({
			path: `calendars/${calendar.id}`,
			method: 'DELETE',
			onSuccess: () => {
				const updatedCalendars = filter(
					calendars,
					(c) => c.id !== calendar.id
				);
				setCalendars(updatedCalendars);
				successNotice(__('Calendar deleted successfully', 'quillbooking'));
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};

	// Initial load and whenever dependencies change
	useEffect(() => {
		fetchCalendars();
	}, [search, filters, update, selectedUser]);

	const handleSaved = () => {
		fetchCalendars();
	};

	const updateEvents = () => {
		setUpdate((prev) => !prev);
	};

	const handleDisableEvent = (eventIds: number[]) => {
		callApi({
			path: `events/disable`,
			method: 'PUT',
			data: {
				ids: eventIds,
			},
			onSuccess: () => {
				successNotice(
					__('Events disabled successfully', 'quillbooking')
				);
				updateEvents();
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};

	const handleUserChange = (userId: number) => {
		setSelectedUser(userId);
	};

	// Function to filter calendars based on selected filters
	const getFilteredCalendars = () => {
		if (!calendars) return [];
		
		return calendars.filter((calendar) => 
			calendar.type === filters.type && 
			(selectedUser === 0 || calendar.user_id === selectedUser)
		);
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
				<Flex gap={12}>
					<Button
						type="text"
						onClick={() => setType('host')}
						className="bg-color-tertiary pt-2 pb-7 px-4 flex items-start"
					>
						<AddIcon />
						<span className="text-color-primary text-[14px] font-[500]">
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

						<HostSelect
							value={selectedUser}
							onChange={handleUserChange}
							placeholder={__('Filter by User', 'quillbooking')}
							defaultValue={0}
							selectFirstHost={true} 
						/>
						
					</Flex>
				</Flex>
			</Card>
			{loading || !calendars ? (
				<Skeleton active />
			) : (
				<div>
					{filters.type === 'host' ? (
						<Card className="bg-[#FDFDFD]">
							<Flex vertical gap={20}>
								{getFilteredCalendars().map((calendar) => (
									<CalendarEvents
										key={calendar.id}
										calendar={calendar}
										typesLabels={typesLabels}
										updateCalendarEvents={updateEvents}
									/>
								))}
							</Flex>
						</Card>
					) : (
						<Flex gap={15} wrap>
							{/* {getFilteredCalendars().map((teamCalendar) => { */}
							{calendars
								.filter((calendar) => calendar.type === 'team')
								.map((teamCalendar) => {
								return (
									<Card
										key={teamCalendar.id}
										title={teamCalendar.name}
										className="bg-[#FDFDFD] w-[377px]"
										headStyle={{
											backgroundColor: '#FFFFFF',
											textTransform: 'uppercase',
										}}
										extra={
											<div>
												<Popover
													trigger={['click']}
													content={
														<CalendarActions
															calendar={
																teamCalendar
															}
															onEdit={(id) =>
																navigate(
																	`calendars/${id}/general`
																)
															}
															onDisable={
																handleDisableEvent
															}
															isDisabled={
																false
															}
															onClone={(
																calendar
															) =>
																setCloneCalendar(
																	calendar
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
											</div>
										}
									>
										<Flex vertical gap={20}>
											{filters.type === 'team' && (
												<Button
													className="text-color-primary border-2 border-[#C497EC] bg-color-tertiary border-dashed font-[600] flex items-center justify-center h-[56px] w-[310px] text-[16px]"
													onClick={() => setShowCreateEventModal(true)}
												>
													<PlusOutlined className="text-color-primary" />
													<span className="pt-[8.5px]">
														{__('Create New Event', 'quillbooking')}
													</span>
												</Button>
											)}

											<CreateEvent
												visible={showCreateEventModal}
												setVisible={setShowCreateEventModal}
												onClose={() => setShowCreateEventModal(false)}
												calendarId={teamCalendar.id}
												calendarType={filters.type}
											/>
											<CalendarEvents
												key={teamCalendar.id}
												calendar={teamCalendar}
												typesLabels={typesLabels}
												updateCalendarEvents={
													updateEvents
												}
											/>
										</Flex>
									</Card>
								);
							})}
						</Flex>
					)}
				</div>
			)}
			{
				type && (
					<AddCalendarModal
						open={!!type}
						type={type}
						onClose={() => setType(null)}
						excludedUsers={map(calendars, 'user_id')}
						onSaved={handleSaved}
					/>
				)
			}
			{
				cloneCalendar && (
					<CloneEventModal
						open={!!cloneCalendar}
						calendar={cloneCalendar}
						onClose={() => setCloneCalendar(null)}
						excludedEvents={map(cloneCalendar.events, 'id')}
						onSaved={handleSaved}
					/>
				)
			}
		</div>
	);
};

export default Calendars;
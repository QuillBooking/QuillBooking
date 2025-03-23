/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Card,
	Flex,
	Button,
	Typography,
	Avatar,
	Popover,
	Skeleton,
	Input,
	Select,
	Popconfirm,
} from 'antd';
import {
	SettingOutlined,
	UserOutlined,
	CopyOutlined,
	LinkOutlined,
	DeleteOutlined,
	PlusOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import { map, filter } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CalendarResponse, Calendar } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import CalendarEvents from './calendar-events';
import AddCalendarModal from './add-calendar-modal';
import CloneEventModal from './clone-event-modal';
import {
	useApi,
	useNotice,
	useCopyToClipboard,
	useNavigate,
} from '@quillbooking/hooks';
import AddIcon from '../../../components/icons/add-icon';
import PeopleWhiteIcon from '../../../components/icons/people-white-icon';
import ProfileIcon from '../../../components/icons/profile-icon';
import PeopleFillIcon from '../../../components/icons/people-fill-icon';
import { IoFilterOutline } from 'react-icons/io5';
import { SlOptions } from 'react-icons/sl';
import CalendarActions from '../../../components/calendar-options';
import { MultiSelect, SearchInput } from '@quillbooking/components';

/**
 * Main Calendars Component.
 */
const Calendars: React.FC = () => {
	const { callApi, loading } = useApi();
	const { callApi: deleteApi } = useApi();
	const [calendars, setCalendars] = useState<Calendar[] | null>(null);
	const [search, setSearch] = useState<string>('');
	const [filters, setFilters] = useState<{ [key: string]: string }>({
		type: 'host',
	});
	const [type, setType] = useState<string | null>(null);
	const [cloneCalendar, setCloneCalendar] = useState<Calendar | null>(null);
	const { errorNotice } = useNotice();
	const copyToClipboard = useCopyToClipboard();
	const navigate = useNavigate();
	const siteUrl = ConfigAPI.getSiteUrl();
	const typesLabels = {
		'one-to-one': __('One to One', 'quillbooking'),
		group: __('Group', 'quillbooking'),
		'round-robin': __('Round Robin', 'quillbooking'),
	};

	const fetchCalendars = async () => {
		if (loading) return;

		callApi({
			path: addQueryArgs(`calendars`, {
				per_page: 99,
				keyword: search,
				filters,
			}),
			onSuccess: (response: CalendarResponse) => {
				setCalendars(response.data);
				console.log(response);
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};

	const deleteCalendar = async (calendar: Calendar) => {
		await deleteApi({
			path: `calendars/${calendar.id}`,
			method: 'DELETE',
			onSuccess: () => {
				const updatedCalendars = filter(
					calendars,
					(c) => c.id !== calendar.id
				);
				setCalendars(updatedCalendars);
			},
			onError: (error) => {
				errorNotice(error.message);
			},
		});
	};

	useEffect(() => {
		fetchCalendars();
	}, [search, filters]);

	const handleSaved = () => {
		fetchCalendars();
	};

	const onDeleteEvent = (id: number, calendarId: number) => {
		if (!calendars) return;
		const updatedCalendars = calendars.map((calendar) => {
			if (calendar.id === calendarId) {
				calendar.events = filter(
					calendar.events,
					(event) => event.id !== id
				);
			}
			return calendar;
		});

		setCalendars(updatedCalendars);
	};

	const onDuplicateEvent = (event, calendarId) => {
		if (!calendars) return;
		const updatedCalendars = calendars.map((calendar) => {
			if (calendar.id === calendarId) {
				calendar.events.push(event);
			}
			return calendar;
		});

		setCalendars(updatedCalendars);
	};

	// const hostEventsTypes = {
	//     "one-to-one": __('One to One', 'quillbooking'),
	//     "group": __('Group', 'quillbooking'),
	// };

	const teamEventsTypes = {
		'round-robin': __('Round Robin', 'quillbooking'),
	};

	const [disabledCalendars, setDisabledCalendars] = useState({});

	const handleDisableCalendar = (calendarId) => {
		setDisabledCalendars((prev) => ({
			...prev,
			[calendarId]: !prev[calendarId], // Toggle disable state
		}));
	};

	return (
		<div className="quillbooking-calendars">
			<div className="calendars-header pb-5 flex justify-between items-center">
				<div className="calendars-header-title">
					<h1 className="text-[30px] font-[700] text-[#09090B]">
						{__('Calendars', 'quillbooking')}
					</h1>
					<span className="text-[#71717A] font-[500] text-[14px]">
						{__(
							'Create events to share for people to book on your calendar.',
							'quillbooking'
						)}
					</span>
				</div>
				<Flex gap={12}>
					<Button
						type="text"
						onClick={() => setType('host')}
						className="bg-[#FBF9FC] pt-2 pb-7 px-4 flex items-start"
					>
						<AddIcon />
						<span className="text-[#953AE4] text-[14px] font-[500]">
							{__('Add Host', 'quillbooking')}
						</span>
					</Button>
					<Button
						type="text"
						onClick={() => setType('team')}
						className="bg-[#953AE4] pt-2 pb-7 px-4 flex items-start hover:text-[#953AE4]"
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
							className={`${filters.type === 'host' ? 'bg-[#FBF9FC] text-[#953AE4]' : 'text-[#A1A5B7]'} pt-2 pb-7 px-4 flex items-start`}
						>
							<ProfileIcon />
							<span className="text-[14px] font-[500]">
								{__('Single Events', 'quillbooking')}
							</span>
						</Button>
						<Button
							type="text"
							onClick={() =>
								setFilters({ ...filters, type: 'team' })
							}
							className={`${filters.type === 'team' ? 'bg-[#FBF9FC] text-[#953AE4]' : 'text-[#A1A5B7]'} pt-2 pb-7 px-4 flex items-start`}
						>
							<PeopleFillIcon />
							<span className="text-[14px] font-[500]">
								{__('Team Events', 'quillbooking')}
							</span>
						</Button>
					</Flex>
					<Flex gap={12}>
						<SearchInput
							placeholder={__('Search Events', 'quillbooking')}
							onChange={(e) => setSearch(e.target.value)}
							size='small'
							allowClear
							className="w-[280px]"
						/>
						<MultiSelect
							options={[
								{
									value: 'all',
									label: __('Sort by : All', 'quillbooking'),
								},
								{
									value: 'host',
									label: __('Sort by : Name', 'quillbooking'),
								},
								{
									value: 'team',
									label: __('Sort by : Date', 'quillbooking'),
								},
							]}
							title={__('sort-by', 'quillbooking')}
							onChange={(value) => console.log(value)}
							Icon={IoFilterOutline}
							containerClassName='pl-2'
						/>
						<MultiSelect
							options={[
								{
									value: 'all',
									label: __(
										'By Host : Admin',
										'quillbooking'
									),
								},
							]}
							title={__('host-filter', 'quillbooking')}
							onChange={(value) => console.log(value)}
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
								{calendars
									.filter(
										(calendar) => calendar.type === 'host'
									)
									.map((calendar) => (
										<CalendarEvents
											key={calendar.id}
											calendar={calendar}
											typesLabels={typesLabels}
											onDeleted={onDeleteEvent}
											onDuplicated={onDuplicateEvent}
										/>
									))}
							</Flex>
						</Card>
					) : (
						<Flex gap={15} wrap>
							{calendars
								.filter((calendar) => calendar.type === 'team')
								.map((teamCalendar) => {
									const isDisabled =
										disabledCalendars[teamCalendar.id];
									return (
										<Card
											key={teamCalendar.id}
											title={teamCalendar.name}
											className="bg-[#FDFDFD] w-[377px]"
											headStyle={{
												backgroundColor: '#FFFFFF',
												textTransform: 'uppercase',
											}}
											style={{
												opacity: isDisabled ? 0.5 : 1,
												pointerEvents: isDisabled
													? 'none'
													: 'auto',
											}}
											extra={
												<div>
													<Popover
														trigger={['click']}
														content={
															<CalendarActions
																calendar={
																	teamCalendar
																} // Pass the current calendar
																onEdit={(id) =>
																	navigate(
																		`calendars/${id}/general`
																	)
																}
																onDisable={(
																	id
																) =>
																	handleDisableCalendar(
																		id
																	)
																}
																isDisabled={
																	isDisabled
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
																		{id: id} as Calendar
																	)
																}
															/>
															// <Flex vertical gap={10} className='items-start text-[#292D32]'>
															//     <Button
															//         type="text"
															//         icon={<EditIcon />}
															//         onClick={() => navigate(`calendars/${teamCalendar.id}/general`)}
															//     >
															//         {__('Edit', 'quillbooking')}
															//     </Button>
															//     <Button
															//         type="text"
															//         onClick={() => handleDisableCalendar(teamCalendar.id)}
															//         icon={<DisableIcon />}
															//     >
															//         {isDisabled ? __('Enable', 'quillbooking') : __('Disable', 'quillbooking')}
															//     </Button>
															//     <Button
															//         type="text"
															//         icon={<CloneIcon />}
															//         onClick={() => setCloneCalendar(teamCalendar)}
															//     >{__('Clone Events', 'quillbooking')}
															//     </Button>
															//     <Popconfirm
															//         title={__('Are you sure to delete this calendar?', 'quillbooking')}
															//         onConfirm={() => deleteCalendar(teamCalendar)}
															//         okText={__('Yes', 'quillbooking')}
															//         cancelText={__('No', 'quillbooking')}
															//     >
															//         <Button type="text" icon={<TrashIcon />}>{__('Delete', 'quillbooking')}</Button>
															//     </Popconfirm>
															// </Flex>
														}
													>
														<Button
															type="text"
															icon={
																<SlOptions className="text-[#292D32] text-[18px]" />
															}
															className="border-[#EDEBEB]"
														/>
													</Popover>
												</div>
											}
										>
											<Flex vertical gap={20}>
												{filters.type == 'team' && (
													<Popover
														trigger={['click']}
														content={
															<Flex
																vertical
																gap={10}
															>
																{map(
																	teamEventsTypes,
																	(
																		label,
																		type
																	) => (
																		<Button
																			type="text"
																			key={
																				type
																			}
																			onClick={() => {
																				navigate(
																					`calendars/${teamCalendar.id}/create-event/${type}`
																				);
																			}}
																		>
																			{
																				label
																			}
																		</Button>
																	)
																)}
															</Flex>
														}
													>
														<Button className="text-[#953AE4] border-2 border-[#C497EC] bg-[#FBF9FC] border-dashed font-[600] flex items-center justify-center h-[56px] w-[310px] text-[16px]">
															<PlusOutlined className="text-[#953AE4]" />
															<span className="pt-[8.5px]">
																{__(
																	'Create New Event Type',
																	'quillbooking'
																)}
															</span>
														</Button>
													</Popover>
												)}
												<CalendarEvents
													key={teamCalendar.id}
													calendar={teamCalendar}
													typesLabels={typesLabels}
													onDeleted={onDeleteEvent}
													onDuplicated={
														onDuplicateEvent
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
			{/* {loading || !calendars ? <Skeleton active /> : (
                <Flex gap={20} vertical>
                    {calendars.map((calendar) => (
                        <Card key={calendar.id}>
                            <Flex vertical gap={20}>
                                <Flex justify="space-between" align="center">
                                    <Flex gap={10}>
                                        <Avatar size="large" icon={<UserOutlined />} />
                                        <Flex vertical gap={0}>
                                            <Typography.Title level={5} style={{ margin: 0 }}>{calendar.name}</Typography.Title>
                                            <Typography.Link href={`${siteUrl}?quillbooking_calendar=${calendar.slug}`} target="_blank">
                                                {`${siteUrl}?quillbooking_calendar=${calendar.slug}`}
                                            </Typography.Link>
                                        </Flex>
                                    </Flex>
                                    <Flex gap={10}>
                                        <Popover
                                            trigger={['click']}
                                            content={(
                                                <Flex vertical gap={10}>
                                                    {calendar.type === 'host' && (
                                                        <>
                                                            {map(hostEventsTypes, (label, type) => (
                                                                <Button
                                                                    type="text"
                                                                    key={type}
                                                                    onClick={() => {
                                                                        navigate(`calendars/${calendar.id}/create-event/${type}`);
                                                                    }}
                                                                >
                                                                    {label}
                                                                </Button>
                                                            ))}
                                                        </>
                                                    )}
                                                    {calendar.type === 'team' && (
                                                        <>
                                                            {map(teamEventsTypes, (label, type) => (
                                                                <Button
                                                                    type="text"
                                                                    key={type}
                                                                    onClick={() => {
                                                                        navigate(`calendars/${calendar.id}/create-event/${type}`);
                                                                    }}
                                                                >
                                                                    {label}
                                                                </Button>
                                                            ))}
                                                        </>
                                                    )}
                                                </Flex>
                                            )}
                                        >
                                            <Button icon={<PlusOutlined />}>{__('Add New Event', 'quillbooking')}</Button>
                                        </Popover>
                                        <Popover
                                            trigger={['click']}
                                            content={(
                                                <Flex vertical gap={10}>
                                                    <Button
                                                        type="text"
                                                        icon={<SettingOutlined />}
                                                        onClick={() => navigate(`calendars/${calendar.id}/general`)}
                                                    >
                                                        {__('Edit', 'quillbooking')}
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        icon={<CopyOutlined />}
                                                        onClick={() => setCloneCalendar(calendar)}
                                                    >{__('Clone Events', 'quillbooking')}
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        onClick={() => copyToClipboard(`${siteUrl}?quillbooking_calendar=${calendar.slug}`, __('Link copied', 'quillbooking'))}
                                                        icon={<LinkOutlined />}
                                                    >
                                                        {__('Copy Link', 'quillbooking')}
                                                    </Button>
                                                    <Popconfirm
                                                        title={__('Are you sure to delete this calendar?', 'quillbooking')}
                                                        onConfirm={() => deleteCalendar(calendar)}
                                                        okText={__('Yes', 'quillbooking')}
                                                        cancelText={__('No', 'quillbooking')}
                                                    >
                                                        <Button type="text" icon={<DeleteOutlined />}>{__('Delete', 'quillbooking')}</Button>
                                                    </Popconfirm>
                                                </Flex>
                                            )}
                                        >
                                            <Button icon={<SettingOutlined />} />
                                        </Popover>
                                    </Flex>
                                </Flex>
                                <CalendarEvents calendar={calendar} typesLabels={typesLabels} onDeleted={onDeleteEvent} onDuplicated={onDuplicateEvent} />
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )} */}
			{type && (
				<AddCalendarModal
					open={!!type}
					type={type}
					onClose={() => setType(null)}
					excludedUsers={map(calendars, 'user_id')}
					onSaved={handleSaved}
				/>
			)}
			{cloneCalendar && (
				<CloneEventModal
					open={!!cloneCalendar}
					calendar={cloneCalendar}
					onClose={() => setCloneCalendar(null)}
					excludedEvents={map(cloneCalendar.events, 'id')}
					onSaved={handleSaved}
				/>
			)}
		</div>
	);
};

export default Calendars;

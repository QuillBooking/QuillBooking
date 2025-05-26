/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Input,
	Button,
	Card,
	Flex,
	Steps,
	Modal,
	Checkbox,
	Select,
} from 'antd';

/**
 * Internal dependencies
 */
import {
	GroupIcon,
	Header,
	RoundRobinIcon,
	ShareEventIcon,
	SingleIcon,
	Locations,
	ColorSelector,
	NoticeBanner,
} from '@quillbooking/components';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import type {
	Event,
	AdditionalSettings,
	Host,
	NoticeMessage,
} from '@quillbooking/client';
import './style.scss';

/**
 * Create Event Component.
 */
const { Step } = Steps;

interface CreateEventProps {
	visible: boolean;
	setVisible: (val: boolean) => void;
	onClose: () => void;
	calendarType: string;
	calendarId: number;
}

const CreateEvent: React.FC<CreateEventProps> = ({
	visible,
	setVisible,
	onClose,
	calendarType,
	calendarId,
}) => {
	const [current, setCurrent] = useState(0);
	const { callApi, loading } = useApi();
	const { successNotice } = useNotice();
	const navigate = useNavigate();
	const [teamMembers, setTeamMembers] = useState<Host[]>([]);
	const [event, setEvent] = useState<Partial<Event>>({
		name: '',
		description: '',
		type: undefined,
		calendar_id: calendarId,
		status: 'active',
		duration: 30,
		color: '',
		visibility: 'public',
		location: [],
		hosts: [],
		additional_settings: {
			max_invitees: 1,
			show_remaining: true,
			selectable_durations: [],
			default_duration: 15,
			allow_attendees_to_select_duration: false,
			allow_additional_guests: false,
		},
	});

	const [validationErrors, setValidationErrors] = useState({
		name: false,
		location: false,
		members: false,
	});

	const [errorBanner, setErrorBanner] = useState<NoticeMessage | null>(null);

	const next = () => {
		// For step 1 (current === 0), we only need to check event.type
		if (current === 0) {
			if (!event.type) {
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'quillbooking'),
					message: __('Please select an event type', 'quillbooking'),
				});
				return;
			}

			if (
				calendarType === 'team' &&
				(!event.hosts || event.hosts.length === 0)
			) {
				setValidationErrors((prev) => ({ ...prev, members: true }));
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'quillbooking'),
					message: __(
						'Please select at least one team member',
						'quillbooking'
					),
				});
				return;
			}
		}

		// For step 2 (current === 1), validate name and description
		if (current === 1) {
			const errors = {
				name: !event.name,
				location: false,
				members: false,
			};

			setValidationErrors(errors);

			if (errors.name) {
				setErrorBanner({
					type: 'error',
					title: __('Validation Error', 'quillbooking'),
					message: __('Please enter an event name', 'quillbooking'),
				});
				return;
			}
		}

		setErrorBanner(null);
		setCurrent((prev) => prev + 1);
	};
	const prev = () => setCurrent((prev) => prev - 1);

	const durations = [
		{
			value: 15,
			label: __('15 Minutes', 'quillbooking'),
			description: __('Quick Check-in', 'quillbooking'),
		},
		{
			value: 30,
			label: __('30 Minutes', 'quillbooking'),
			description: __('Standard Consultation', 'quillbooking'),
		},
		{
			value: 60,
			label: __('60 Minutes', 'quillbooking'),
			description: __('In-depth discussion', 'quillbooking'),
		},
	];

	const handleChange = (key: string, value: any) => {
		setEvent({ ...event, [key]: value });
	};

	const handleAdditionalSettingsChange = (
		key: keyof AdditionalSettings,
		value: any
	) => {
		if (!event.additional_settings) {
			// Initialize additional_settings if it doesn't exist
			setEvent({
				...event,
				additional_settings: {
					max_invitees: 1,
					show_remaining: true,
					selectable_durations: [],
					default_duration: 15,
					allow_attendees_to_select_duration: false,
					allow_additional_guests: false,
					[key]: value,
				},
			});
		} else {
			// Update existing additional_settings
			setEvent({
				...event,
				additional_settings: {
					...event.additional_settings,
					[key]: value,
				},
			});
		}
	};

	const handleSubmit = () => {
		if (!event.name || !event.location || event.location.length === 0) {
			setValidationErrors({
				name: !event.name,
				location: !event.location || event.location.length === 0,
				members: !event.hosts,
			});

			setErrorBanner({
				type: 'error',
				title: __('Validation Error', 'quillbooking'),
				message: __(
					'Please fill in all required fields',
					'quillbooking'
				),
			});
			return;
		}

		// Transform event.hosts to an array of ids
		const transformedEvent = {
			...event,
			hosts: event.hosts?.map((host) => host.id) || [],
		};

		callApi({
			path: 'events',
			method: 'POST',
			data: transformedEvent,
			onSuccess: (response: Event) => {
				successNotice(__('Event created successfully', 'quillbooking'));
				// Navigate without state to avoid type error
				navigate(`calendars/${calendarId}/events/${response.id}`);

				// Show success message instead
				successNotice(
					'Complete Your Setup: The event has been created successfully. Please complete your event setup and settings to finish.'
				);
			},
			onError: (error: string) => {
				setErrorBanner({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: error,
				});
			},
		});
	};

	const fetchCalendarTeam = () => {
		callApi({
			path: 'calendars/' + calendarId + '/team',
			method: 'GET',
			onSuccess: (response: any[]) => {
				const transformedHosts: Host[] = response.map((member) => ({
					id: member.ID,
					name: member.display_name,
					image: '', // or member.image if available
					availabilities: {}, // optional, if not needed you can omit
				}));
				setTeamMembers(transformedHosts);
			},
		});
	};

	useEffect(() => {
		fetchCalendarTeam();
	}, []);

	const steps = [
		{
			title: 'Select Event Type',
			content: (
				<Flex vertical>
					{/* {calendarType !== 'team' && currentUser.isAdmin() && (
                        <Flex gap={1} vertical className=''>
                            <div className="text-[#09090B] text-[16px]">
                                {__("Select Event Host", "quillbooking")}
                                <span className='text-red-500'>*</span>
                            </div>
                            <HostSelect
                                value={event.user_id || 0}
                                onChange={(userId) => {
                                    handleChange('user_id', userId);
                                    setSelectedUser(userId);
                                }}
                                placeholder={__('Select Host', 'quillbooking')}
                                defaultValue={0}
                                selectFirstHost={false}
                            />
                            <span className='text-[#818181] text-[12px]'>{__("Please select the hosts you want to assign to this event", "quillbooking")}</span>
                        </Flex>
                    )} */}
					{calendarType === 'team' && (
						<Flex gap={1} vertical className="">
							<div className="text-[#09090B] text-[16px]">
								{__('Select Team Members', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<Select
								mode="multiple"
								placeholder="Select team members"
								value={event.hosts?.map((host) => host.id)}
								onChange={(selectedIds) => {
									const selectedHosts = teamMembers.filter(
										(member) =>
											selectedIds.includes(member.id)
									);
									setEvent({
										...event,
										hosts: selectedHosts,
									});
									setValidationErrors((prev) => ({
										...prev,
										members: false,
									}));
								}}
								options={teamMembers.map((member) => ({
									label: member.name,
									value: member.id,
								}))}
								style={{ width: '100%' }}
							/>
							{validationErrors.members && (
								<span className="text-red-500 text-sm">
									{__(
										'At least one team member is required',
										'quillbooking'
									)}
								</span>
							)}
							<span className="text-[#818181] text-[12px]">
								{__(
									'Select the members you want to assign to this team.',
									'quillbooking'
								)}
							</span>
						</Flex>
					)}
					{calendarType === 'team' && (
						<Flex vertical gap={20} className="mt-5">
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'round-robin' })
								}
								className={`cursor-pointer rounded-xl border-2 pl-2 ${
									event.type === 'round-robin'
										? 'border-color-primary'
										: ''
								}`}
							>
								<Flex gap={15} align="center">
									<RoundRobinIcon />
									<Flex vertical>
										<h3 className="text-[#2E2C2F] text-[18px] font-bold">
											{__('Round Robin', 'quillbooking')}
										</h3>
										<span className="text-[14px] text-[#979797]">
											<span className="font-semibold mr-1">
												{__(
													'One rotating host',
													'quillbooking'
												)}
											</span>
											{__('with', 'quillbooking')}
											<span className="font-semibold ml-1">
												{__(
													'One Invitee',
													'quillbooking'
												)}
											</span>
										</span>
										<span className="text-[12px] text-[#979797]">
											{' '}
											{__(
												'Good for Distributing Incoming Sales Leads.',
												'quillbooking'
											)}
										</span>
									</Flex>
								</Flex>
							</Card>
							{/* <Card
                                onClick={() =>
                                    setEvent({ ...event, type: 'round-robin' })
                                }
                                className={`cursor-pointer rounded-xl border-2 pl-2 ${event.type === 'round-robin'
                                    ? 'border-color-primary'
                                    : ''
                                    }`}
                            >
                             <Flex gap={15} align='center'>
                                    <CollectiveIcon />
                                    <Flex vertical>
                                        <h3 className="text-[#2E2C2F] text-[18px] font-bold">{__('Collective', 'quillbooking')}</h3>
                                        <span className="text-[14px] text-[#979797]">
                                            <span className='font-semibold mr-1'>{__('Multi Hosts', 'quillbooking')}</span>
                                            {__('with', 'quillbooking')}
                                            <span className='font-semibold ml-1'>{__('One Invitee', 'quillbooking')}</span>
                                        </span>
                                        <span className="text-[12px] text-[#979797]"> {__('Good for Panel Interviews, Group Sales Calls, etc.', 'quillbooking')}</span>

                                    </Flex>
                                </Flex> 
                            </Card> */}
						</Flex>
					)}

					{calendarType !== 'team' && (
						<Flex vertical gap={20} className="mt-5">
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'one-to-one' })
								}
								className={`cursor-pointer rounded-xl border-2 pl-2 ${
									event.type === 'one-to-one'
										? 'border-color-primary'
										: ''
								}`}
							>
								<Flex gap={15} align="center">
									<SingleIcon />
									<Flex vertical>
										<h3 className="text-[#2E2C2F] text-[18px] font-bold">
											{__('Single Event', 'quillbooking')}
										</h3>
										<span className="text-[14px] text-[#979797]">
											<span className="font-semibold mr-1">
												{__(
													'Invite Someone',
													'quillbooking'
												)}
											</span>
											{__(
												'to pick a time to meet with',
												'quillbooking'
											)}
											<span className="font-semibold ml-1">
												{__('hosts.', 'quillbooking')}
											</span>
										</span>
										<span className="text-[12px] text-[#979797]">
											{' '}
											{__(
												'good for higher priority meetings',
												'quillbooking'
											)}
										</span>
									</Flex>
								</Flex>
							</Card>
							<Card
								onClick={() =>
									setEvent({ ...event, type: 'group' })
								}
								className={`cursor-pointer rounded-xl border-2 pl-2 ${
									event.type === 'group'
										? 'border-color-primary'
										: ''
								}`}
							>
								<Flex gap={15} align="center">
									<GroupIcon />
									<Flex vertical>
										<h3 className="text-[#2E2C2F] text-[18px] font-bold">
											{__('Group Event', 'quillbooking')}
										</h3>
										<span className="text-[14px] text-[#979797]">
											<span className="font-semibold mr-1">
												{__(
													'Reserve Spots',
													'quillbooking'
												)}
											</span>
											{__(
												'for a Scheduled event with',
												'quillbooking'
											)}
											<span className="font-semibold ml-1">
												{__('hosts.', 'quillbooking')}
											</span>
										</span>
										<span className="text-[12px] text-[#979797]">
											{' '}
											{__(
												'good for reservation or ticketing system.',
												'quillbooking'
											)}
										</span>
									</Flex>
								</Flex>
							</Card>
						</Flex>
					)}
				</Flex>
			),
		},
		{
			title: 'Event Name & Duration',
			content: (
				<Flex gap={20} className="w-[1000px]">
					<Card className="w-1/2">
						<Flex vertical>
							<Flex gap={1} vertical>
								<div className="text-[#09090B] text-[16px]">
									{__('Event Calendar Name', 'quillbooking')}
									<span className="text-red-500">*</span>
								</div>
								<Input
									value={event.name}
									onChange={(e) => {
										handleChange('name', e.target.value);
										setValidationErrors((prev) => ({
											...prev,
											name: false,
										}));
									}}
									placeholder={__(
										'Enter name of this event calendar',
										'quillbooking'
									)}
									className="h-[48px] rounded-lg"
									status={
										validationErrors.name ? 'error' : ''
									}
								/>
								{validationErrors.name && (
									<span className="text-red-500 text-sm">
										{__(
											'Event name is required',
											'quillbooking'
										)}
									</span>
								)}
							</Flex>
							<Flex gap={1} vertical className="mt-4">
								<div className="text-[#09090B] text-[16px]">
									{__('Description', 'quillbooking')}
								</div>
								<Input.TextArea
									value={event.description || ''}
									onChange={(e) => {
										handleChange(
											'description',
											e.target.value
										);
									}}
									placeholder={__(
										'type your Description',
										'quillbooking'
									)}
									rows={4}
									className="rounded-lg"
								/>
							</Flex>
						</Flex>
						<Flex gap={1} vertical className="mt-4">
							<div className="text-[#09090B] text-[16px]">
								{__('Event Color', 'quillbooking')}
							</div>
							<div className="flex flex-wrap gap-4 place-items-center mt-2">
								<ColorSelector
									selectedColor={event.color || null}
									onColorSelect={(color) =>
										handleChange('color', color)
									}
								/>
							</div>
						</Flex>
					</Card>
					<Flex vertical gap={20} className="w-1/2">
						<Card>
							<Flex vertical gap={20}>
								<Flex vertical gap={8} className="">
									<div className="text-[#09090B] text-[16px]">
										{__('Meeting Duration', 'quillbooking')}
										<span className="text-red-500">*</span>
									</div>
									<Flex gap={20} className="flex-wrap">
										{durations.map((item) => (
											<Card
												key={item.value}
												className={`cursor-pointer transition-all rounded-lg w-[200px]
                                                                ${event.duration == item.value ? 'border-color-primary bg-[#F1E0FF]' : 'border-[#f0f0f0]'}`}
												onClick={() =>
													handleChange(
														'duration',
														item.value
													)
												}
												bodyStyle={{
													paddingTop: '18px',
												}}
											>
												<div
													className={`font-semibold ${event.duration == item.value ? 'text-color-primary' : 'text-[#1E2125]'}`}
												>
													{item.label}
												</div>
												<div className="text-[#1E2125] mt-[6px]">
													{item.description}
												</div>
											</Card>
										))}
									</Flex>
								</Flex>
								<Flex gap={20} className="items-center">
									<div className="text-[#09090B] text-[16px]">
										{__('Custom Duration', 'quillbooking')}
									</div>
									<Input
										type="number"
										suffix={
											<span className="border-l pl-3">
												{__('Min', 'quillbooking')}
											</span>
										}
										className="h-[48px] rounded-lg flex items-center w-[194px]"
										value={event.duration}
										onChange={(e) =>
											handleChange(
												'duration',
												e.target.value
											)
										}
									/>
								</Flex>
							</Flex>
						</Card>
						{event.type == 'group' && (
							<Card>
								<Flex gap={20} vertical>
									<Flex vertical gap={8}>
										<div className="text-[#09090B] text-[16px]">
											{__(
												'Max invitees in a spot',
												'quillbooking'
											)}
											<span className="text-red-500">
												*
											</span>
										</div>
										<Input
											type="number"
											value={
												event.additional_settings
													?.max_invitees
											}
											onChange={(e) =>
												handleAdditionalSettingsChange(
													'max_invitees',
													Number(e.target.value)
												)
											}
											placeholder={__(
												'Enter Max invitees',
												'quillbooking'
											)}
											className="h-[48px] rounded-lg"
										/>
									</Flex>
									<Checkbox
										checked={
											event.additional_settings
												?.show_remaining
										}
										onChange={(e) =>
											handleAdditionalSettingsChange(
												'show_remaining',
												e.target.checked
											)
										}
										className="custom-check text-[#5E6278] font-semibold"
									>
										{__(
											'Display Remaining Spots on Booking Page',
											'quillbooking'
										)}
									</Checkbox>
								</Flex>
							</Card>
						)}
					</Flex>
				</Flex>
			),
		},
		{
			title: 'Setup Location',
			content: (
				<Card className="">
					<Flex vertical gap={20}>
						<Flex className="justify-between">
							<div className="text-[#09090B] text-[16px]">
								{__('How Will You Meet', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<div className="text-[#848484] italic">
								{__(
									'You Can Select More Than One',
									'quillbooking'
								)}
							</div>
						</Flex>
						<div className="grid grid-cols-2 gap-[15px]">
							<Locations
								locations={event.location || []}
								onChange={(locations) => {
									handleChange('location', locations);
									setValidationErrors((prev) => ({
										...prev,
										location: false,
									}));
								}}
								onKeepDialogOpen={() => setVisible(true)}
								connected_integrations={
									event.connected_integrations || {
										apple: {
											name: 'apple',
											connected: false,
										},
										google: {
											name: 'google',
											connected: false,
										},
										outlook: {
											name: 'outlook',
											connected: false,
										},
										twilio: {
											name: 'twilio',
											connected: false,
										},
										zoom: {
											name: 'zoom',
											connected: false,
										},
									}
								}
							/>
						</div>
						{validationErrors.location && (
							<span className="text-red-500 text-sm">
								{__(
									'At least one location is required',
									'quillbooking'
								)}
							</span>
						)}
					</Flex>
				</Card>
			),
		},
	];

	return (
		<Modal
			open={visible}
			onCancel={onClose}
			footer={null}
			destroyOnClose
			zIndex={120000}
			className="w-fit"
		>
			<Flex vertical className="quillbooking-create-event">
				<Flex gap={10} className="items-center pb-8">
					<ShareEventIcon />
					<Header
						header={__('Create a new event', 'quillbooking')}
						subHeader={__(
							'Add the following data to Create New Event Type.',
							'quillbooking'
						)}
					/>
				</Flex>
				{errorBanner && (
					<NoticeBanner
						notice={errorBanner}
						closeNotice={() => setErrorBanner(null)}
					/>
				)}
				<Steps
					current={current}
					size="small"
					className="mb-6 custom-steps bg-[#FBF9FC] px-14 py-6"
				>
					{steps.map((item) => (
						<Step key={item.title} title={item.title} />
					))}
				</Steps>

				<div className="mb-6">{steps[current].content}</div>

				<Flex className="items-center justify-end" gap={10}>
					{current > 0 && (
						<Button
							onClick={prev}
							loading={loading}
							className="bg-[#FBF9FC] text-color-primary text-[16px] px-16 font-semibold rounded-lg border-none"
						>
							{__('Back', 'quillbooking')}
						</Button>
					)}
					{current < steps.length - 1 ? (
						<Button
							type="primary"
							onClick={next}
							loading={loading}
							disabled={
								(current === 0 && !event.type) ||
								(current === 1 && !event.name) ||
								(current === 2 && !event.location)
							}
							className={`rounded-lg px-12 font-semibold text-[16px] text-white bg-color-primary border-none transition ${
								current === 0
									? 'w-full' // custom style for step 0
									: '' // other steps
							}`}
						>
							{__('Continue', 'quillbooking')}
						</Button>
					) : (
						<Button
							type="primary"
							onClick={handleSubmit}
							loading={loading}
							disabled={
								!event.location || event.location.length === 0
							}
							className="bg-color-primary px-8 text-white text-[16px] font-semibold rounded-lg border-none"
						>
							{__('Submit Event', 'quillbooking')}
						</Button>
					)}
				</Flex>
			</Flex>
		</Modal>
	);
};

export default CreateEvent;

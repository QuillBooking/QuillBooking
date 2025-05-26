/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Skeleton } from 'antd';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import EventInfo from './event-info';
import LivePreview from './live-preview';
import Duration from './duration';
import GroupSettings from './group-settings';
import {
	CardHeader,
	EventLocIcon,
	NoticeBanner,
	Locations,
} from '@quillbooking/components';
import { EventTabHandle } from 'client/types';

const EventDetailsShimmer = () => {
	return (
		<div className="w-full px-9">
			<div className="grid grid-cols-2 gap-5">
				<Flex vertical gap={20}>
					<Card>
						<Flex vertical gap={20}>
							<Skeleton.Input
								active
								block
								style={{ height: 40 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 32 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 100 }}
							/>
							<Flex gap={10}>
								<Skeleton.Button active style={{ width: 80 }} />
								<Skeleton.Button active style={{ width: 80 }} />
							</Flex>
						</Flex>
					</Card>
					<Card>
						<Flex vertical gap={20}>
							<Skeleton.Input
								active
								block
								style={{ height: 32 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 40 }}
							/>
							<Flex gap={10}>
								<Skeleton.Button active style={{ width: 60 }} />
								<Skeleton.Button active style={{ width: 60 }} />
								<Skeleton.Button active style={{ width: 60 }} />
							</Flex>
						</Flex>
					</Card>
				</Flex>
				<Flex vertical gap={20}>
					<Card>
						<Skeleton.Input active block style={{ height: 200 }} />
					</Card>
					<Card>
						<Flex vertical gap={20}>
							<Skeleton.Input
								active
								block
								style={{ height: 32 }}
							/>
							<Skeleton.Input
								active
								block
								style={{ height: 40 }}
							/>
							<Flex gap={10}>
								<Skeleton.Button
									active
									style={{ width: 120 }}
								/>
								<Skeleton.Button
									active
									style={{ width: 120 }}
								/>
							</Flex>
						</Flex>
					</Card>
				</Flex>
			</div>
		</div>
	);
};

/**
 * Event General Settings Component.
 */
interface EventDetailsProps {
	onKeepDialogOpen: () => void;
	notice: { title: string; message: string } | null;
	clearNotice: () => void;
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

const EventDetails = forwardRef<EventTabHandle, EventDetailsProps>(
	({ onKeepDialogOpen, notice, clearNotice, disabled, setDisabled }, ref) => {
		const { state: event, actions } = useEventContext();
		const { callApi } = useApi();
		const { successNotice } = useNotice();
		const setBreadcrumbs = useBreadcrumbs();
		const [durationMode, setDurationMode] = useState<'preset' | 'custom'>(
			'preset'
		);
		const [isInitialLoading, setIsInitialLoading] = useState(true);

		useEffect(() => {
			if (event) {
				setIsInitialLoading(false);
			}
			console.log('Event Details Component Mounted', event);
		}, [event]);

		// Implement useImperativeHandle to expose the saveSettings method
		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (event) {
					return saveSettings();
				}
				return Promise.resolve();
			},
		}));

		useEffect(() => {
			if (!event) {
				return;
			}

			setBreadcrumbs([
				{
					path: `calendars/${event.calendar_id}/events/${event.id}/general`,
					title: __('General', 'quillbooking'),
				},
			]);

			const isCustomDuration = ![15, 30, 45, 60].includes(event.duration);
			setDurationMode(isCustomDuration ? 'custom' : 'preset');
		}, []);

		if (isInitialLoading) {
			return <EventDetailsShimmer />;
		}

		if (!event) {
			return null;
		}

		const saveSettings = async () => {
			if (!validate()) return;
			return callApi({
				path: `events/${event.id}`,
				method: 'PUT',
				data: event,
				onSuccess: (response) => {
					// Update the event state with the response data
					actions.setEvent(response);
					successNotice(
						__('Event settings saved successfully', 'quillbooking')
					);
					setDisabled(true);
				},
				onError: (error) => {
					throw new Error(error.message);
				},
			});
		};

		const handleChange = (key: string, value: any) => {
			actions.setEvent({ ...event, [key]: value });
			setDisabled(false);
		};

		const handleAdditionalSettingsChange = (key: string, value: any) => {
			actions.setEvent({
				...event,
				additional_settings: {
					...event.additional_settings,
					[key]: value,
				},
			});
			setDisabled(false);
		};

		const handleGroupSettingsChange = (
			key: 'max_invites' | 'show_remaining',
			value: number | boolean
		) => {
			actions.setEvent({
				...event,
				group_settings: {
					max_invites:
						key === 'max_invites'
							? (value as number)
							: (event.group_settings?.max_invites ?? 30),
					show_remaining:
						key === 'show_remaining'
							? (value as boolean)
							: (event.group_settings?.show_remaining ?? true),
				},
			});
			setDisabled(false);
		};

		const validate = () => {
			if (!event.name) {
				throw new Error(
					__('Please enter a name for the event.', 'quillbooking')
				);
			}

			if (!event.duration || event.duration <= 0) {
				throw new Error(
					__(
						'Please enter a valid duration for the event.',
						'quillbooking'
					)
				);
			}

			if (
				event.additional_settings.allow_attendees_to_select_duration &&
				event.additional_settings.selectable_durations.length === 0
			) {
				throw new Error(
					__(
						'Please select at least one duration for the event.',
						'quillbooking'
					)
				);
			}

			return true;
		};

		const getDefaultDurationOptions = () => {
			const options = get(
				event,
				'additional_settings.selectable_durations'
			)
				? get(event, 'additional_settings.selectable_durations').map(
						(duration) => ({
							value: duration,
							label: `${duration} minutes`,
						})
					)
				: [];

			return options;
		};

		return (
			<div className="w-full px-9">
				{notice && (
					<NoticeBanner
						notice={{
							type: 'success',
							title: notice.title,
							message: notice.message,
						}}
						closeNotice={clearNotice}
					/>
				)}
				<div className="grid grid-cols-2 gap-5">
					<Flex vertical gap={20}>
						<EventInfo
							name={event.name}
							hosts={event.hosts || []}
							description={event.description}
							color={event.color}
							onChange={handleChange}
						/>
						<Flex vertical gap={20}>
							<Duration
								duration={event.duration}
								onChange={handleChange}
								handleAdditionalSettingsChange={
									handleAdditionalSettingsChange
								}
								getDefaultDurationOptions={
									getDefaultDurationOptions
								}
								allow_attendees_to_select_duration={
									event.additional_settings
										.allow_attendees_to_select_duration
								}
								selectable_durations={
									event.additional_settings
										.selectable_durations
								}
								default_duration={
									event.additional_settings.default_duration
								}
							/>
							{event.type === 'group' && (
								<GroupSettings
									maxInvites={
										event.group_settings?.max_invites ?? 2
									}
									showRemaining={
										event.group_settings?.show_remaining ??
										true
									}
									onChange={handleGroupSettingsChange}
								/>
							)}
						</Flex>
					</Flex>
					<Flex vertical gap={20}>
						<LivePreview
							name={event.name}
							hosts={event.hosts || []}
							duration={event.duration}
							locations={event.location}
						/>
						<Card>
							<Flex vertical gap={20}>
								<CardHeader
									title={__('Event Location', 'quillbooking')}
									description={__(
										'Select Where you will Meet Guests.',
										'quillbooking'
									)}
									icon={<EventLocIcon />}
								/>
								<Flex className="justify-between">
									<div className="text-[#09090B] text-[16px]">
										{__(
											'How Will You Meet',
											'quillbooking'
										)}
										<span className="text-red-500">*</span>
									</div>
									<div className="text-[#848484] italic">
										{__(
											'You Can Select More Than One',
											'quillbooking'
										)}
									</div>
								</Flex>
								<Flex vertical gap={15}>
									<Locations
										locations={event.location}
										connected_integrations={
											event.connected_integrations
										}
										onChange={(updatedLocations) =>
											handleChange(
												'location',
												updatedLocations
											)
										}
										onKeepDialogOpen={onKeepDialogOpen}
										calendar={event.calendar}
									/>
								</Flex>
							</Flex>
						</Card>
					</Flex>
				</div>
			</div>
		);
	}
);

export default EventDetails;

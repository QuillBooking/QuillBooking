/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Skeleton, Flex, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import WebhookFeedComponent from './webhook-feed-modal';
import {
	AddWebhookIcon,
	CardHeader,
	EditIcon,
	NoWebhookIcon,
	TrashIcon,
	VerifyIcon,
	WebhookListIcon,
} from '@quillbooking/components';

const WebhookFeedsShimmer = () => {
	return (
		<Flex gap={20} className="webhook-feeds-tab w-full px-9">
			<Card className="w-full">
				<Flex
					justify="space-between"
					align="center"
					className="border-b"
				>
					<Flex gap={12} className="items-center mb-4">
						<div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
						<Flex vertical gap={2}>
							<div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
							<div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
						</Flex>
					</Flex>
					<div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
				</Flex>

				<Flex vertical gap={30} className="w-full mt-6">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="webhook-feed-card">
							<Flex vertical gap={30}>
								<Flex justify="space-between" align="center">
									<Flex vertical gap={2}>
										<div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
										<div className="h-5 bg-gray-200 rounded w-96 animate-pulse" />
									</Flex>
									<Flex gap={25} align="center">
										<div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse" />
										<div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
										<div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
									</Flex>
								</Flex>
								<Flex gap={15} wrap>
									{[1, 2, 3].map((j) => (
										<div
											key={j}
											className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"
										/>
									))}
								</Flex>
							</Flex>
						</Card>
					))}
				</Flex>
			</Card>
		</Flex>
	);
};

export type WebhookFeedType = {
	name: string;
	url: string;
	method: string;
	format: string;
	hasHeaders: boolean;
	headers: { header: string; value: string }[];
	hasBodyFields: boolean;
	bodyFields: { field: string; value: string }[];
	triggers: string[];
	enabled: boolean;
};

interface EventWebhookProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface EventWebhookHandle {
	saveSettings: () => Promise<void>;
}

const WebhookFeedsTab = forwardRef<EventWebhookHandle, EventWebhookProps>(
	(props, ref) => {
		const { state: event } = useEventContext();
		const { callApi, loading } = useApi();
		const { callApi: saveApi } = useApi();
		const { callApi: deleteApi } = useApi();
		const { successNotice } = useNotice();
		const [webhookFeeds, setWebhookFeeds] = useState<
			WebhookFeedType[] | null
		>(null);
		const [editingWebhookFeed, setEditingWebhookFeed] =
			useState<WebhookFeedType | null>(null);
		const [showEditor, setShowEditor] = useState(false);

		// Expose saveSettings method to parent component
		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (webhookFeeds) {
					return saveWebhookFeeds(webhookFeeds);
				}
				return Promise.resolve();
			},
		}));

		useEffect(() => {
			if (event) {
				fetchWebhookFeeds();
			}
		}, [event]);

		const fetchWebhookFeeds = () => {
			if (!event) return;
			callApi({
				path: `events/${event.id}/meta/webhook_feeds`,
				method: 'GET',
				onSuccess(response: WebhookFeedType[]) {
					setWebhookFeeds(response);
				},
				onError(error) {
					throw new Error(error.message);
				},
			});
		};

		console.log(webhookFeeds);

		const handleSave = (values: WebhookFeedType) => {
			const updatedWebhookFeeds = editingWebhookFeed
				? webhookFeeds?.map((feed) =>
						feed.name === editingWebhookFeed.name
							? { ...feed, ...values }
							: feed
					)
				: [...(webhookFeeds || []), values];

			if (!updatedWebhookFeeds) return;

			setWebhookFeeds(updatedWebhookFeeds);
			props.setDisabled(false); // Enable the Save Changes button
			setEditingWebhookFeed(null);
			setShowEditor(false);
		};

		const saveWebhookFeeds = async (feeds: WebhookFeedType[]) => {
			try {
				if (!event) {
					console.warn('Cannot save webhook feeds - no event available');
					return;
				}
		
				await saveApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						webhook_feeds: feeds,
					},
					onSuccess() {
						successNotice(
							__('Webhook Feeds saved successfully', 'quillbooking')
						);
						props.setDisabled(true);
					},
					onError(error) {
						// Re-throw to be caught by the outer try-catch
						throw new Error(error.message);
					},
				});
			} catch (error:any) {
				console.error('Error saving webhook feeds:', error);
				// Re-throw the error to maintain existing behavior
				throw new Error(error.message);
			}
		};

		const toggleWebhookStatus = async (feed: WebhookFeedType) => {
			try {
				if (!event || !webhookFeeds) {
					console.warn('Cannot toggle webhook status - missing event or feeds');
					return;
				}
		
				const updatedFeed = { ...feed, enabled: !feed.enabled };
				const updatedWebhookFeeds = webhookFeeds.map((f) =>
					f.name === feed.name ? updatedFeed : f
				);
		
				// Optimistic UI update
				setWebhookFeeds(updatedWebhookFeeds);
		
				await saveApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						webhook_feeds: updatedWebhookFeeds,
					},
					onSuccess() {
						successNotice(
							updatedFeed.enabled
								? __('Webhook enabled successfully', 'quillbooking')
								: __('Webhook disabled successfully', 'quillbooking')
						);
					},
					onError(error) {
						// Revert optimistic update on error
						setWebhookFeeds(webhookFeeds);
						throw new Error(error.message);
					},
				});
			} catch (error:any) {
				console.error('Error toggling webhook status:', error);
				// Re-throw the error to maintain existing behavior
				throw new Error(error.message);
			} finally {
				// Always enable the form regardless of success/error
				props.setDisabled(false);
			}
		};

		const removeWebhookFeed = async (name: string) => {
			try {
				// Validate required data
				if (!event || !webhookFeeds) {
					console.warn('Cannot remove webhook feed - missing event or feeds data');
					return;
				}
		
				// Prepare updated feeds list
				const updatedWebhookFeeds = webhookFeeds.filter(
					(feed) => feed.name !== name
				);
		
				// Make API request
				await deleteApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						webhook_feeds: updatedWebhookFeeds,
					},
					onSuccess() {
						// Update state and show success message
						setWebhookFeeds(updatedWebhookFeeds);
						successNotice(
							__('Webhook Feed deleted successfully', 'quillbooking')
						);
					},
					onError(error) {
						// Re-throw error to be caught by outer try-catch
						throw new Error(error.message);
					},
				});
			} catch (error:any) {
				console.error('Failed to remove webhook feed:', error);
				// Re-throw error if you want calling code to handle it
				throw new Error(error.message);
			} finally {
				// Ensure form is always re-enabled
				props.setDisabled(false);
			}
		};

		const handleAddNew = () => {
			setEditingWebhookFeed(null);
			setShowEditor(true);
		};

		const handleEditClick = (feed: WebhookFeedType) => {
			setEditingWebhookFeed(feed);
			setShowEditor(true);
		};

		if (loading || !webhookFeeds) {
			return <WebhookFeedsShimmer />;
		}

		return (
			<Flex gap={20} className="webhook-feeds-tab w-full px-9">
				<Card className="w-full">
					<Flex
						justify="space-between"
						align="center"
						className="border-b"
					>
						<CardHeader
							title={__('Webhooks Feeds', 'quillbooking')}
							description={__(
								'Manage your webhook integrations',
								'quillbooking'
							)}
							icon={<WebhookListIcon />}
							border={false}
						/>
						{webhookFeeds.length > 0 && (
							<Button
								onClick={handleAddNew}
								icon={<PlusOutlined />}
								className="bg-color-primary text-white border-none shadow-none mb-4"
							>
								{__('Add Webhook', 'quillbooking')}
							</Button>
						)}
					</Flex>

					<Flex vertical gap={30} className="w-full mt-6">
						{webhookFeeds.map((feed) => (
							<Card
								key={feed.name}
								className={`webhook-feed-card ${feed.enabled ? '' : 'webhook-feed-disabled'}`}
							>
								<Flex vertical gap={30}>
									<Flex
										justify="space-between"
										align="center"
									>
										<Flex vertical gap={2}>
											<div className="text-[#09090B] font-medium text-[24px]">
												{feed.name}
											</div>
											<div className="text-[#71717A] font-normal text-[18px]">
												{feed.url}
											</div>
										</Flex>
										<Flex gap={25} align="center">
											<Switch
												key="switch"
												checked={feed.enabled}
												onChange={() =>
													toggleWebhookStatus(feed)
												}
												className="custom-check"
											/>
											<Button
												key="edit"
												onClick={() =>
													handleEditClick(feed)
												}
												className="border border-[#EDEBEB] rounded-md shadow-none p-3"
											>
												<EditIcon />
											</Button>

											<Button
												onClick={() =>
													removeWebhookFeed(feed.name)
												}
												className="border border-[#EDEBEB] rounded-md shadow-none p-3 text-[#B3261E]"
											>
												<TrashIcon
													width={20}
													height={20}
												/>
											</Button>
										</Flex>
									</Flex>

									<Flex gap={15} wrap>
										{feed.triggers.map((trigger) => (
											<Flex
												gap={5}
												align="center"
												key={trigger}
												className="trigger-tag text-[#232323] text-[12px] font-semibold bg-[#EEE7F4] py-1 px-4 rounded-full"
											>
												<div>
													<VerifyIcon />
												</div>
												<div>{trigger}</div>
											</Flex>
										))}
									</Flex>
								</Flex>
							</Card>
						))}

						{webhookFeeds.length === 0 && (
							<Card className="py-12">
								<Flex
									align="center"
									justify="center"
									vertical
									gap={20}
									className="text-[#71717A]"
								>
									<div
										className="bg-color-secondary text-color-primary rounded-xl p-4 cursor-pointer"
										onClick={handleAddNew}
									>
										<AddWebhookIcon />
									</div>
									<div className="text-[22px] text-[#777777] text-center font-medium px-28">
										{__(
											"You don't have any feeds configured. Let's go Create one From here! ",
											'quillbooking'
										)}
									</div>
									<NoWebhookIcon />
								</Flex>
							</Card>
						)}
					</Flex>
				</Card>
				{showEditor && (
					<Card>
						<CardHeader
							title={
								editingWebhookFeed
									? `Edit ${editingWebhookFeed.name}`
									: __('Add Webhook Feed', 'quillbooking')
							}
							description={__(
								'Configure your webhook settings',
								'quillbooking'
							)}
							icon={<WebhookListIcon />}
						/>
						<WebhookFeedComponent
							onSave={handleSave}
							webhookFeed={editingWebhookFeed}
						/>
					</Card>
				)}
			</Flex>
		);
	}
);

export default WebhookFeedsTab;

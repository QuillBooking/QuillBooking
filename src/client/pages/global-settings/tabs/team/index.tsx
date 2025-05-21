/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Card,
	Button,
	Typography,
	Flex,
	Modal,
	Form,
	Popconfirm,
	Checkbox,
	Avatar,
	Empty,
	Col,
	Row,
} from 'antd';

/**
 * Internal dependencies
 */
import { useApi } from '@quillbooking/hooks';
import {
	AddIcon,
	CardHeader,
	EditIcon,
	Header,
	TeamMembersIcon,
	TrashIcon,
	UserSelect,
	NoticeBanner,
} from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';

const { Text } = Typography;

type TeamMember = {
	ID: number;
	display_name: string;
	user_email: string;
	capabilities: Record<string, boolean>;
	is_admin: boolean;
	is_host: boolean;
};

type CapabilityGroup = {
	label?: string;
	capabilities: Record<string, string>;
};

// Shimmer Loader Component
const ShimmerLoader = () => {
	return (
		<div className="w-full">
			<div className="animate-pulse mb-4 flex justify-between items-center border-b pb-4">
				<div className="flex items-center gap-4">
					<div className="w-8 h-8 bg-gray-200 rounded"></div>
					<div>
						<div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
						<div className="h-4 w-64 bg-gray-200 rounded"></div>
					</div>
				</div>
				<div className="w-32 h-9 bg-gray-200 rounded"></div>
			</div>
			<Row gutter={[16, 16]}>
				{[1, 2, 3, 4].map((key) => (
					<Col key={key} xs={24} sm={12} md={8} lg={6}>
						<Card
							className="h-[164px] overflow-hidden"
							bodyStyle={{ padding: '24px' }}
						>
							<div className="animate-pulse flex flex-col gap-4">
								<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
								<div className="space-y-3">
									<div className="h-4 bg-gray-200 rounded w-24"></div>
									<div className="h-3 bg-gray-200 rounded w-20"></div>
									<div className="flex gap-3 mt-2">
										<div className="w-6 h-6 bg-gray-200 rounded"></div>
										<div className="w-6 h-6 bg-gray-200 rounded"></div>
									</div>
								</div>
							</div>
						</Card>
					</Col>
				))}
			</Row>
		</div>
	);
};

const TeamTab: React.FC = () => {
	const [form] = Form.useForm();
	const { callApi } = useApi();
	const { callApi: saveApi, loading: saveLoading } = useApi();
	const { callApi: deleteApi } = useApi();
	const capabilities = ConfigAPI.getCapabilities() as Record<
		string,
		CapabilityGroup
	>;
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);
	const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
	const [selectedUser, setSelectedUser] = useState<number | null>(null);
	const [notice, setNotice] = useState<{
		type: 'success' | 'error';
		message: string;
		title: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchTeamMembers();
	}, []);

	const fetchTeamMembers = () => {
		setIsLoading(true);
		callApi({
			path: 'team-members',
			method: 'GET',
			onSuccess(response: TeamMember[]) {
				setTeamMembers(response || []);
				setIsLoading(false);
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message:
						error.message ||
						__('Failed to fetch team members', 'quillbooking'),
				});
				setIsLoading(false);
			},
		});
	};

	const handleEditMember = (member: TeamMember) => {
		setCurrentMember(member);

		const groupedCapabilities = Object.entries(capabilities).reduce(
			(acc, [groupKey, group]) => {
				acc[groupKey] = Object.keys(group.capabilities).filter(
					(cap) => member.capabilities[cap]
				);
				return acc;
			},
			{} as Record<string, string[]>
		);

		form.setFieldsValue({
			capabilities: groupedCapabilities,
		});
		setIsModalVisible(true);
	};

	const handleRemoveMember = async (memberId: number) => {
		try {
			await deleteApi({
				path: `team-members/${memberId}`,
				method: 'DELETE',
				onSuccess(response: {
					success: boolean;
					message: string;
					id: number;
				}) {
					if (response.success) {
						setTeamMembers((prevMembers) =>
							prevMembers.filter(
								(member) => member.ID !== response.id
							)
						);
						setNotice({
							type: 'success',
							title: __('Success', 'quillbooking'),
							message: response.message,
						});
					}
				},
				onError(error) {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message:
							error.message ||
							__('Failed to remove team member', 'quillbooking'),
					});
				},
			});
		} catch (error) {
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __('An unexpected error occurred while removing the team member', 'quillbooking'),
			});
			console.error('Error in handleRemoveMember:', error);
		}
	};

	const handleEditSubmit = async (values: {
		capabilities: Record<string, string[]>;
	}) => {
		try {
			if (!currentMember) return;
			const allCapabilities = Object.values(values.capabilities || {}).flat();

			await saveApi({
				path: `team-members/${currentMember.ID}`,
				method: 'PUT',
				data: {
					capabilities: allCapabilities,
				},
				onSuccess() {
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __('Team member updated successfully', 'quillbooking'),
					});
					setIsModalVisible(false);
					fetchTeamMembers();
				},
				onError(error) {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message:
							error.message ||
							__('Failed to update team member', 'quillbooking'),
					});
				},
			});
		} catch (error) {
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __('An unexpected error occurred while updating the team member', 'quillbooking'),
			});
			console.error('Error in handleEditSubmit:', error);
		}
	};

	const handleAddMember = async () => {
		try {
			// Validate selected user
			if (!selectedUser) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __('Please select a user', 'quillbooking'),
				});
				return;
			}

			// Validate capabilities
			const groupedCapabilities = form.getFieldValue('capabilities') || {};
			const allCapabilities = Object.values(groupedCapabilities).flat();

			if (!allCapabilities.length) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __('Please select at least one capability', 'quillbooking'),
				});
				return;
			}

			// API call
			await saveApi({
				path: 'team-members',
				method: 'POST',
				data: {
					user_id: selectedUser,
					capabilities: allCapabilities,
				},
				onSuccess() {
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __('Team member added successfully', 'quillbooking'),
					});
					setIsAddModalVisible(false);
					setSelectedUser(null);
					form.resetFields();
					fetchTeamMembers();
				},
				onError(error) {
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: error.message || __('Failed to add team member', 'quillbooking'),
					});
				},
			});
		} catch (error) {
			// Handle unexpected errors
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __('An unexpected error occurred while adding the team member', 'quillbooking'),
			});
			console.error('Error in handleAddMember:', error);

			// Reset form state on critical errors if needed
			setIsAddModalVisible(false);
			setSelectedUser(null);
			form.resetFields();
		}
	};

	const renderCapabilityGroups = () => {
		return (
			<>
				<div className="text-[#09090B] text-[16px] mb-2">
					{__('Access Permissions for this user', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				{Object.entries(capabilities).map(([key, group]) => (
					<div key={key} className="capability-group mb-4">
						<div className="text-[#3F4254] font-medium mb-2 capitalize">
							{group.label || key}
						</div>
						<Form.Item
							name={['capabilities', key]}
							valuePropName="value"
						>
							<Checkbox.Group className="flex flex-col gap-2">
								{Object.entries(group.capabilities).map(
									([capKey, capLabel]) => (
										<Checkbox
											key={capKey}
											value={capKey}
											className="custom-check text-[#3F4254] font-semibold"
										>
											{capLabel}
										</Checkbox>
									)
								)}
							</Checkbox.Group>
						</Form.Item>
					</div>
				))}
			</>
		);
	};

	if (isLoading && !teamMembers.length) {
		return <ShimmerLoader />;
	}

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((part) => part.charAt(0).toUpperCase())
			.join('')
			.slice(0, 2);
	};

	return (
		<div className="team-tab w-full">
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}
			<Card className="settings-card rounded-lg w-full">
				<Flex
					justify="space-between"
					align="center"
					className="border-b mb-4"
				>
					<CardHeader
						title={__('Team Members', 'quillbooking')}
						description={__(
							'Grant Team Members Access to QuillBookings for Calendar and Booking Management.',
							'quillbooking'
						)}
						icon={<TeamMembersIcon />}
						border={false}
					/>
					<Button
						type="text"
						icon={<AddIcon />}
						onClick={() => {
							form.resetFields();
							setIsAddModalVisible(true);
						}}
						className="bg-color-primary text-white px-5"
					>
						{__('Team Member', 'quillbooking')}
					</Button>
				</Flex>

				{teamMembers.length === 0 ? (
					<Empty
						description={__(
							'No team members found',
							'quillbooking'
						)}
						image={Empty.PRESENTED_IMAGE_SIMPLE}
					/>
				) : (
					<Row gutter={[16, 16]}>
						{teamMembers.map((member) => (
							<Col key={member.ID} xs={24} sm={12} md={8} lg={6}>
								<Card className="h-[164px]">
									<Flex
										vertical
										gap={10}
										align="flex-start"
										justify=""
									>
										<Avatar size="large">
											{getInitials(member.display_name)}
										</Avatar>
										<div className="text-[#3F4254] font-semibold text-base">
											{member.display_name}
										</div>
										{member.is_admin ? (
											<Text type="secondary" key="admin">
												{__(
													'Administrator',
													'quillbooking'
												)}
											</Text>
										) : (
											<Flex gap={20} key="actions">
												<Button
													onClick={() =>
														handleEditMember(member)
													}
													className="border-none outline-none p-0"
												>
													<EditIcon />
												</Button>
												{!member.is_host && (
													<Popconfirm
														title={__(
															'Are you sure you want to remove this team member?',
															'quillbooking'
														)}
														onConfirm={() =>
															handleRemoveMember(
																member.ID
															)
														}
														okText={__(
															'Yes',
															'quillbooking'
														)}
														cancelText={__(
															'No',
															'quillbooking'
														)}
													>
														<Button
															danger
															className="border-none outline-none p-0"
														>
															<TrashIcon />
														</Button>
													</Popconfirm>
												)}
											</Flex>
										)}
									</Flex>
								</Card>
							</Col>
						))}
					</Row>
				)}
			</Card>

			<Modal
				open={isModalVisible}
				onCancel={() => setIsModalVisible(false)}
				footer={null}
				width={600}
			>
				{currentMember && (
					<>
						<Header
							header={__(
								`Edit ${currentMember.display_name} Permissions`,
								'quillbooking'
							)}
							subHeader={__(
								'Edit the following data',
								'quillbooking'
							)}
						/>

						<Form
							form={form}
							layout="vertical"
							onFinish={handleEditSubmit}
							className="mt-4"
						>
							{renderCapabilityGroups()}
							<Button
								key="submit"
								type="primary"
								loading={saveLoading}
								onClick={() => form.submit()}
								className="mt-4 w-full"
							>
								{__('Save', 'quillbooking')}
							</Button>
						</Form>
					</>
				)}
			</Modal>

			<Modal
				open={isAddModalVisible}
				onCancel={() => setIsAddModalVisible(false)}
				footer={null}
				width={600}
			>
				<Header
					header={__('Add Team Member', 'quillbooking')}
					subHeader={__('Add the following data', 'quillbooking')}
				/>
				<div className="my-4">
					<Form form={form} layout="vertical">
						<Form.Item
							rules={[
								{
									required: true,
									message: __(
										'Please select a user',
										'quillbooking'
									),
								},
							]}
						>
							<div className="text-[#09090B] text-[16px]">
								{__('Select Team Member', 'quillbooking')}
								<span className="text-red-500">*</span>
							</div>
							<UserSelect
								value={selectedUser || 0}
								onChange={(value) => setSelectedUser(value)}
								placeholder={__(
									'Search and select a user',
									'quillbooking'
								)}
								exclude={teamMembers.map((member) => member.ID)}
							/>
						</Form.Item>
						{renderCapabilityGroups()}
						<Button
							key="submit"
							type="primary"
							loading={saveLoading}
							onClick={handleAddMember}
							className="mt-4 w-full"
						>
							{__('Add Team Member', 'quillbooking')}
						</Button>
					</Form>
				</div>
			</Modal>
		</div>
	);
};

export default TeamTab;

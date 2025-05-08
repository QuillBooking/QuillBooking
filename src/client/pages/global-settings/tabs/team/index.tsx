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
    Skeleton,
    Flex,
    Modal,
    Form,
    Popconfirm,
    Checkbox,
    Avatar,
    Empty,
    Col,
    Row
} from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { AddIcon, CardHeader, EditIcon, Header, TeamMembersIcon, TrashIcon, UserSelect } from '@quillbooking/components';
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

const TeamTab: React.FC = () => {
    const [form] = Form.useForm();
    const { callApi, loading } = useApi();
    const { callApi: saveApi, loading: saveLoading } = useApi();
    const { callApi: deleteApi } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const capabilities = ConfigAPI.getCapabilities();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = () => {
        callApi({
            path: 'team-members',
            method: 'GET',
            onSuccess(response: TeamMember[]) {
                setTeamMembers(response || []);
            },
            onError(error) {
                errorNotice(error.message || __('Failed to fetch team members', 'quillbooking'));
            },
        });
    };

    const handleEditMember = (member: TeamMember) => {
        setCurrentMember(member);

        const groupedCapabilities = Object.entries(capabilities).reduce((acc, [groupKey, group]) => {
            acc[groupKey] = Object.keys(group.capabilities).filter(cap => member.capabilities[cap]);
            return acc;
        }, {} as Record<string, string[]>);

        form.setFieldsValue({
            capabilities: groupedCapabilities,
        });
        setIsModalVisible(true);
    };

    const handleRemoveMember = (memberId: number) => {
        deleteApi({
            path: `team-members/${memberId}`,
            method: 'DELETE',
            onSuccess() {
                successNotice(__('Team member removed successfully', 'quillbooking'));
                fetchTeamMembers();
            },
            onError(error) {
                errorNotice(error.message || __('Failed to remove team member', 'quillbooking'));
            },
        });
    };

    const handleEditSubmit = (values: { capabilities: string[] }) => {
        if (!currentMember) return;
        const allCapabilities = Object.values(values.capabilities || {}).flat();

        saveApi({
            path: `team-members/${currentMember.ID}`,
            method: 'PUT',
            data: {
                capabilities: allCapabilities,
            },
            onSuccess() {
                successNotice(__('Team member updated successfully', 'quillbooking'));
                setIsModalVisible(false);
                fetchTeamMembers();
            },
            onError(error) {
                errorNotice(error.message || __('Failed to update team member', 'quillbooking'));
            },
        });
    };

    const handleAddMember = () => {
        if (!selectedUser) {
            errorNotice(__('Please select a user', 'quillbooking'));
            return;
        }

        const capabilities = form.getFieldValue('capabilities') || [];

        saveApi({
            path: 'team-members',
            method: 'POST',
            data: {
                user_id: selectedUser,
                capabilities: capabilities,
            },
            onSuccess() {
                successNotice(__('Team member added successfully', 'quillbooking'));
                setIsAddModalVisible(false);
                setSelectedUser(null);
                form.resetFields();
                fetchTeamMembers();
            },
            onError(error) {
                errorNotice(error.message || __('Failed to add team member', 'quillbooking'));
            },
        });
    };

    const renderCapabilityGroups = () => {
        return (
            <>
                <div className="text-[#09090B] text-[16px] mb-2">
                    {__('Access Permissions for this user', 'quillbooking')}
                    <span className="text-red-500">*</span>
                </div>
                {Object.entries(capabilities).map(([key, group]) => (
                    <div key={key} className="capability-group">
                        <Form.Item name={["capabilities", key]} noStyle>
                            {Object.entries(group.capabilities).map(([capKey, capLabel]) => (
                                <div key={capKey} className="mb-2">
                                    <Checkbox value={capKey} className="custom-check text-[#3F4254] font-semibold">
                                        {capLabel}
                                    </Checkbox>
                                </div>
                            ))}
                        </Form.Item>
                    </div>
                ))}
            </>
        );
    };

    if (loading && !teamMembers.length) {
        return <Skeleton active />;
    }

    const getInitials = (name: string) => {
        return name.split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    };

    return (
        <div className="team-tab w-full">
            <Card className="settings-card rounded-lg w-full">
                <Flex justify='space-between' align='center' className='border-b mb-4'>
                    <CardHeader title={__('Team Members', 'quillbooking')}
                        description={__(
                            'Grant Team Members Access to FluentBookings for Calendar and Booking Management.',
                            'quillbooking'
                        )}
                        icon={<TeamMembersIcon />}
                        border={false} />
                    <Button
                        type='text'
                        icon={<AddIcon />}
                        onClick={() => {
                            form.resetFields();
                            setIsAddModalVisible(true);
                        }}
                        className='bg-color-primary text-white px-5'
                    >
                        {__('Team Member', 'quillbooking')}
                    </Button>
                </Flex>

                {teamMembers.length === 0 ? (
                    <Empty
                        description={__('No team members found', 'quillbooking')}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {teamMembers.map((member) => (
                            <Col key={member.ID} xs={24} sm={12} md={8} lg={6}>
                                <Card className='h-[164px]'>
                                    <Flex vertical gap={10} align='flex-start' justify=''>
                                        <Avatar size="large">{getInitials(member.display_name)}</Avatar>
                                        <div className='text-[#3F4254] font-semibold text-base'>{member.display_name}</div>
                                        {
                                            member.is_admin
                                                ? [<Text type="secondary" key="admin">{__('Administrator', 'quillbooking')}</Text>]
                                                : [
                                                    <Flex gap={20}>
                                                        <Button
                                                            key="edit"
                                                            onClick={() => handleEditMember(member)}
                                                            className='border-none outline-none p-0'
                                                        >
                                                            <EditIcon />
                                                        </Button>
                                                        {!member.is_host && (
                                                            <Popconfirm
                                                                key="delete"
                                                                title={__('Are you sure you want to remove this team member?', 'quillbooking')}
                                                                onConfirm={() => handleRemoveMember(member.ID)}
                                                                okText={__('Yes', 'quillbooking')}
                                                                cancelText={__('No', 'quillbooking')}
                                                            >
                                                                <Button danger className='border-none outline-none p-0'>
                                                                    <TrashIcon />
                                                                </Button>
                                                            </Popconfirm>
                                                        )}
                                                    </Flex>
                                                ]
                                        }
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
                        <Header header={__(`Edit ${currentMember.display_name} Permissions`, "quillbooking")}
                            subHeader={__("Edit the following data", "quillbooking")} />

                        {/* <div className="my-4">
                            <Text strong>{currentMember.display_name}</Text>
                        </div> */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleEditSubmit}
                            className='mt-4'
                        >
                            {renderCapabilityGroups()}
                            <Button
                                key="submit"
                                type="primary"
                                loading={saveLoading}
                                onClick={() => form.submit()}
                                className='mt-4 w-full'
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
                <Header header={__("Add Team Member", "quillbooking")}
                    subHeader={__("Add the following data", "quillbooking")} />
                <div className="my-4">
                    <Form form={form} layout="vertical">
                        <Form.Item
                            rules={[
                                {
                                    required: true,
                                    message: __('Please select a user', 'quillbooking')
                                }
                            ]}
                        >
                            <div className="text-[#09090B] text-[16px]">
                                {__('Select Team Member', 'quillbooking')}
                                <span className="text-red-500">*</span>
                            </div>
                            <UserSelect
                                value={selectedUser || 0}
                                onChange={(value) => setSelectedUser(value)}
                                placeholder={__('Search and select a user', 'quillbooking')}
                                exclude={teamMembers.map(member => member.ID)}
                            />
                        </Form.Item>
                        {renderCapabilityGroups()}
                        <Button
                            key="submit"
                            type="primary"
                            loading={saveLoading}
                            onClick={handleAddMember}
                            className='mt-4 w-full'
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
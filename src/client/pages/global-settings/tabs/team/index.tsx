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
    List,
    Skeleton,
    Flex,
    Modal,
    Form,
    Popconfirm,
    Checkbox,
    Avatar,
    Empty,
    Space
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { Header, UserSelect } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';

const { Title, Text } = Typography;

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
        return Object.entries(capabilities).map(([key, group]) => (
            <div key={key} className="capability-group mb-4">
                <Title level={5}>{group.title}</Title>
                <Form.Item name={["capabilities", key]} noStyle>
                    <Checkbox.Group>
                        {Object.entries(group.capabilities).map(([capKey, capLabel]) => (
                            <div key={capKey} className="mb-2">
                                <Checkbox value={capKey}>{capLabel}</Checkbox>
                            </div>
                        ))}
                    </Checkbox.Group>
                </Form.Item>
            </div>
        ));
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
        <div className="team-tab">
            <Card className="settings-card rounded-lg">
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-2'>
                        <TeamOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <Header
                        header={__('Team Members', 'quillbooking')}
                        subHeader={__(
                            'Team Members Access to QuillBookings for Calendar and Booking Management',
                            'quillbooking'
                        )}
                    />
                </Flex>

                {teamMembers.length === 0 ? (
                    <Empty
                        description={__('No team members found', 'quillbooking')}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <List
                        dataSource={teamMembers}
                        renderItem={(member) => (
                            <List.Item
                                key={member.ID}
                                actions={[
                                    member.is_admin ? (
                                        <Text type="secondary">{__('Administrator', 'quillbooking')}</Text>
                                    ) : (
                                        <Space>
                                            <Button
                                                icon={<EditOutlined />}
                                                onClick={() => handleEditMember(member)}
                                            >
                                                {__('Edit', 'quillbooking')}
                                            </Button>
                                            {!member.is_host && (
                                                    <Popconfirm
                                                        title={__('Are you sure you want to remove this team member?', 'quillbooking')}
                                                        onConfirm={() => handleRemoveMember(member.ID)}
                                                        okText={__('Yes', 'quillbooking')}
                                                        cancelText={__('No', 'quillbooking')}
                                                    >
                                                        <Button icon={<DeleteOutlined />} danger>
                                                            {__('Remove', 'quillbooking')}
                                                        </Button>
                                                    </Popconfirm>
                                            )}
                                        </Space>
                                    )
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar size="large">
                                            {getInitials(member.display_name)}
                                        </Avatar>
                                    }
                                    title={member.display_name}
                                    description={member.user_email}
                                />
                            </List.Item>
                        )}
                    />
                )}

                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        form.resetFields();
                        setIsAddModalVisible(true);
                    }}
                    style={{ marginTop: 16 }}
                >
                    {__('Add Team Member', 'quillbooking')}
                </Button>
            </Card>

            <Modal
                title={__('Edit Team Member Permissions', 'quillbooking')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                        {__('Cancel', 'quillbooking')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={saveLoading}
                        onClick={() => form.submit()}
                    >
                        {__('Save', 'quillbooking')}
                    </Button>
                ]}
                width={600}
            >
                {currentMember && (
                    <>
                        <div className="mb-4">
                            <Text strong>{currentMember.display_name}</Text>
                            <br />
                            <Text type="secondary">{currentMember.user_email}</Text>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleEditSubmit}
                        >
                            {renderCapabilityGroups()}
                        </Form>
                    </>
                )}
            </Modal>

            <Modal
                title={__('Add Team Member', 'quillbooking')}
                open={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
                        {__('Cancel', 'quillbooking')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={saveLoading}
                        onClick={handleAddMember}
                    >
                        {__('Add', 'quillbooking')}
                    </Button>
                ]}
                width={600}
            >
                <div className="mb-4">
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label={__('Select User', 'quillbooking')}
                            rules={[
                                {
                                    required: true,
                                    message: __('Please select a user', 'quillbooking')
                                }
                            ]}
                        >
                            <UserSelect
                                value={selectedUser || 0}
                                onChange={(value) => setSelectedUser(value)}
                                placeholder={__('Search and select a user', 'quillbooking')}
                                exclude={teamMembers.map(member => member.ID)}
                            />
                        </Form.Item>

                        {renderCapabilityGroups()}
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default TeamTab;